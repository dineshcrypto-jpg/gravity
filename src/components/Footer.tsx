"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, MessageCircle, ShieldCheck, Truck, Copy, Check } from "lucide-react";

export default function Footer() {
  const phoneNumber = "9710149758";
  const emailAddress = "ksnsuperstore1@gmail.com";
  const whatsappUrl = `https://wa.me/91${phoneNumber}?text=Hello%20KSN%20Super%20Store%2C%20I%20have%20an%20inquiry`;
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailAddress}&su=Inquiry%20to%20KSN%20Super%20Store`;

  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 3000);
    }
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    // If on a laptop / non-touch desktop, copy number instead of opening broken dialer
    const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
      e.preventDefault();
      copyToClipboard(phoneNumber, "phone");
    }
  };

  return (
    <footer className="bg-gray-900 text-white mt-auto border-t border-gray-800 relative">
      {/* Toast Notification when copied */}
      {copiedType && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>
            {copiedType === "phone" ? `Phone number (+91 ${phoneNumber}) copied!` : `Email (${emailAddress}) copied!`}
          </span>
        </div>
      )}

      {/* Quick Trust Highlights */}
      <div className="bg-gray-800/60 border-b border-gray-800 py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Direct Local Delivery</h4>
                <p className="text-xs text-gray-400">Fast doorstep service across Theni</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">100% Genuine & Fresh</h4>
                <p className="text-xs text-gray-400">Quality products trusted by families</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Direct Call & WhatsApp Support</h4>
                <p className="text-xs text-gray-400">Call or message: +91 {phoneNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* Brand & About */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-black text-xl text-white">
                K
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">K.S.N SUPER STORE</h3>
                <p className="text-[11px] font-semibold tracking-widest text-teal-400 uppercase">Quality • Trust • Convenience</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted family store in Theni. Groceries, fresh essentials, traditional sarees, snacks, and home needs delivered straight to your home.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Store Open & Accepting Orders
              </span>
            </div>
          </div>

          {/* Contact Us - Main Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
              Contact & Talk With Us
            </h4>
            <p className="text-xs text-gray-400">
              Have questions before placing an order? Reach us directly:
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <div className="flex items-center justify-between group">
                  <a 
                    href={`tel:${phoneNumber}`} 
                    onClick={handlePhoneClick}
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors flex-1"
                    title="Click to call (mobile) or copy (laptop)"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-teal-600 text-teal-400 group-hover:text-white transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Call Us Directly</div>
                      <div className="font-semibold text-white">+91 {phoneNumber}</div>
                    </div>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(phoneNumber, "phone")}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                    title="Copy phone number"
                  >
                    {copiedType === "phone" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </li>

              <li>
                <div className="flex items-center justify-between group">
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors flex-1"
                    title="Chat on WhatsApp Web / Mobile"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-green-600 text-green-400 group-hover:text-white transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">WhatsApp Chat</div>
                      <div className="font-semibold text-white">+91 {phoneNumber}</div>
                    </div>
                  </a>
                </div>
              </li>

              <li>
                <div className="flex items-center justify-between group">
                  <a 
                    href={gmailWebUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors flex-1"
                    title="Open Gmail directly in browser"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center group-hover:bg-blue-600 text-blue-400 group-hover:text-white transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Email Inquiries (Gmail)</div>
                      <div className="font-semibold text-white text-xs truncate">{emailAddress}</div>
                    </div>
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(emailAddress, "email")}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                    title="Copy email address"
                  >
                    {copiedType === "email" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </li>
            </ul>
          </div>

          {/* Store Location & Timings */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
              Store Timings & Address
            </h4>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">KSN Super Store</p>
                  <p className="text-xs text-gray-400 mt-0.5">Theni, Tamil Nadu, India</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Store Working Hours</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-400">
                      <span className="text-teal-300 font-semibold">Mon – Sat:</span> 7:30 AM – 1:45 PM & 4:30 PM – 8:45 PM
                    </p>
                    <p className="text-xs text-gray-400">
                      <span className="text-amber-300 font-semibold">Sunday:</span> 7:30 AM – 12:45 PM <span className="text-[10px] text-gray-500 font-medium">(Half Day)</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-400">
              Instant Help (Laptop & Mobile)
            </h4>
            <div className="space-y-2.5">
              <a 
                href={`tel:${phoneNumber}`} 
                onClick={handlePhoneClick}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                title="Call (Mobile) or Copy Number (Laptop)"
              >
                <Phone className="w-4 h-4" />
                <span>Call / Copy: +91 {phoneNumber}</span>
              </a>
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer" 
                className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
              <a 
                href={gmailWebUrl}
                target="_blank"
                rel="noopener noreferrer" 
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>Compose in Gmail</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-10 mt-10 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
          <p>© {new Date().getFullYear()} KSN Super Store. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>•</span>
            <Link href="/categories" className="hover:text-white transition-colors">Categories</Link>
            <span>•</span>
            <Link href="/cart" className="hover:text-white transition-colors">My Cart</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
