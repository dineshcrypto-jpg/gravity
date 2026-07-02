import React from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import Sidebar from "@/components/Sidebar";
import { deduplicateProducts } from "@/lib/deduplicate";
import { Product } from "@/types/database";
import Link from "next/link";
import { Search } from "lucide-react";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

  let products: Product[] = [];
  if (query) {
    const { data } = await supabase
      .from("products")
      .select("*, varieties(*)")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order("name");
    
    if (data) {
      products = deduplicateProducts(data);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
        
        {/* Left Sidebar showing full categories */}
        <Sidebar />

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          
          {/* Search Header */}
          <div className="mb-12 bg-white rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:bg-brand-100 transition-colors duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-4 py-1.5 bg-brand-50 text-brand-600 text-xs font-black uppercase tracking-[0.2em] rounded-full border border-brand-100">
                  Search Results
                </span>
                <div className="h-px w-12 bg-gray-200"></div>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4 flex items-center gap-3">
                <Search className="w-8 h-8 text-brand-600" />
                {query ? `Results for "${query}"` : "Search Our Store"}
              </h1>
              
              <p className="text-gray-500 font-medium leading-relaxed">
                Found <span className="font-bold text-gray-900">{products.length}</span> {products.length === 1 ? "item" : "items"} matching your search query.
              </p>
            </div>
          </div>

          {/* Results Grid */}
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              {products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 md:p-24 text-center shadow-sm border border-gray-100 max-w-xl mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-6 border border-gray-100">
                <Search className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No products found</h2>
              <p className="text-gray-500 mb-8 max-w-md">
                We couldn&apos;t find any matches for &ldquo;{query}&rdquo;. Double-check the spelling or explore other categories.
              </p>
              <Link 
                href="/categories" 
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-md shadow-brand-500/10"
              >
                Browse All Categories
              </Link>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
