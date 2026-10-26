import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Secret used to sign admin session tokens
// Can be customized via environment variable ADMIN_AUTH_SECRET
const AUTH_SECRET = process.env.ADMIN_AUTH_SECRET || "ksn-super-store-secure-admin-secret-key-2026";
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "2218";
const COOKIE_NAME = "ksn_admin_session";

// In-memory rate limiting to protect against brute-force password guessing
// Max 5 attempts per 60 seconds per IP address
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60 * 1000 });
    return false;
  }

  if (record.count >= 5) {
    return true;
  }

  record.count += 1;
  return false;
}

function createSignedSessionToken(): string {
  const payload = JSON.stringify({
    role: "admin",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifySignedSessionToken(token: string): boolean {
  if (!token || !token.includes(".")) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");

  if (signature !== expectedSignature) return false;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) {
      return false;
    }
    return payload.role === "admin";
  } catch {
    return false;
  }
}

// GET: Check if current session is authorized
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME);
  if (!cookie?.value) {
    return NextResponse.json({ authorized: false });
  }

  const isValid = verifySignedSessionToken(cookie.value);
  return NextResponse.json({ authorized: isValid });
}

// POST: Log in with passcode
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "Too many failed attempts. Please wait 1 minute." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { passcode } = body;

    if (!passcode || typeof passcode !== "string") {
      return NextResponse.json(
        { success: false, error: "Passcode is required." },
        { status: 400 }
      );
    }

    if (passcode.trim() === ADMIN_PASSCODE.trim()) {
      const token = createSignedSessionToken();
      const response = NextResponse.json({ success: true });

      response.cookies.set({
        name: COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: "Incorrect Passcode. Access Denied." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request format." },
      { status: 400 }
    );
  }
}

// DELETE: Log out
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
