"use client";

import React, { useState, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { Product, Category } from "@/types/database";
import { getExpandedSearchTerms } from "@/lib/search";
import { 
  SlidersHorizontal, 
  CheckCircle2, 
  XCircle, 
  Tag, 
  ArrowUpDown, 
  Search, 
  X, 
  RotateCcw,
  Sparkles,
  Lightbulb
} from "lucide-react";

interface ProductGridWithFiltersProps {
  initialProducts: Product[];
  categories?: Category[];
  title?: string;
  subtitle?: string;
  showCategoryFilter?: boolean;
}

export default function ProductGridWithFilters({
  initialProducts,
  categories = [],
  title = "All Products",
  subtitle,
  showCategoryFilter = true,
}: ProductGridWithFiltersProps) {
  // Filter States
  const [stockFilter, setStockFilter] = useState<"all" | "in_stock" | "out_of_stock">("all");
  const [offerOnly, setOfferOnly] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "price_asc" | "price_desc" | "name_asc">("featured");
  const [searchFilter, setSearchFilter] = useState<string>("");

  // Helper: Determine if product is in stock
  const isProductInStock = (p: Product) => {
    const hasInStockVarieties = !p.varieties || p.varieties.length === 0 || p.varieties.some(v => v.is_in_stock !== false);
    return Boolean(p.is_in_stock && hasInStockVarieties);
  };

  // Helper: Determine effective lowest price for product
  const getProductPrice = (p: Product) => {
    if (p.varieties && p.varieties.length > 0) {
      const inStock = p.varieties.filter(v => v.is_in_stock !== false);
      const list = inStock.length > 0 ? inStock : p.varieties;
      return Math.min(...list.map(v => v.price));
    }
    return p.price || 0;
  };

  // Helper: Determine if product has any offer
  const hasProductOffer = (p: Product) => {
    return Boolean(p.offer?.trim() || p.varieties?.some(v => v.offer?.trim()));
  };

  // Compute stats across full product set
  const stats = useMemo(() => {
    let inStock = 0;
    let outStock = 0;
    let offers = 0;

    initialProducts.forEach((p) => {
      if (isProductInStock(p)) inStock++;
      else outStock++;
      if (hasProductOffer(p)) offers++;
    });

    return { total: initialProducts.length, inStock, outStock, offers };
  }, [initialProducts]);

  // Expanded search terms & typo tolerance (matching main search bar)
  const searchExpansion = useMemo(() => {
    if (!searchFilter.trim()) return null;
    return getExpandedSearchTerms(searchFilter.trim());
  }, [searchFilter]);

  // Apply all active filters
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      // 1. Stock Filter
      if (stockFilter === "in_stock" && !isProductInStock(p)) return false;
      if (stockFilter === "out_of_stock" && isProductInStock(p)) return false;

      // 2. Offer Filter
      if (offerOnly && !hasProductOffer(p)) return false;

      // 3. Category Filter
      if (selectedCategory !== "all") {
        if (p.category_id !== selectedCategory && p.categories?.slug !== selectedCategory) {
          return false;
        }
      }

      // 4. Price Range Filter
      const price = getProductPrice(p);
      if (priceRange === "under50" && price >= 50) return false;
      if (priceRange === "50-100" && (price < 50 || price > 100)) return false;
      if (priceRange === "100-300" && (price < 100 || price > 300)) return false;
      if (priceRange === "above300" && price <= 300) return false;

      // 5. Intelligent Search Filter (matches main search bar synonyms, brands, & varieties)
      if (searchFilter.trim()) {
        const tokens = searchExpansion?.searchTokens || [searchFilter.trim().toLowerCase()];
        const matches = tokens.some((token) => {
          const t = token.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(t);
          const matchesDesc = p.description?.toLowerCase().includes(t) || false;
          const matchesCat = p.categories?.name?.toLowerCase().includes(t) || false;
          const matchesOffer = p.offer?.toLowerCase().includes(t) || false;
          const matchesVar = p.varieties?.some(
            (v) =>
              v.name?.toLowerCase().includes(t) ||
              v.label?.toLowerCase().includes(t) ||
              v.offer?.toLowerCase().includes(t)
          ) || false;
          return matchesName || matchesDesc || matchesCat || matchesOffer || matchesVar;
        });

        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      if (sortBy === "price_asc") return getProductPrice(a) - getProductPrice(b);
      if (sortBy === "price_desc") return getProductPrice(b) - getProductPrice(a);
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      return 0; // featured maintains original order
    });
  }, [initialProducts, stockFilter, offerOnly, selectedCategory, priceRange, sortBy, searchFilter]);

  // Check if any filter is active
  const hasActiveFilters = stockFilter !== "all" || offerOnly || selectedCategory !== "all" || priceRange !== "all" || sortBy !== "featured" || searchFilter.trim() !== "";

  const resetFilters = () => {
    setStockFilter("all");
    setOfferOnly(false);
    setSelectedCategory("all");
    setPriceRange("all");
    setSortBy("featured");
    setSearchFilter("");
  };

  return (
    <div className="w-full">
      {/* Header with Title and Result Count */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span>{title}</span>
            <span className="text-sm font-bold bg-[#008080]/10 text-[#008080] px-3 py-1 rounded-full">
              {filteredProducts.length} items
            </span>
          </h2>
          <p className="text-gray-500 mt-1.5 font-medium text-sm">
            {subtitle || `Browse our store items with real-time stock and instant filters.`}
          </p>
        </div>

        {/* Quick Search inside Products (Integrated with Main Search Settings) */}
        <div className="relative w-full md:w-80">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search for groceries, snacks..."
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-[#008080] focus:ring-2 focus:ring-[#008080]/10 outline-none transition-all shadow-xs"
            />
            {searchFilter && (
              <button
                onClick={() => setSearchFilter("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchExpansion?.suggestedCorrection && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80">
              <Lightbulb className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Did you mean:</span>
              <button
                type="button"
                onClick={() => setSearchFilter(searchExpansion.suggestedCorrection!)}
                className="font-bold underline text-amber-900 hover:text-[#008080] cursor-pointer"
              >
                {searchExpansion.suggestedCorrection}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="bg-white rounded-2xl p-4 md:p-5 border border-gray-200/80 shadow-xs mb-8 space-y-4">
        
        {/* Row 1: Stock Status & Offers */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Stock:</span>
          </span>

          <button
            type="button"
            onClick={() => setStockFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              stockFilter === "all"
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${stockFilter === "all" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("in_stock")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              stockFilter === "in_stock"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-emerald-50/70 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>In Stock Only</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${stockFilter === "in_stock" ? "bg-white/20 text-white" : "bg-emerald-200/70 text-emerald-900"}`}>
              {stats.inStock}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("out_of_stock")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              stockFilter === "out_of_stock"
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "bg-red-50/70 text-red-800 border-red-200 hover:bg-red-100"
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
            <span>Out of Stock</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${stockFilter === "out_of_stock" ? "bg-white/20 text-white" : "bg-red-200/70 text-red-900"}`}>
              {stats.outStock}
            </span>
          </button>

          {/* Divider */}
          <div className="hidden sm:block h-5 w-px bg-gray-200 mx-1" />

          {/* Offer Pill */}
          <button
            type="button"
            onClick={() => setOfferOnly(!offerOnly)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              offerOnly
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Special Offers Only</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${offerOnly ? "bg-white/20 text-white" : "bg-amber-200 text-amber-900"}`}>
              {stats.offers}
            </span>
          </button>

          {/* Sort Dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden lg:inline flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-[#008080] cursor-pointer"
            >
              <option value="featured">Featured / Recommended</option>
              <option value="price_asc">Price: Low to High (₹ → ₹₹)</option>
              <option value="price_desc">Price: High to Low (₹₹ → ₹)</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Row 2: Price Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
            Price Range:
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

          {/* Reset Filters button if any are active */}
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

        {/* Row 3: Category Pills (if provided and enabled) */}
        {showCategoryFilter && categories.length > 0 && (
          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1 shrink-0">
              Department:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                selectedCategory === "all"
                  ? "bg-[#008080] text-white border-[#008080]"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-[#008080] text-white border-[#008080]"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Active Filter Summary ─── */}
      {hasActiveFilters && (
        <div className="mb-6 flex items-center justify-between text-xs text-gray-500 bg-gray-100/60 px-4 py-2 rounded-xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-700">Active Filters:</span>
            {stockFilter !== "all" && (
              <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md font-semibold text-gray-800">
                {stockFilter === "in_stock" ? "In Stock Only" : "Out of Stock"}
              </span>
            )}
            {offerOnly && (
              <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md font-semibold text-amber-700">
                Special Offers Only
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md font-semibold text-gray-800">
                {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}
              </span>
            )}
            {priceRange !== "all" && (
              <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md font-semibold text-gray-800">
                {priceRange === "under50" ? "< ₹50" : priceRange === "50-100" ? "₹50 - ₹100" : priceRange === "100-300" ? "₹100 - ₹300" : "₹300+"}
              </span>
            )}
            {searchFilter && (
              <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md font-semibold text-gray-800">
                Keyword: &ldquo;{searchFilter}&rdquo;
              </span>
            )}
          </div>
          <span className="font-bold text-gray-700">
            {filteredProducts.length} results
          </span>
        </div>
      )}

      {/* ─── Product Cards Grid ─── */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 md:p-16 text-center shadow-xs border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
            <SlidersHorizontal className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No products match your filters</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            Try switching from &ldquo;{stockFilter === "in_stock" ? "In Stock Only" : stockFilter === "out_of_stock" ? "Out of Stock" : "current filters"}&rdquo; to &ldquo;All&rdquo; or clearing your price selection.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-6 py-2.5 bg-[#008080] hover:bg-[#006666] text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-[#008080]/20 cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
