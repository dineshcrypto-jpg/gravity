import React from "react";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { Product, Category } from "@/types/database";

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  // 1. Fetch the category info
  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!category) {
    notFound();
  }

  // 2. Fetch products in this category
  const { data: products } = await supabase
    .from('products')
    .select('*, varieties(*)')
    .eq('category_id', category.id)
    .order('created_at', { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50 py-12 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Hero Header */}
        <div className="mb-12 bg-white rounded-[3rem] p-8 md:p-16 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:bg-brand-100 transition-colors duration-500"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-4 py-1.5 bg-brand-50 text-brand-600 text-xs font-black uppercase tracking-[0.2em] rounded-full border border-brand-100">
                Department
              </span>
              <div className="h-px w-12 bg-gray-200"></div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter mb-6">
              {category.name}
            </h1>
            
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <p className="text-lg text-gray-500 font-medium max-w-xl leading-relaxed">
                Experience the finest selection of {category.name.toLowerCase()} sourced directly for your family's health and happiness.
              </p>
              <div className="hidden md:block h-12 w-px bg-gray-100 mx-4"></div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-gray-900">{products?.length || 0}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Items Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No products found</h2>
            <p className="text-gray-500">
              We are currently updating our inventory for {category.name}. Check back soon!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
