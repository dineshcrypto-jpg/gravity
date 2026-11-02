"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    __KSN_ONLINE_COUNT__?: number;
    __KSN_ONLINE_PAGES__?: Record<string, number>;
  }
}

export default function PresenceTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Generate or retrieve persistent visitor ID for this session
    let visitorId = sessionStorage.getItem("ksn_visitor_id");
    if (!visitorId) {
      visitorId = `v_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem("ksn_visitor_id", visitorId);
    }

    const channelName = "online-visitors";
    
    // Safely remove any existing channel to prevent duplicate subscribe conflicts
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

    // Register presence listener BEFORE subscribing
    channel
      .on("presence", { event: "sync" }, () => {
        try {
          const state = channel.presenceState();
          const visitors = Object.values(state).flat() as Array<{ id?: string; page?: string }>;
          const count = Math.max(1, visitors.length);
          
          const pages: Record<string, number> = {};
          visitors.forEach((v) => {
            const p = v.page || "/";
            pages[p] = (pages[p] || 0) + 1;
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
          try {
            await channel.track({
              id: visitorId,
              page: pathname || "/",
              online_at: new Date().toISOString(),
            });
          } catch (err) {
            console.warn("Presence track note:", err);
          }
        }
      });

    return () => {
      try {
        channel.untrack();
        supabase.removeChannel(channel);
      } catch {}
    };
  }, [pathname]);

  return null;
}
