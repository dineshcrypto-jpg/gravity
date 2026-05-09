"use client";

import React from "react";
import Link from "next/link";
import { useFavorites } from "@/context/FavoritesContext";
import ProductCard from "@/components/ProductCard";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const { favorites } = useFavorites();

  if (favorites.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 md:p-16 rounded-3xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No favorites yet</h1>
          <p className="text-gray-500 mb-8">Save items you love by clicking the heart icon on any product.</p>
          <Link 
            href="/categories" 
            className="w-full flex items-center justify-center px-6 py-4 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
          >
            Explore Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Heart className="w-8 h-8 text-red-500 fill-current" />
            Your Favorites
          </h1>
          <Link href="/categories" className="text-brand-600 font-bold hover:text-brand-700 transition-colors flex items-center gap-1 group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {favorites.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}
