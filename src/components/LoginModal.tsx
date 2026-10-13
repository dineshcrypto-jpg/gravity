"use client";

import React, { useState, useEffect } from "react";
import { X, Mail, Loader2, Sparkles, CheckCircle2, ArrowLeft, RefreshCw, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { signInWithMagicLink, verifyOtp, authError, clearAuthError } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("saved_login_email");
      if (saved && !email) {
        setEmail(saved);
      }
    }
  }, []);

  if (!isOpen) return null;

  const activeError = error || authError;

  const handleClose = () => {
    setError(null);
    clearAuthError();
    setIsSent(false);
    setIsVerified(false);
    setOtp("");
    setResendStatus(null);
    onClose();
  };

  const handleSendLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    clearAuthError();
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("saved_login_email", email.trim());
      }
      await signInWithMagicLink(email.trim());
      setIsSent(true);
      setResendStatus(null);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to send login code. Please check your email address.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    setError(null);
    clearAuthError();
    try {
      await verifyOtp(email.trim(), otp.trim());
      setIsVerified(true);
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Invalid or expired code. Please enter the correct code or request a new one.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendStatus(null);
    setLoading(true);
    try {
      await signInWithMagicLink(email.trim());
      setResendStatus("New code sent! Check your inbox.");
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || "Failed to resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={handleClose}
          type="button"
          aria-label="Close modal"
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all cursor-pointer z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 md:p-10">
          {isVerified ? (
            /* Step 3: Verified Success */
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Welcome!</h2>
              <p className="text-gray-500 text-sm">
                You are successfully logged in. Your session will remain saved.
              </p>
            </div>
          ) : !isSent ? (
            /* Step 1: Enter Email */
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-[#008080]" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h2>
                <p className="text-gray-500 text-sm">Login to save your favorites, track orders, and stay logged in.</p>
              </div>

              <form onSubmit={handleSendLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                        if (authError) clearAuthError();
                      }}
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-[#008080] focus:bg-white outline-none transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                {activeError && (
                  <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 whitespace-pre-line leading-relaxed">{activeError}</p>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#008080] text-white rounded-2xl font-bold hover:bg-[#006666] transition-all shadow-lg shadow-[#008080]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "Send Login Code & Link"
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Your login session stays saved permanently</span>
                </div>
              </form>
            </>
          ) : (
            /* Step 2: Clear Guide for Magic Link Email */
            <div>
              <button 
                type="button"
                onClick={() => { setIsSent(false); setError(null); }}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors mb-4 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Email</span>
              </button>

              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-8 h-8 text-[#008080]" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-1">Check Your Gmail</h2>
                <p className="text-gray-600 text-xs">
                  We sent a login email to <br /><span className="font-extrabold text-gray-900 text-sm">{email}</span>
                </p>
              </div>

              {/* Exact Email Preview Card */}
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 mb-4 text-left">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Look for this in your inbox:</p>
                <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-gray-900">From: Supabase Auth</span>
                    <span className="text-[10px] text-gray-400">noreply@mail.app.supabase.io</span>
                  </div>
                  <p className="text-xs text-gray-700 font-semibold">Subject: Magic Link</p>
                  <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Click the link:</span>
                    <span className="text-xs font-extrabold text-blue-600 underline">Log In</span>
                  </div>
                </div>
              </div>

              {/* Spam Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-left">
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  💡 <strong>Can&apos;t see it?</strong> Check your <strong>Spam</strong> or <strong>Junk</strong> folder.
                </p>
              </div>

              {activeError && (
                <p className="text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 whitespace-pre-line leading-relaxed mb-4">{activeError}</p>
              )}

              {resendStatus && (
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-center mb-4">{resendStatus}</p>
              )}

              {/* Open Gmail Button */}
              <a 
                href="https://mail.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full py-4 bg-[#008080] text-white rounded-2xl font-bold hover:bg-[#006666] transition-all shadow-lg shadow-[#008080]/20 flex items-center justify-center gap-2 text-center cursor-pointer mb-3"
              >
                <Mail className="w-5 h-5" />
                <span>Open Gmail Inbox</span>
              </a>

              <div className="text-center pt-2">
                <button 
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008080] hover:underline cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  <span>Didn&apos;t receive it? Resend Email</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
