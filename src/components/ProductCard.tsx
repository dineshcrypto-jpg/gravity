"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
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

  // Find the cheapest variety to display on the card
  const displayVariety = product.varieties && product.varieties.length > 0
    ? [...product.varieties].sort((a, b) => a.price - b.price)[0]
    : null;

  const displayPrice = displayVariety ? displayVariety.price : product.price;
  const displayWeight = displayVariety ? displayVariety.weight : product.weight;
  const displayImage = product.image_url || 
    (displayVariety ? displayVariety.image_url : null) || 
    "https://placehold.co/400x400?text=No+Image";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add the cheapest variety to cart by default
    if (displayVariety) {
      addToCart(product, displayVariety, 1);
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };


  return (
    <Link href={`/products/${product.id}`} className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col h-full block">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-white p-4 border-b border-gray-50">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges/Actions Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-12 group-hover:translate-x-0 transition-transform duration-300 z-10">
          <button 
            onClick={handleFavorite}
            className={`p-2 backdrop-blur-sm rounded-full shadow-md transition-colors ${
              isFav ? "bg-red-50 text-red-500" : "bg-white/90 text-gray-600 hover:text-red-500 hover:bg-white"
            }`}
          >
            <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
          </button>
        </div>


        {!product.is_in_stock && (
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
            disabled={!product.is_in_stock}
            onClick={handleAddToCart}
            className={`p-2.5 rounded-xl transition-all duration-300 z-10 ${
              product.is_in_stock 
                ? "bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white shadow-sm" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Link>
  );
}
