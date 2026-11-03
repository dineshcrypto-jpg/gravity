"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    // 1. Initial active session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user ?? null);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes (sign-in, token refresh, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user ?? null);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
      }
      setLoading(false);
    });

    // 3. Parse URL params for errors or tokens
    if (typeof window !== "undefined") {
      let errorParam: string | null = null;
      let errorDescParam: string | null = null;

      // Check search params
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("error")) {
        errorParam = searchParams.get("error");
        errorDescParam = searchParams.get("error_description");
      }

      // Check hash params
      if (window.location.hash && !errorParam) {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        if (hashParams.has("error")) {
          errorParam = hashParams.get("error");
          errorDescParam = hashParams.get("error_description");
        }
      }

      if (errorParam) {
        const parsedDesc = errorDescParam ? decodeURIComponent(errorDescParam).replace(/\+/g, " ") : null;
        setTimeout(() => setAuthError(parsedDesc || errorParam), 0);

        // Clear error params from history cleanly
        const newUrl = window.location.pathname;
        window.history.replaceState(null, "", newUrl);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = async (email: string) => {
    setAuthError(null);

    // Determine redirect URL: prioritize NEXT_PUBLIC_SITE_URL if configured, otherwise window.location.origin
    let redirectUrl: string | undefined = undefined;
    if (typeof window !== "undefined") {
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        redirectUrl = process.env.NEXT_PUBLIC_SITE_URL;
      } else {
        redirectUrl = window.location.origin;
      }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) throw error;
  };

  const verifyOtp = async (email: string, token: string) => {
    setAuthError(null);
    let { data, error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: "email",
    });

    if (error) {
      // Fallback attempt with type: 'magiclink'
      const retry = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: token.trim(),
        type: "magiclink",
      });
      if (!retry.error) {
        data = retry.data;
        error = null;
      }
    }

    if (error) throw error;

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithMagicLink, verifyOtp, signOut, authError, clearAuthError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
