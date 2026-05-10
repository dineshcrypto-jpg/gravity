"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, ShoppingCart, Menu, User, Heart, Sword,
  Apple, Smartphone, Shirt, Coffee, Sparkles, Gamepad2,
  ShoppingBasket, Leaf, Cookie, PenTool, Utensils, Home as HomeIcon,
  LogOut, LogIn
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types/database";
import LoginModal from "./LoginModal";

const iconMap: Record<string, any> = {
  Apple, Smartphone, Shirt, Coffee, Sparkles, Gamepad2,
  ShoppingBasket, Leaf, Cookie, PenTool, Utensils, Home: HomeIcon
};

export default function Navbar() {
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();
  const { user, signOut, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full shadow-lg">
      {/* Top Brand Bar with Gradient Background from Photo */}
      <div className="bg-gradient-to-r from-[#008080] via-[#98c01d] to-[#d64a1e] py-3 md:py-4">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            
            <button className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors">
              <Menu className="w-7 h-7" />
            </button>

            <Link href="/" className="flex items-center group bg-white px-8 py-3 rounded-2xl shadow-md border border-gray-100">
              {/* Detailed Aruva Logo exactly like the photo */}
              <div className="flex items-center gap-4">
                <svg className="w-10 md:w-12 h-20 md:h-24 drop-shadow-sm" viewBox="0 0 100 250" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* The sharp curved blade */}
                  <path d="M50 200V70C50 40 30 20 10 20C40 10 70 30 70 70V200" fill="black" />
                  
                  {/* The decorative ridges on the neck */}
                  <rect x="45" y="200" width="30" height="6" rx="2" fill="black" />
                  <rect x="42" y="210" width="36" height="6" rx="2" fill="black" />
                  <rect x="45" y="220" width="30" height="6" rx="2" fill="black" />
                  
                  {/* The pedestal base */}
                  <path d="M30 230H90L80 245H40L30 230Z" fill="black" />
                  
                  {/* Three Vibuthi lines with Kungumam dots */}
                  <g>
                    <rect x="52" y="85" width="16" height="3" fill="white" />
                    <circle cx="60" cy="86.5" r="2" fill="#ef4444" />
                    
                    <rect x="52" y="115" width="16" height="3" fill="white" />
                    <circle cx="60" cy="116.5" r="2" fill="#ef4444" />
                    
                    <rect x="52" y="145" width="16" height="3" fill="white" />
                    <circle cx="60" cy="146.5" r="2" fill="#ef4444" />
                  </g>
                </svg>
                <div className="flex flex-col">
                  <span className="text-3xl md:text-5xl font-black italic tracking-tighter text-black leading-none">K.S.N</span>
                  <span className="text-sm md:text-base font-bold tracking-[0.2em] text-black/90 leading-none mt-2">SUPER STORE</span>
                </div>
              </div>
            </Link>




            <div className="hidden md:flex flex-1 max-w-xl px-8">
              <div className="relative w-full group">
                <input 
                  type="text" 
                  placeholder="Search for groceries, snacks..." 
                  className="w-full bg-white/20 border border-white/30 text-white placeholder-white/70 text-sm rounded-full focus:ring-2 focus:ring-white focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 block pl-5 pr-12 py-3 transition-all duration-300"
                />
                <button className="absolute inset-y-0 right-0 flex items-center pr-4 text-white hover:scale-110 transition-transform">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4 md:space-x-6 text-white">
              <Link href="/favorites" className="flex flex-col items-center justify-center hover:scale-110 transition-transform relative group">
                <div className="relative">
                  <Heart className="w-7 h-7" />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-brand-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-brand-600 shadow-sm">
                      {favoritesCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-[10px] font-bold uppercase mt-1 tracking-wider opacity-90">Wishlist</span>
              </Link>
              
              <Link href="/cart" className="flex flex-col items-center justify-center hover:scale-110 transition-transform relative group">
                <div className="relative">
                  <ShoppingCart className="w-7 h-7" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-brand-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-brand-600 shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-[10px] font-bold uppercase mt-1 tracking-wider opacity-90">Cart</span>
              </Link>

              {/* User Account Section */}
              <div className="relative">
                {loading ? (
                  <div className="w-7 h-7 bg-white/20 animate-pulse rounded-full" />
                ) : user ? (
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex flex-col items-center justify-center hover:scale-110 transition-transform relative group"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/50">
                        {user.user_metadata.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-full h-full p-1 bg-white text-brand-600" />
                        )}
                      </div>
                      <span className="hidden md:block text-[10px] font-bold uppercase mt-1 tracking-wider opacity-90">Account</span>
                    </button>

                    {/* Simple Dropdown */}
                    {isUserMenuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 text-gray-900 z-[60]">
                        <div className="px-4 py-2 border-b border-gray-50 mb-1">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Logged in as</p>
                          <p className="text-sm font-bold truncate">{user.user_metadata.full_name || user.email}</p>
                        </div>
                        <Link 
                          href="/account" 
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4" /> My Profile
                        </Link>
                        <button 
                          onClick={() => { signOut(); setIsUserMenuOpen(false); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex flex-col items-center justify-center hover:scale-110 transition-transform group"
                  >
                    <LogIn className="w-7 h-7" />
                    <span className="hidden md:block text-[10px] font-bold uppercase mt-1 tracking-wider opacity-90">Login</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
      
      {/* Category Navigation - White with subtle shadow */}
      <div className="bg-white border-b border-gray-100 hidden md:block">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-3 overflow-x-auto no-scrollbar">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-bold text-[#d64a1e] hover:bg-orange-50 px-4 py-2 rounded-xl transition-all"
            >
              <HomeIcon className="w-5 h-5" />
              HOME
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            
            {categories.map((category) => {
              const Icon = iconMap[category.icon || "Apple"] || Apple;
              return (
                <Link 
                  key={category.id}
                  href={`/categories/${category.slug}`} 
                  className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-[#008080] hover:bg-teal-50 px-4 py-2 rounded-xl transition-all whitespace-nowrap group"
                >
                  <div className={`p-1 rounded-lg transition-transform group-hover:scale-110 ${category.color || 'bg-gray-100 text-gray-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {category.name.toUpperCase()}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

