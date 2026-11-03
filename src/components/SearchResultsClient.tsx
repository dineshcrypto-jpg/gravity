"use client";

import React, { useState, useMemo } from "react";
import SearchItemCardComponent from "@/components/SearchItemCardComponent";
import { SearchItemCard } from "@/lib/search";
import { 
  SlidersHorizontal, 
  CheckCircle2, 
  XCircle, 
  ArrowUpDown, 
  Sparkles,
  RotateCcw
} from "lucide-react";

interface SearchResultsClientProps {
  initialItems: SearchItemCard[];
  rawQuery: string;
}

export default function SearchResultsClient({ initialItems, rawQuery }: SearchResultsClientProps) {
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "name_asc">("featured");

  // Stock stats
  const inStockCount = useMemo(() => initialItems.filter(i => i.isInStock).length, [initialItems]);
  const outOfStockCount = useMemo(() => initialItems.filter(i => !i.isInStock).length, [initialItems]);

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      // Stock filter
      if (stockFilter === "in_stock" && !item.isInStock) return false;
      if (stockFilter === "out_of_stock" && item.isInStock) return false;

      // Price filter
      if (priceRange === "under50" && item.price >= 50) return false;
      if (priceRange === "50-100" && (item.price < 50 || item.price > 100)) return false;
      if (priceRange === "100-300" && (item.price < 100 || item.price > 300)) return false;
      if (priceRange === "above300" && item.price <= 300) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "name_asc") return a.displayName.localeCompare(b.displayName);
      return 0;
    });
  }, [initialItems, stockFilter, priceRange, sortBy]);

  const hasActiveFilters = stockFilter !== "all" || priceRange !== "all" || sortBy !== "featured";

  const resetFilters = () => {
    setStockFilter("all");
    setPriceRange("all");
    setSortBy("featured");
  };

  return (
    <div>
      {/* ─── Filter Bar ─── */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200/80 shadow-xs mb-8 space-y-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Stock:</span>
          </span>

          <button
            type="button"
            onClick={() => setStockFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              stockFilter === "all"
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${stockFilter === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
              {initialItems.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("in_stock")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              stockFilter === "in_stock"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>In Stock Only</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${stockFilter === "in_stock" ? "bg-white/20 text-white" : "bg-emerald-200/70 text-emerald-900"}`}>
              {inStockCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("out_of_stock")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              stockFilter === "out_of_stock"
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "bg-red-50/70 text-red-800 border-red-200 hover:bg-red-100"
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>Out of Stock</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${stockFilter === "out_of_stock" ? "bg-white/20 text-white" : "bg-red-200/70 text-red-900"}`}>
              {outOfStockCount}
            </span>
          </button>

          {/* Sort Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#008080] cursor-pointer"
            >
              <option value="featured">Featured / Best Match</option>
              <option value="price_asc">Price: Low to High (₹ → ₹₹)</option>
              <option value="price_desc">Price: High to Low (₹₹ → ₹)</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Price Range Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
            Price:
          </span>

          {[
            { id: "all", label: "All Prices" },
            { id: "under50", label: "Under ₹50" },
            { id: "50-100", label: "₹50 - ₹100" },
            { id: "100-300", label: "₹100 - ₹300" },
            { id: "above300", label: "₹300+" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPriceRange(item.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                priceRange === item.id
                  ? "bg-[#008080] text-white border-[#008080] shadow-xs"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {item.label}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer py-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Results Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#008080]" />
          Matching Products & Varieties ({filteredItems.length})
        </h2>
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filteredItems.map((item) => (
            <SearchItemCardComponent key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center shadow-xs border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-2">No matching items for this filter</h3>
          <p className="text-gray-500 text-xs mb-4">
            Try switching stock to &ldquo;All&rdquo; or clearing your price selection.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 bg-[#008080] hover:bg-[#006666] text-white rounded-xl text-xs font-bold transition-all"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
