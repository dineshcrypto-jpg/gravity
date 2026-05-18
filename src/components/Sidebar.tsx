import React from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types/database";
import { 
  Apple, Smartphone, Shirt, Coffee, Sparkles, Gamepad2,
  ShoppingBasket, Leaf, Cookie, PenTool, Utensils, Home as HomeIcon,
  Search, ShoppingCart, Menu, User, Heart, ChevronRight
} from "lucide-react";

const iconMap: Record<string, any> = {
  Apple, Smartphone, Shirt, Coffee, Sparkles, Gamepad2,
  ShoppingBasket, Leaf, Cookie, PenTool, Utensils, Home: HomeIcon,
  Search, ShoppingCart, Menu, User, Heart
};

interface SidebarProps {
  activeSlug?: string;
}

export default async function Sidebar({ activeSlug }: SidebarProps) {
  let categories: Category[] = [];
  try {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (data) {
      categories = data;
    }
  } catch (error) {
    console.error("Error fetching categories for Sidebar:", error);
  }

  return (
    <aside className="hidden lg:block w-72 shrink-0">
      <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm sticky top-28">
        <div className="flex items-center justify-between mb-6 px-2">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
            Departments
          </h3>
          <span className="px-2 py-0.5 bg-gray-50 text-[10px] font-bold text-gray-400 rounded border border-gray-100">
            {categories.length}
          </span>
        </div>
        
        <nav className="space-y-1.5">
          <Link 
            href="/"
            className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
              !activeSlug 
                ? "bg-brand-50 text-[#008080] border border-brand-100" 
                : "text-gray-600 hover:bg-gray-50 border border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <HomeIcon className={`w-4 h-4 transition-transform group-hover:scale-110 ${!activeSlug ? "text-[#008080]" : "text-gray-400 group-hover:text-[#008080]"}`} />
              <span>All Products</span>
            </div>
            <ChevronRight className={`w-4 h-4 transition-all opacity-0 group-hover:opacity-100 ${!activeSlug ? "opacity-100 text-[#008080]" : "text-gray-400"}`} />
          </Link>

          <div className="h-px bg-gray-100 my-3" />

          {categories.map((category) => {
            const Icon = iconMap[category.icon || "Apple"] || Apple;
            const isActive = activeSlug === category.slug;
            return (
              <Link 
                key={category.id}
                href={`/categories/${category.slug}`}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                  isActive 
                    ? "bg-brand-50 text-[#008080] border border-brand-100" 
                    : "text-gray-600 hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-brand-100 text-[#008080]" 
                      : (category.color || "bg-gray-50 text-gray-500")
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate max-w-[150px]">{category.name}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all opacity-0 group-hover:opacity-100 ${isActive ? "opacity-100 text-[#008080]" : "text-gray-400"}`} />
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
