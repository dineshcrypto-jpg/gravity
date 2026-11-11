import crypto from "crypto";
import fs from "fs";
import path from "path";
import { supabase } from "./supabase";

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BBhOWcAk-M9wOAyN4UsmVm7PSDrGdl4bO6810nxNghx8UJKOFrSTBCfw1bPRygvxuCa2BTDmb68hcEYcbtg6Mr0";

const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "8Zir7lIBGbQZEIen9r33h0CN0bh_gE6aUZrXAWhZ3qI";

const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:ksnsuperstore1@gmail.com";

const SUBSCRIPTIONS_FILE = path.join(process.cwd(), ".push_subscriptions.json");

// Local file storage helpers for resilience
function readLocalSubscriptions(): PushSubscriptionData[] {
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const data = fs.readFileSync(SUBSCRIPTIONS_FILE, "utf8");
      return JSON.parse(data) || [];
    }
  } catch (err) {
    console.warn("Could not read local push subscriptions file:", err);
  }
  return [];
}

function writeLocalSubscriptions(subs: PushSubscriptionData[]) {
  try {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subs, null, 2), "utf8");
  } catch (err) {
    console.warn("Could not write local push subscriptions file:", err);
  }
}

/**
 * Save a push subscription in both Supabase (if table exists) and local backup
 */
export async function savePushSubscription(sub: PushSubscriptionData) {
  // 1. Local backup
  const local = readLocalSubscriptions();
  const existingIndex = local.findIndex((s) => s.endpoint === sub.endpoint);
  if (existingIndex >= 0) {
    local[existingIndex] = sub;
  } else {
    local.push(sub);
  }
  writeLocalSubscriptions(local);

  // 2. Supabase table (fail-soft if table doesn't exist)
  try {
    await supabase.from("push_subscriptions").upsert(
      {
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );
  } catch (err) {
    console.warn("Supabase push_subscriptions upsert notice:", err);
  }
}

/**
 * Remove a push subscription (e.g. when unregistered or expired)
 */
export async function removePushSubscription(endpoint: string) {
  const local = readLocalSubscriptions().filter((s) => s.endpoint !== endpoint);
  writeLocalSubscriptions(local);

  try {
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
  } catch (err) {
    console.warn("Supabase push_subscriptions delete notice:", err);
  }
}

/**
 * Get all active subscriptions
 */
export async function getAllPushSubscriptions(): Promise<PushSubscriptionData[]> {
  const subscriptionsMap = new Map<string, PushSubscriptionData>();

  // 1. Add local subscriptions
  const local = readLocalSubscriptions();
  for (const s of local) {
    subscriptionsMap.set(s.endpoint, s);
  }

  // 2. Add Supabase subscriptions
  try {
    const { data, error } = await supabase.from("push_subscriptions").select("*");
    if (!error && data) {
      for (const row of data) {
        if (row.endpoint && row.p256dh && row.auth) {
          subscriptionsMap.set(row.endpoint, {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          });
        }
      }
    }
  } catch (err) {
    console.warn("Supabase push_subscriptions fetch notice:", err);
  }

  return Array.from(subscriptionsMap.values());
}

/**
 * Create a signed VAPID JWT token
 */
function createVapidToken(audience: string): string {
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.setPrivateKey(Buffer.from(VAPID_PRIVATE_KEY, "base64url"));

  const pubKey = Buffer.from(VAPID_PUBLIC_KEY, "base64url");
  const jwk = {
    kty: "EC",
    crv: "P-256",
    x: pubKey.subarray(1, 33).toString("base64url"),
    y: pubKey.subarray(33, 65).toString("base64url"),
    d: VAPID_PRIVATE_KEY,
  };

  const privKeyObj = crypto.createPrivateKey({ format: "jwk", key: jwk });

  const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 43200,
      sub: VAPID_SUBJECT,
    })
  ).toString("base64url");

  const unsignedToken = `${header}.${payload}`;
  const signature = crypto
    .sign("SHA256", Buffer.from(unsignedToken), {
      key: privKeyObj,
      dsaEncoding: "ieee-p1363",
    })
    .toString("base64url");

  return `${unsignedToken}.${signature}`;
}

