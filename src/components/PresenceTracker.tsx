"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

declare global {
  interface Window {
    __KSN_ONLINE_COUNT__?: number;
    __KSN_ONLINE_PAGES__?: Record<string, number>;
  }
}

export default function PresenceTracker() {
  const pathname = usePathname();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);
  const visitorIdRef = useRef<string>("");
  const pathnameRef = useRef<string>(pathname);

  // Keep pathname ref always updated
  pathnameRef.current = pathname;

  // 1. Initialise Presence Channel ONCE on mount (does not teardown on navigation)
  useEffect(() => {
    // Generate or retrieve persistent visitor ID for this user/session
    let visitorId = "";
    if (typeof window !== "undefined") {
      visitorId = sessionStorage.getItem("ksn_visitor_id") || localStorage.getItem("ksn_visitor_id") || "";
      if (!visitorId) {
        visitorId = `v_${Math.random().toString(36).substring(2, 9)}`;
        try {
          sessionStorage.setItem("ksn_visitor_id", visitorId);
          localStorage.setItem("ksn_visitor_id", visitorId);
        } catch {}
      }
    }
    visitorIdRef.current = visitorId;

    const channelName = "online-visitors";

    // Clean up any stale channel instance with the same topic
    const existing = supabase.getChannels().find((c) => c.topic === `realtime:${channelName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: visitorId,
        },
      },
    });

    channelRef.current = channel;

    // Listen for presence changes
    channel
      .on("presence", { event: "sync" }, () => {
        try {
          const state = channel.presenceState();
          
          // CRITICAL FIX: Count UNIQUE visitor keys (visitorId), NOT flattened array length!
          // 1 person visiting 3 pages will always have 1 key in `state`.
          const uniqueVisitorKeys = Object.keys(state);
          const count = Math.max(1, uniqueVisitorKeys.length);

          const pages: Record<string, number> = {};
          uniqueVisitorKeys.forEach((key) => {
            const visitorPresences = state[key] as Array<{ page?: string }>;
            if (visitorPresences && visitorPresences.length > 0) {
              // The last entry is the visitor's most recent page
              const latest = visitorPresences[visitorPresences.length - 1];
              const p = latest?.page || "/";
              pages[p] = (pages[p] || 0) + 1;
            }
          });

          if (typeof window !== "undefined") {
            window.__KSN_ONLINE_COUNT__ = count;
            window.__KSN_ONLINE_PAGES__ = pages;
            window.dispatchEvent(
              new CustomEvent("ksn_presence_sync", {
                detail: { count, pages },
              })
            );
          }
        } catch (e) {
          console.warn("Presence sync note:", e);
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          isSubscribedRef.current = true;
          try {
            await channel.track({
              id: visitorId,
              page: pathnameRef.current || "/",
              online_at: new Date().toISOString(),
            });
          } catch (err) {
            console.warn("Presence track note:", err);
          }
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          isSubscribedRef.current = false;
        }
      });

    return () => {
      isSubscribedRef.current = false;
      try {
        channel.untrack();
        supabase.removeChannel(channel);
      } catch {}
      channelRef.current = null;
    };
  }, []); // Run ONCE on mount

  // 2. When pathname changes, simply update presence state in place without reconnecting
  useEffect(() => {
    if (channelRef.current && isSubscribedRef.current && visitorIdRef.current) {
      channelRef.current
        .track({
          id: visitorIdRef.current,
          page: pathname || "/",
          online_at: new Date().toISOString(),
        })
        .catch((err) => console.warn("Presence route update note:", err));
    }
  }, [pathname]);

  return null;
}
