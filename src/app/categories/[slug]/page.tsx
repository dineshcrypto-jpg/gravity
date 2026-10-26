import React from "react";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { deduplicateProducts } from "@/lib/deduplicate";
import { Product } from "@/types/database";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const rawSlug = (await params).slug;
  const decodedSlug = decodeURIComponent(rawSlug || "").trim();
  const slugWithHyphen = decodedSlug.toLowerCase().replace(/\s+/g, '-');
  const slugWithSpace = decodedSlug.toLowerCase().replace(/-/g, ' ');

  // Candidate slugs to support decoded strings, spaces, hyphens, and previous aliases
  const candidateSlugs = Array.from(new Set([
    rawSlug,
    decodedSlug,
    slugWithHyphen,
    slugWithSpace,
    ...(slugWithHyphen.includes('cooking') || slugWithHyphen.includes('groceries') ? ['cooking-essentials', 'cooking essentials', 'groceries-staples', 'groceries'] : []),
    ...(slugWithHyphen.includes('pooja') || slugWithHyphen.includes('puja') ? ['pooja-essentials', 'pooja items', 'pooja-items', 'pooja-needs'] : []),
    ...(slugWithHyphen.includes('other') ? ['other-essentials', 'other', 'other-items'] : [])
  ])).filter(Boolean);

  // 1. Fetch the category info using candidate slugs
  const { data: matchedCategories } = await supabase
    .from('categories')
    .select('*')
    .in('slug', candidateSlugs);

  const category = matchedCategories?.find(c => !c.is_hidden);

  if (!category) {
    notFound();
  }

  // 2. Fetch products in this category
  let query = supabase
    .from('products')
    .select('*, varieties(*)');
    
  if (category.slug === 'home-cleaning') {
    // If it's home-cleaning, fetch both assigned products and any orphan products (category_id is null)
    query = query.or(`category_id.eq.${category.id},category_id.is.null`);
  } else {
    query = query.eq('category_id', category.id);
  }

  const { data: rawProducts } = await query.order('created_at', { ascending: false });

  const products = deduplicateProducts(rawProducts);

  return (
    <main className="min-h-screen bg-gray-50 py-12 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Content Area */}
        <div className="w-full flex flex-col">
          
          {/* Category Hero Header */}
          <div className="mb-8 md:mb-12 bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:bg-brand-100 transition-colors duration-500"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-brand-50 text-brand-600 text-xs font-black uppercase tracking-[0.2em] rounded-full border border-brand-100">
                  Department
                </span>
                <div className="h-px w-12 bg-gray-200"></div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-6">
                {category.name}
              </h1>
              
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <p className="text-base text-gray-500 font-medium max-w-xl leading-relaxed">
                  Experience the finest selection of {category.name.toLowerCase()} sourced directly for your family&apos;s health and happiness.
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
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

      </div>
    </main>
  );
}
