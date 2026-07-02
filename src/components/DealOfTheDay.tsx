"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart, Flame } from "lucide-react";
import { Product } from "@/types/database";
import { useFavorites } from "@/context/FavoritesContext";
import { useCart } from "@/context/CartContext";

interface DealOfTheDayProps {
  product: Product;
}

export default function DealOfTheDay({ product }: DealOfTheDayProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart } = useCart();
  const isFav = isFavorite(product.id);

  // Time remaining until midnight local time (client‑only)
  const [timeLeft, setTimeLeft] = useState({ hours: "00", minutes: "00", seconds: "00" });

  // Update timer on the client after mount
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next midnight

      const diff = midnight.getTime() - now.getTime();
      if (diff <= 0) {
        return { hours: "00", minutes: "00", seconds: "00" };
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      return {
        hours: hrs.toString().padStart(2, "0"),
        minutes: mins.toString().padStart(2, "0"),
        seconds: secs.toString().padStart(2, "0"),
      };
    };
    // Set initial time immediately after mount
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayVariety = product.varieties && product.varieties.length > 0
    ? [...product.varieties].sort((a, b) => a.price - b.price)[0]
    : null;

  const displayPrice = displayVariety ? displayVariety.price : product.price;
  const displayWeight = displayVariety ? displayVariety.weight : product.weight;
  const displayImage = 
    (displayVariety ? displayVariety.image_url : null) || 
    product.image_url || 
    "https://placehold.co/400x400?text=No+Image";

  const handleAddToCart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (displayVariety) {
      addToCart(product, displayVariety, 1);
    } else {
      addToCart(product, {
        id: "v1",
        product_id: product.id,
        name: "Standard",
        label: "1x",
        price: product.price,
        weight: product.weight || "1 Unit",
        image_url: product.image_url
      }, 1);
    }
  };

  const handleFavorite = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <Link 
      href={`/products/${product.id}`} 
      className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-orange-100 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden h-[320px] w-full block"
    >
      {/* Decorative fire glow in background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200/40 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-300/50 transition-colors duration-500"></div>

      {/* Top Banner Row */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-md animate-pulse">
          <Flame className="w-3.5 h-3.5 fill-current" />
          <span>Deal of the Day</span>
        </div>
        
        {/* Countdown Timer */}
        <div className="flex items-center gap-1 bg-black/80 px-2.5 py-1 rounded-lg text-white font-mono text-xs font-bold shadow-sm">
          <span>{timeLeft.hours}</span>
          <span className="animate-ping opacity-75">:</span>
          <span>{timeLeft.minutes}</span>
          <span className="animate-ping opacity-75">:</span>
          <span>{timeLeft.seconds}</span>
        </div>
      </div>

      {/* Main product display */}
      <div className="flex gap-4 items-center my-3 z-10">
        {/* Image Container */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl p-2 shadow-inner border border-amber-100 flex-shrink-0 overflow-hidden">
          <Image
            src={displayImage}
            alt={product.name}
            fill
            className="object-contain p-1 group-hover:scale-110 transition-transform duration-500"
          />
          
          {!product.is_in_stock && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider">
                Out
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-gray-900 font-extrabold text-base mb-1 truncate group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
          <p className="text-gray-500 text-xs line-clamp-2 mb-2">
            {product.description}
          </p>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-gray-900">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>
            {displayWeight && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">
                {displayWeight}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action / Progress Row */}
      <div className="z-10 mt-auto">
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-[10px] font-bold text-orange-700 uppercase tracking-wider mb-1">
            <span>🔥 Hurry! Only a few left</span>
            <span>82% Claimed</span>
          </div>
          <div className="w-full bg-orange-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full w-[82%]"></div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            disabled={!product.is_in_stock}
            onClick={handleAddToCart}
            onTouchEnd={handleAddToCart}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
              product.is_in_stock
                ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-[0_4px_12px_rgba(249,115,22,0.3)] hover:shadow-[0_6px_16px_rgba(249,115,22,0.5)] transform hover:-translate-y-0.5 touch-manipulation"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{product.is_in_stock ? "Add to Cart" : "Out of Stock"}</span>
          </button>

          {/* Badges/Actions Overlay */}
          <div className="flex z-20" style={{ pointerEvents: 'auto' }}>
            <button
              onClick={handleFavorite}
              onTouchEnd={handleFavorite}
              className={`p-2.5 rounded-xl border transition-colors touch-manipulation ${
                isFav 
                  ? "bg-red-50 border-red-200 text-red-500" 
                  : "bg-white border-orange-100 text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
