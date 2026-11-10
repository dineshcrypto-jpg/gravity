"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { ShoppingCart, Heart, CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastType = "cart" | "favorite_add" | "favorite_remove" | "success" | "error" | "info";

export interface ToastOptions {
  type?: ToastType;
  title: string;
  subtitle?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  dismissToast: () => void;
}

interface ActiveToast extends ToastOptions {
  id: number;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<ActiveToast | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setActiveToast(null);
  }, []);

  const showToast = useCallback(({ type = "info", title, subtitle, duration = 3000 }: ToastOptions) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    const toastId = Date.now();
    setActiveToast({ id: toastId, type, title, subtitle, duration });

    timerRef.current = setTimeout(() => {
      setActiveToast((prev) => (prev?.id === toastId ? null : prev));
      timerRef.current = null;
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Floating Top Notification Pill */}
      {activeToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none px-4 w-full max-w-md flex justify-center transition-all"
        >
          <div
            className="pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-md border border-gray-200/90 text-gray-900 px-4 py-3 rounded-2xl shadow-2xl shadow-gray-900/10 max-w-full min-w-[280px] sm:min-w-[320px] transition-all transform animate-in slide-in-from-top-3 fade-in duration-200"
            style={{
              boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Icon */}
            <div className="shrink-0">
              {activeToast.type === "cart" && (
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-[#008080]">
                  <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
                </div>
              )}
              {activeToast.type === "favorite_add" && (
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-500">
                  <Heart className="w-5 h-5 fill-current" />
                </div>
              )}
              {activeToast.type === "favorite_remove" && (
                <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                  <Heart className="w-5 h-5" />
                </div>
              )}
              {activeToast.type === "success" && (
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                </div>
              )}
              {activeToast.type === "error" && (
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                  <AlertCircle className="w-5 h-5 stroke-[2.2]" />
                </div>
              )}
              {activeToast.type === "info" && (
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                </div>
              )}
            </div>

            {/* Text details */}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-sm font-extrabold text-gray-900 leading-tight">
                {activeToast.title}
              </p>
              {activeToast.subtitle && (
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate mt-0.5">
                  {activeToast.subtitle}
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Dismiss notification"
              className="shrink-0 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
