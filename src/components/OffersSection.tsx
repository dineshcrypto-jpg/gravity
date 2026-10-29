"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SafeImage from "@/components/SafeImage";
import { Sparkles, Gift, Tag, ArrowRight } from "lucide-react";
import { Offer } from "@/types/database";
import { fetchOffers } from "@/lib/offers";

export default function OffersSection() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOffers().then((data) => {
      setOffers(data.filter((o) => o.is_active));
      setLoading(false);
    });
  }, []);

  if (loading || offers.length === 0) {
    return null;
  }

  return (
    <section className="w-full my-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm animate-pulse">
              <Gift className="w-3.5 h-3.5" />
              Store Offers & Freebies
            </span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              Limited Time
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Special Deals & 1+1 Offers
          </h2>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Enjoy free gifts like matchboxes, buy-1-get-1 specials, and exclusive discounts on daily essentials.
          </p>
        </div>
        <Link
          href="/products"
          className="text-brand-600 font-bold hover:text-brand-700 transition-colors flex items-center gap-1 text-sm group shrink-0"
        >
          View all items
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {offers.map((offer, idx) => {
          const isGold = idx % 2 === 0;
          return (
            <Link
              key={offer.id}
              href={offer.link_url || "/products"}
              className={`group relative rounded-3xl p-5 sm:p-6 border transition-all duration-300 overflow-hidden flex flex-col sm:flex-row items-center gap-5 shadow-sm hover:shadow-xl ${
                isGold
                  ? "bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-amber-200/80 hover:border-amber-300"
                  : "bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-200/80 hover:border-emerald-300"
              }`}
            >
              {/* Offer photo */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-white border border-gray-200 shrink-0 shadow-md flex items-center justify-center p-2 group-hover:scale-105 transition-transform duration-300">
                <SafeImage
                  src={offer.image_url}
                  alt={offer.title}
                  fill
                  className="object-contain p-2"
                />
              </div>

              {/* Offer Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-xs ${
                      isGold
                        ? "bg-amber-500 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {offer.badge || "SPECIAL OFFER"}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-full border border-gray-200">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Auto Applied
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black text-gray-900 leading-snug mb-1.5 group-hover:text-brand-600 transition-colors">
                  {offer.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3 font-medium">
                  {offer.description}
                </p>

                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-700 group-hover:underline">
                  <span>Claim Offer Now</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
