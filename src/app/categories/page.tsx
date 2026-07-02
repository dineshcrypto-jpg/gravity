import React from "react";
import Link from "next/link";
import { 
  Apple, Smartphone, Shirt, Coffee, Sparkles, Gamepad2, 
  ChevronRight, ShoppingBasket, Leaf, Cookie, PenTool, Utensils, Home
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Category } from "@/types/database";

// Mapping icons for display
const iconMap: Record<string, React.ElementType> = {
  Apple,
  Smartphone,
  Shirt,
  Coffee,
  Sparkles,
  Gamepad2,
  ShoppingBasket,
  Leaf,
  Cookie,
  PenTool,
  Utensils,
  Home
};


export default async function CategoriesPage() {
  // Fetch categories from Supabase
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return (
    <main className="min-h-screen bg-gray-50 py-12 md:py-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Shop by Category
          </h1>
          <p className="text-lg text-gray-500 font-medium">
            Explore our wide range of premium products across all departments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {categories?.map((category: Category) => {
            const IconComponent = iconMap[category.icon || "Apple"] || Apple;
            return (
              <Link 
                key={category.id} 
                href={`/categories/${category.slug}`}
                className="group relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden flex flex-col justify-between h-64"
              >
                {/* Background Decoration */}
                <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${category.color?.split(' ')[0] || 'bg-gray-200'}`} />
                
                <div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 ${category.color || 'bg-gray-100 text-gray-600'}`}>
                    <IconComponent className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                    {category.name}
                  </h2>
                </div>

                <div className="flex items-center text-brand-600 font-bold group-hover:gap-2 transition-all">
                  <span>Browse Products</span>
                  <ChevronRight className="w-5 h-5 ml-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
