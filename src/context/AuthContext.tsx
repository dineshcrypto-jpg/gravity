"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
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
    // Check active sessions and set the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change event:", event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Parse URL params for errors
    if (typeof window !== "undefined") {
      let errorParam: string | null = null;
      let errorDescParam: string | null = null;

      // 1. Check in URL search params (e.g. ?error=...)
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has("error")) {
        errorParam = searchParams.get("error");
        errorDescParam = searchParams.get("error_description");
      }

      // 2. Check in URL hash params (e.g. #error=...)
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

        // Clear error params/hash from history
        const newUrl = window.location.pathname;
        window.history.replaceState(null, "", newUrl);
      }
    }

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signInWithMagicLink = async (email: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithGoogle, signInWithMagicLink, signOut, authError, clearAuthError }}>
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
