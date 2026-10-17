"use client";

import React from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { ShoppingCart, Heart, Sparkles } from "lucide-react";
import { SearchItemCard } from "@/lib/search";
import { useFavorites } from "@/context/FavoritesContext";
import { useCart } from "@/context/CartContext";

interface SearchItemCardProps {
  item: SearchItemCard;
}

export default function SearchItemCardComponent({ item }: SearchItemCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart } = useCart();
  const isFav = isFavorite(item.productId);

  const handleAddToCart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item.rawVariety) {
      addToCart(item.rawProduct, item.rawVariety, 1);
    } else {
      addToCart(
        item.rawProduct,
        {
          id: item.varietyId || "v1",
          product_id: item.productId,
          name: item.variantLabel || "Standard",
          label: item.variantLabel || "1x",
          price: item.price,
          weight: item.weight || "1 Unit",
          image_url: item.imageUrl
        },
        1
      );
    }
  };

  const handleFavorite = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(item.rawProduct);
  };

  return (
    <Link
      href={`/products/${item.productId}`}
      className="group relative bg-white rounded-2xl shadow-xs hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full block"
    >
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-white p-4 border-b border-gray-50">
        <SafeImage
          src={item.imageUrl}
          alt={`${item.displayName} - ${item.variantLabel}`}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
        />

        {/* Favorite Button */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
          <button
            type="button"
            onClick={handleFavorite}
            aria-label="Toggle favorite"
            className={`p-2.5 backdrop-blur-sm rounded-full shadow-md transition-colors touch-manipulation cursor-pointer ${
              isFav
                ? "bg-red-50 text-red-500"
                : "bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white"
            }`}
          >
            <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Out of Stock Badge */}
        {!item.isInStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product & Variety Details */}
      <div className="p-4 flex flex-col flex-1">
        {/* Variety / Flavour Pill */}
        {item.variantLabel && item.variantLabel !== "Standard" && (
          <div className="mb-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#008080]/10 text-[#008080] px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              {item.variantLabel}
            </span>
          </div>
        )}

        <h3 className="text-gray-900 font-semibold text-sm md:text-base mb-1 line-clamp-1 group-hover:text-[#008080] transition-colors">
          {item.displayName}
        </h3>

        <div className="flex items-center justify-between mt-auto pt-3">
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-bold text-gray-900">
              ₹{item.price.toLocaleString("en-IN")}
            </span>
            {item.weight && (
              <span className="text-[11px] text-gray-500 font-medium">
                {item.weight}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={!item.isInStock}
            onClick={handleAddToCart}
            aria-label={item.isInStock ? `Add to cart` : "Out of stock"}
            className={`px-3 py-2 md:px-4 md:py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all duration-200 z-20 shadow-sm active:scale-95 cursor-pointer ${
              item.isInStock
                ? "bg-[#008080] text-white hover:bg-[#006666] hover:shadow-md"
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>{item.isInStock ? "+ Add" : "Out"}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
