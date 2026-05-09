import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ProductDetailClient from "@/components/ProductDetailClient";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types/database";

const dummyProducts: Product[] = [
  {
    id: "1",
    category_id: "1",
    name: "Organic Alphonso Mangoes",
    description: "Sweet and juicy premium mangoes directly from the farm.",
    price: 599,
    image_url: "https://images.unsplash.com/photo-1553279768-865429fa0078?q=80&w=400&h=400&auto=format&fit=crop",
    is_in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: "2",
    category_id: "2",
    name: "Noise ColorFit Pulse 2",
    description: "Sleek smartwatch with 1.8\" display and health tracking.",
    price: 2499,
    image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=400&h=400&auto=format&fit=crop",
    is_in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: "3",
    category_id: "3",
    name: "Cotton Slim Fit Shirt",
    description: "Premium breathable cotton shirt for a professional look.",
    price: 1299,
    image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=400&h=400&auto=format&fit=crop",
    is_in_stock: true,
    created_at: new Date().toISOString()
  },
  {
    id: "4",
    category_id: "1",
    name: "Fresh Broccoli (500g)",
    description: "Crispy and fresh green broccoli heads.",
    price: 89,
    image_url: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=400&h=400&auto=format&fit=crop",
    is_in_stock: false,
    created_at: new Date().toISOString()
  }
];

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  // Try to fetch from Supabase
  let product = null;
  try {
    const { data } = await supabase
      .from('products')
      .select('*, categories(name, slug), varieties(*)')
      .eq('id', id)
      .single();
    product = data;
  } catch (error) {
    // Ignore error, fallback below
  }

  // Fallback to dummy data if not found in Supabase
  if (!product) {
    const fallbackProduct = dummyProducts.find(p => p.id === id);
    if (fallbackProduct) {
      product = { ...fallbackProduct, categories: { name: "Featured", slug: "featured" }, varieties: [] };
    }
  }

  if (!product) {
    notFound();
  }

  // 3. Fetch Related Products
  const { data: relatedPool } = await supabase
    .from('products')
    .select('*, categories(name, slug), varieties(*)')
    .eq('category_id', product.category_id)
    .neq('id', id)
    .limit(20);

  // Shuffle and pick 5
  const relatedProducts = relatedPool 
    ? [...relatedPool].sort(() => Math.random() - 0.5).slice(0, 5)
    : [];

  return (
    <main className="min-h-screen bg-gray-50 py-8 md:py-12">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumbs and Back Button */}
        <div className="flex items-center justify-between mb-8">
          <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Link href="/" className="hover:text-brand-600 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/categories" className="hover:text-brand-600 transition-colors">Categories</Link>
            <ChevronRight className="w-4 h-4" />
            {product.categories && (
              <>
                <Link href={`/categories/${product.categories.slug}`} className="hover:text-brand-600 transition-colors">
                  {product.categories.name}
                </Link>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-gray-900 truncate max-w-[200px]">{product.name}</span>
          </nav>
          
          {product.categories && (
            <Link 
              href={`/categories/${product.categories.slug}`}
              className="hidden md:flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:text-brand-600 hover:border-brand-200 shadow-sm transition-all"
            >
              ← Back to {product.categories.name}
            </Link>
          )}
        </div>

        {/* Product Detail Interactive Component */}
        <ProductDetailClient product={product} />

        {/* Related Products Section */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                You May Also Like
              </h2>
              <Link 
                href={`/categories/${product.categories.slug}`}
                className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
              >
                View all {product.categories.name} →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {relatedProducts.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
        
      </div>
    </main>
  );
}
