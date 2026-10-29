"use client";

import React from "react";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
import { ShoppingCart, Heart, Gift } from "lucide-react";
import { Product } from "@/types/database";
import { useFavorites } from "@/context/FavoritesContext";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCart } = useCart();
  const isFav = isFavorite(product.id);

  // Check if product and its varieties are in stock
  const hasInStockVarieties = !product.varieties || product.varieties.length === 0 || product.varieties.some(v => v.is_in_stock !== false);
  const isInStock = product.is_in_stock && hasInStockVarieties;

  // Find the cheapest in-stock variety to display on the card, or fallback to cheapest variety
  const availableVarieties = product.varieties?.filter(v => v.is_in_stock !== false) || [];
  const displayVariety = (availableVarieties.length > 0 ? availableVarieties : product.varieties && product.varieties.length > 0 ? product.varieties : [])
    .slice()
    .sort((a, b) => a.price - b.price)[0] || null;

  const displayPrice = displayVariety ? displayVariety.price : product.price;
  const displayWeight = displayVariety ? displayVariety.weight : product.weight;
  const activeOffer = displayVariety?.offer || product.offer;
  
  const displayImage = 
    (displayVariety ? displayVariety.image_url : null) || 
    product.image_url || 
    "/images/placeholder.svg";

  const handleAddToCart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add variety or standard fallback to cart
    if (displayVariety) {
      addToCart(product, displayVariety, 1);
    } else {
      addToCart(
        product,
        {
          id: "v1",
          product_id: product.id,
          name: "Standard",
          label: "1x",
          price: product.price,
          weight: product.weight || "1 Unit",
          image_url: product.image_url
        },
        1
      );
    }
  };

  const handleFavorite = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };


  return (
    <Link href={`/products/${product.id}`} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full block">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-white p-4 border-b border-gray-50">
        <SafeImage
          src={displayImage}
          alt={product.name}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Special Offer Badge on Image */}
        {activeOffer && (
          <div className="absolute top-3 left-3 z-20">
            <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black rounded-lg shadow-md flex items-center gap-1 animate-pulse">
              <Gift className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[130px]">{activeOffer}</span>
            </span>
          </div>
        )}

        {/* Badges/Actions Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
          <button 
            type="button"
            onClick={handleFavorite}
            aria-label="Toggle favorite"
            className={`p-2.5 backdrop-blur-sm rounded-full shadow-md transition-colors touch-manipulation cursor-pointer ${
              isFav ? "bg-red-50 text-red-500" : "bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white"
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
          </button>
        </div>


        {!isInStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-gray-900 font-semibold text-sm md:text-base mb-1 line-clamp-1 group-hover:text-brand-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-gray-500 text-xs md:text-sm line-clamp-2 mb-3 flex-1">
          {product.description}
        </p>

        {activeOffer && (
          <div className="mb-3 px-2.5 py-1 bg-amber-50 border border-amber-200/90 rounded-xl flex items-center gap-1.5 text-xs font-bold text-amber-900 shadow-2xs">
            <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">{activeOffer}</span>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-lg md:text-xl font-bold text-gray-900">
              ₹{displayPrice.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                Best Price
              </span>
              {displayWeight && (
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                  {displayWeight}
                </span>
              )}
            </div>
          </div>
          
          <button 
            type="button"
            disabled={!isInStock}
            onClick={handleAddToCart}
            aria-label={isInStock ? `Add ${product.name} to cart` : "Out of stock"}
            className={`px-3 py-2 md:px-4 md:py-2 rounded-xl font-bold text-xs md:text-sm flex items-center gap-1.5 transition-all duration-200 z-20 shadow-sm active:scale-95 cursor-pointer ${
              isInStock 
                ? "bg-[#008080] text-white hover:bg-[#006666] hover:shadow-md" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            }`}
            style={{ pointerEvents: 'auto' }}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span>{isInStock ? "+ Add" : "Out"}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}