/**
 * RFC 8291 Message Encryption for Web Push (aes128gcm)
 */
function encryptPayload(subscription: PushSubscriptionData, payloadString: string): Buffer {
  const clientPublicKey = Buffer.from(subscription.keys.p256dh, "base64url");
  const clientAuth = Buffer.from(subscription.keys.auth, "base64url");

  const salt = crypto.randomBytes(16);
  const serverEcdh = crypto.createECDH("prime256v1");
  serverEcdh.generateKeys();
  const serverPublicKey = serverEcdh.getPublicKey();

  const sharedSecret = serverEcdh.computeSecret(clientPublicKey);

  // 1. HKDF info: "WebPush: info\0" + clientPublicKey + serverPublicKey
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0", "utf8"),
    clientPublicKey,
    serverPublicKey,
  ]);

  const prk = Buffer.from(crypto.hkdfSync("sha256", sharedSecret, clientAuth, keyInfo, 32));

  // 2. CEK
  const cekInfo = Buffer.from("Content-Encoding: aes128gcm\0", "utf8");
  const cek = Buffer.from(crypto.hkdfSync("sha256", prk, salt, cekInfo, 16));

  // 3. Nonce
  const nonceInfo = Buffer.from("Content-Encoding: nonce\0", "utf8");
  const nonce = Buffer.from(crypto.hkdfSync("sha256", prk, salt, nonceInfo, 12));

  // 4. Record size: 4096 with \2 delimiter
  const recordSize = 4096;
  const padding = Buffer.from([0x02]);
  const plaintext = Buffer.concat([Buffer.from(payloadString, "utf8"), padding]);

  const cipher = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Header: salt (16 bytes) + recordSize (4 bytes BE) + idlen (1 byte = 65) + serverPublicKey (65 bytes)
  const rsBuf = Buffer.alloc(4);
  rsBuf.writeUInt32BE(recordSize, 0);

  const header = Buffer.concat([
    salt,
    rsBuf,
    Buffer.from([serverPublicKey.length]),
    serverPublicKey,
  ]);

  return Buffer.concat([header, encrypted, tag]);
}

/**
 * Send a web push notification to a specific subscription
 */
export async function sendWebPush(
  subscription: PushSubscriptionData,
  data: { title: string; body: string; url?: string }
): Promise<boolean> {
  try {
    const url = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const vapidJwt = createVapidToken(audience);

    const payloadStr = JSON.stringify(data);
    const encryptedBody = encryptPayload(subscription, payloadStr);

    const res = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        TTL: "86400",
        Urgency: "high",
        Authorization: `vapid t=${vapidJwt}, k=${VAPID_PUBLIC_KEY}`,
        "Content-Encoding": "aes128gcm",
        "Content-Type": "application/octet-stream",
        "Content-Length": String(encryptedBody.length),
      },
      body: encryptedBody,
    });

    if (res.status === 201 || res.status === 200) {
      return true;
    }

    if (res.status === 410 || res.status === 404) {
      // Subscription expired or unregistered by browser
      console.log(`Push subscription expired (${res.status}), removing...`);
      await removePushSubscription(subscription.endpoint);
      return false;
    }

    const errorText = await res.text().catch(() => "");
    console.warn(`Push service returned HTTP ${res.status}:`, errorText);
    return false;
  } catch (err) {
    console.warn("Failed to send web push:", err);
    return false;
  }
}

/**
 * Notify all registered admin devices
 */
export async function notifyAllAdmins(data: {
  title: string;
  body: string;
  url?: string;
}): Promise<{ total: number; sent: number }> {
  const subscriptions = await getAllPushSubscriptions();
  if (subscriptions.length === 0) {
    console.log("No admin push subscriptions found.");
    return { total: 0, sent: 0 };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendWebPush(sub, data))
  );

  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
  console.log(`Push notification sent to ${sent}/${subscriptions.length} devices.`);
  return { total: subscriptions.length, sent };
}
