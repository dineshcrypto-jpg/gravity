import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types/database";

// Fallback products if the database is empty or not yet set up
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

export default async function Home() {
  // Fetch real products from Supabase
  let products: Product[] = [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, varieties(*)')
      .limit(8);
    
    if (data && data.length > 0) {
      products = data;
    } else {
      products = dummyProducts;
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    products = dummyProducts;
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section with Advertisement Carousel */}
      <Hero />
      
      {/* Top Products Section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 md:mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Top Products
            </h2>
            <p className="text-gray-500 mt-2 font-medium">
              Handpicked premium essentials just for you.
            </p>
          </div>
          <button className="text-brand-600 font-bold hover:text-brand-700 transition-colors flex items-center gap-1 group">
            View All Products
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Trust Badges / Info */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Delivery</h3>
            <p className="text-gray-500 text-sm">Get your orders delivered within 24 hours.</p>
          </div>
          <div className="border-y md:border-y-0 md:border-x border-gray-100 py-8 md:py-0 px-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Quality Assured</h3>
            <p className="text-gray-500 text-sm">Every product is handpicked for quality.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Best Prices</h3>
            <p className="text-gray-500 text-sm">Unbeatable value for all your needs.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
