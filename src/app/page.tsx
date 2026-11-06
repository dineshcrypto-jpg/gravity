import Link from "next/link";
import Hero from "@/components/Hero";
import OffersSection from "@/components/OffersSection";
import ProductGridWithFilters from "@/components/ProductGridWithFilters";
import { supabase } from "@/lib/supabase";
import { deduplicateProducts } from "@/lib/deduplicate";
import { sortCategories } from "@/lib/categories";
import { Product, Category } from "@/types/database";

// Fallback products if the database is empty or not yet set up
const dummyProducts: Product[] = [
  {
    id: "1",
    category_id: "1",
    name: "Organic Alphonso Mangoes",
    description: "Sweet and juicy premium mangoes directly from the farm.",
    price: 599,
    weight: null,
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
    weight: null,
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
    weight: null,
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
    weight: null,
    image_url: "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?q=80&w=400&h=400&auto=format&fit=crop",
    is_in_stock: false,
    created_at: new Date().toISOString()
  }
];

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  // Fetch real products & categories in parallel from Supabase
  let products: Product[] = [];
  let categories: Category[] = [];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from('products')
        .select('*, varieties(*), categories(*)')
        .order('name'),
      supabase
        .from('categories')
        .select('*')
        .order('name')
    ]);

    if (productsRes.data && productsRes.data.length > 0) {
      const visibleData = productsRes.data.filter((item: any) => !item.categories?.is_hidden);
      products = deduplicateProducts(visibleData);
    } else {
      products = dummyProducts;
    }

    if (categoriesRes.data) {
      categories = sortCategories(categoriesRes.data.filter((c: Category) => !c.is_hidden));
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    products = dummyProducts;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20 mt-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main feed */}
        <div className="w-full flex flex-col gap-10">
          
          {/* Top Banner (Full width without the fake deal card) */}
          <div className="w-full">
            <Hero className="w-full relative" />
          </div>

          {/* Customer Special Offers & Freebies */}
          <OffersSection />
          
          {/* Products Section with Real-Time Stock & Category Filters */}
          <section id="products-section" className="scroll-mt-8">
            <ProductGridWithFilters
              initialProducts={products}
              categories={categories}
              title="All Products"
              subtitle={`Explore our complete store collection (${products.length} products). Filter by stock, offers, category, or price.`}
              showCategoryFilter={true}
            />
          </section>

          {/* Trust Badges / Info */}
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8 text-center mt-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-500 text-sm">Get your orders delivered swiftly to your doorstep.</p>
            </div>
            <div className="border-y md:border-y-0 md:border-x border-gray-100 py-8 md:py-0 px-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quality Assured</h3>
              <p className="text-gray-500 text-sm">Every product is handpicked with purity and freshness guaranteed.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Best Prices</h3>
              <p className="text-gray-500 text-sm">Direct wholesale rates and daily savings for your household.</p>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
