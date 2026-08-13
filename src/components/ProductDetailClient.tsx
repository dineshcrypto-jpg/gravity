"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, Share2, Star, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Product } from "@/types/database";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { getWhatsAppLink, saveOrderToSupabase } from "@/lib/checkout";
import { useAuth } from "@/context/AuthContext";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  // Use varieties from database, or fallback to standard size if none exist
  const varieties = product.varieties && product.varieties.length > 0 
    ? product.varieties 
    : [
        { id: "v1", product_id: product.id, name: "Standard", price: product.price, label: "1x" }
      ];

  const [selectedVariety, setSelectedVariety] = useState(varieties[0]);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { user } = useAuth();
  const isFav = isFavorite(product.id);

  const handleAddToCart = () => {
    addToCart(product, selectedVariety, quantity);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleBuyNow = async () => {
    let name = "";
    let phone = "";
    let address = "";
    let landmark = "";

    // If logged in, we can pre-fill or try to use their data
    // For now, we still ask to ensure details are correct for this specific delivery
    name = prompt("Please enter your Full Name:", user?.user_metadata.full_name || "") || "";
    if (!name) return;
    
    phone = prompt("Please enter your Phone Number:") || "";
    if (!phone) return;
    
    address = prompt("Please enter your Delivery Address (Door No / Street):") || "";
    if (!address) return;

    landmark = prompt("Area / Landmark (Optional):") || "";

    const customerInfo = { name, phone, address, landmark };

    const buyNowItem = {
      product,
      variety: selectedVariety,
      quantity
    };
    
    const total = selectedVariety.price * quantity;
    
    try {
      // 1. Save to DB if logged in
      if (user) {
        await saveOrderToSupabase(user.id, [buyNowItem], total, customerInfo);
      }

      // 2. Open WhatsApp link
      const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919710149758";
      const waLink = getWhatsAppLink(whatsappNumber, [buyNowItem], total, customerInfo);
      
      window.location.href = waLink;
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Buy Now failed", error);
      alert("Checkout failed: " + (error.message || "Unknown error"));
    }
  };





  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
      {/* Success Toast overlay */}
      {showSuccess && (
        <div className="absolute top-4 right-4 md:top-8 md:right-8 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-2xl shadow-xl z-50 flex flex-col items-center animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            <span className="font-bold">Added to Cart!</span>
          </div>
          <p className="text-sm text-green-600 mb-3">{quantity}x {product.name} ({selectedVariety.name})</p>
          <div className="flex gap-2">
            <Link 
              href={product.categories ? `/categories/${product.categories.slug}` : "/categories"} 
              className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-green-700 border border-green-200 hover:bg-green-100"
            >
              Continue Shopping
            </Link>
            <Link 
              href="/cart" 
              className="px-4 py-2 bg-green-600 rounded-xl text-xs font-bold text-white hover:bg-green-700"
            >
              View Cart
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row">
        
        {/* Left Side - Image Gallery */}
        <div className="md:w-1/2 p-6 md:p-12 bg-gray-50 flex items-center justify-center relative">
          <div className="absolute top-6 left-6 flex space-x-2 z-10">
            {!product.is_in_stock && (
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                Out of Stock
              </span>
            )}
            {product.is_in_stock && selectedVariety.price < product.price && (
               <span className="bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                 Sale
               </span>
            )}
          </div>
          {/* Safe image url parsing */}
          {(() => {
            const rawUrl = selectedVariety.image_url || product.image_url;
            
            const isValidUrl = (url: string | null | undefined): boolean => {
              if (!url) return false;
              const cleanUrl = url.trim();
              if (cleanUrl.startsWith('/') || cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
                if (cleanUrl.includes('PASTE_IMAGE_URL_HERE') || cleanUrl.includes('PASTE_IMAGE_UR')) {
                  return false;
                }
                
                if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
                  try {
                    const parsedUrl = new URL(cleanUrl);
                    const hostname = parsedUrl.hostname;
                    const supabaseHost = (() => {
                      try {
                        return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname;
                      } catch { return ''; }
                    })();
                    const allowedHosts = [
                      'images.unsplash.com',
                      supabaseHost,
                      'placehold.co'
                    ].filter(Boolean);
                    return allowedHosts.some(host => hostname === host || hostname.endsWith('.' + host));
                  } catch (e) {
                    return false;
                  }
                }
                return true;
              }
              return false;
            };

            const displayImg = isValidUrl(rawUrl) ? rawUrl! : "https://placehold.co/800x800?text=No+Image";

            return (
              <div className="relative w-full aspect-square max-w-md mx-auto transform transition-all duration-500 hover:scale-105">
                <Image
                  src={displayImg}
                  alt={product.name}
                  fill
                  className="object-contain animate-in fade-in zoom-in duration-500"
                  key={selectedVariety.id} // This forces a re-render/animation when the variety changes
                  priority
                />
              </div>
            );
          })()}
        </div>

        {/* Right Side - Product Details */}
        <div className="md:w-1/2 p-6 md:p-12 flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-yellow-400">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 text-gray-300" />
              <span className="text-gray-500 text-xs ml-2 font-medium">(128 reviews)</span>
            </div>
            <div className="flex space-x-3">
              <button className="text-gray-400 hover:text-brand-600 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            {product.name}
          </h1>
          
          <p className="text-gray-500 text-base md:text-lg mb-6 leading-relaxed">
            {product.description || "Premium quality product directly sourced for the best experience."}
          </p>

          <div className="mb-8 flex items-baseline gap-4">
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold text-gray-900 tracking-tight transition-all duration-300">
                ₹{selectedVariety.price.toLocaleString("en-IN")}
              </span>
              <span className="text-gray-500 text-sm line-through font-medium">
                ₹{Math.round(selectedVariety.price * 1.2).toLocaleString("en-IN")}
              </span>
            </div>
            
            {(selectedVariety.weight || product.weight) && (
              <div className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">
                  Weight: {selectedVariety.weight || product.weight}
                </span>
              </div>
            )}
          </div>

          {/* Variety Picker */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Select Variety</h3>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {varieties.map((variety) => (
                <button
                  key={variety.id}
                  onClick={() => setSelectedVariety(variety)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 ${
                    selectedVariety.id === variety.id
                      ? "border-brand-600 bg-brand-50"
                      : "border-gray-200 bg-white hover:border-brand-300"
                  }`}
                >
                  <span className={`text-sm font-bold mb-1 ${selectedVariety.id === variety.id ? "text-brand-700" : "text-gray-900"}`}>
                    {variety.name}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${selectedVariety.id === variety.id ? "bg-brand-200 text-brand-800" : "bg-gray-100 text-gray-500"}`}>
                    {variety.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Actions */}
          <div className="flex items-center gap-4 mb-8 mt-auto">
            <div className="flex items-center border border-gray-200 rounded-full bg-white h-14">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-brand-600 transition-colors"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-full flex items-center justify-center text-gray-500 hover:text-brand-600 transition-colors"
              >
                +
              </button>
            </div>

            <button 
              disabled={!product.is_in_stock}
              onClick={handleAddToCart}
              className={`flex-1 h-14 rounded-full flex items-center justify-center gap-2 font-bold text-lg transition-all duration-300 shadow-lg ${
                product.is_in_stock 
                  ? "bg-brand-600 text-white hover:bg-brand-700 hover:shadow-brand-500/30 transform hover:-translate-y-0.5" 
                  : "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </button>

            <button 
              onClick={() => toggleFavorite(product)}
              className={`h-14 w-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                isFav 
                  ? "border-red-500 bg-red-50 text-red-500" 
                  : "border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-400"
              }`}
            >
              <Heart className={`w-6 h-6 ${isFav ? "fill-current" : ""}`} />
            </button>
          </div>
          <button 
             disabled={!product.is_in_stock}
             onClick={handleBuyNow}
             className={`w-full h-14 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
               product.is_in_stock 
                 ? "bg-gray-900 text-white hover:bg-black shadow-lg transform hover:-translate-y-0.5" 
                 : "hidden"
             }`}
          >
            Buy Now
          </button>

          {/* Value Props */}
          <div className="flex justify-center mt-8 pt-8 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">100% Genuine</p>
                <p className="text-xs text-gray-500 font-medium">Quality Guaranteed</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
