import React from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import SearchItemCardComponent from "@/components/SearchItemCardComponent";
import Sidebar from "@/components/Sidebar";
import { deduplicateProducts } from "@/lib/deduplicate";
import { Product } from "@/types/database";
import Link from "next/link";
import { Search, Sparkles, ArrowRight, Lightbulb } from "lucide-react";
import {
  getExpandedSearchTerms,
  expandProductVarietiesForSearch,
  SearchItemCard
} from "@/lib/search";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const rawQuery = q?.trim() || "";

  let searchItems: SearchItemCard[] = [];
  let relatedProducts: Product[] = [];
  let suggestedCorrection: string | undefined = undefined;
  let activeSearchTerms: string[] = [];

  if (rawQuery) {
    const {
      normalizedQuery,
      searchTokens,
      relatedKeywords,
      suggestedCorrection: typoCorrection
    } = getExpandedSearchTerms(rawQuery);

    suggestedCorrection = typoCorrection;
    activeSearchTerms = searchTokens;

    // 1. Build an OR query for all expanded brand and synonym tokens (up to 8 to avoid overwhelming Supabase)
    const tokensToQuery = searchTokens.slice(0, 8);
    const orFilter = tokensToQuery
      .flatMap((token) => [
        `name.ilike.%${token}%`,
        `description.ilike.%${token}%`
      ])
      .join(",");

    try {
      const { data: matchedData, error } = await supabase
        .from("products")
        .select("*, varieties(*), categories(*)")
        .or(orFilter)
        .order("name");

      if (error) {
        console.error("Supabase search error:", error);
      }

      if (matchedData && matchedData.length > 0) {
        // Filter out hidden categories and deduplicate base products
        const visibleData = matchedData.filter((item: any) => !item.categories?.is_hidden);
        const uniqueProducts = deduplicateProducts(visibleData);

        // Expand each product to expose all its varieties (e.g. all 10 varieties)
        searchItems = expandProductVarietiesForSearch(uniqueProducts, normalizedQuery || rawQuery);
      }
    } catch (err) {
      console.error("Unexpected search error:", err);
    }

    // 2. Fetch Related / Frequently Paired Products
    if (relatedKeywords.length > 0) {
      const relatedTokens = relatedKeywords.slice(0, 5);
      const relatedFilter = relatedTokens
        .map((k) => `name.ilike.%${k}%`)
        .join(",");

      try {
        const { data: relData } = await supabase
          .from("products")
          .select("*, varieties(*), categories(*)")
          .or(relatedFilter)
          .limit(8);

        if (relData) {
          const visibleRel = relData.filter(
            (item: any) =>
              !item.categories?.is_hidden &&
              !searchItems.some((si) => si.productId === item.id)
          );
          relatedProducts = deduplicateProducts(visibleRel).slice(0, 4);
        }
      } catch (err) {
        console.error("Error fetching related items:", err);
      }
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
        {/* Left Sidebar showing full categories */}
        <Sidebar />

        {/* Right Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Search Header */}
          <div className="mb-10 bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-xs relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3.5 py-1 bg-[#008080]/10 text-[#008080] text-xs font-black uppercase tracking-wider rounded-full">
                  Search Results
                </span>
                {suggestedCorrection && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Did you mean:{" "}
                    <Link
                      href={`/search?q=${encodeURIComponent(suggestedCorrection)}`}
                      className="underline font-black hover:text-amber-900"
                    >
                      {suggestedCorrection}
                    </Link>
                    ?
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
                <Search className="w-7 h-7 text-[#008080]" />
                {rawQuery ? `Results for "${rawQuery}"` : "Search Products"}
              </h1>

              <p className="text-gray-500 text-sm font-medium">
                {rawQuery ? (
                  <>
                    Showing{" "}
                    <span className="font-bold text-gray-900">
                      {searchItems.length}
                    </span>{" "}
                    varieties and options available.
                  </>
                ) : (
                  "Type a product, brand name, or flavour in the search bar above."
                )}
              </p>
            </div>
          </div>

          {/* Results Grid - Shows All Varieties Individually */}
          {searchItems.length > 0 ? (
            <div className="space-y-12">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#008080]" />
                    Matching Products & Varieties ({searchItems.length})
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {searchItems.map((item) => (
                    <SearchItemCardComponent key={item.id} item={item} />
                  ))}
                </div>
              </div>

              {/* Related / Recommended Section ("Frequently Bought Together") */}
              {relatedProducts.length > 0 && (
                <div className="pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                        Frequently Paired With This
                      </h2>
                      <p className="text-gray-500 text-sm mt-0.5">
                        Customers also purchase these items with their selection.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {relatedProducts.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : rawQuery ? (
            /* No Results Fallback */
            <div className="bg-white rounded-3xl p-12 md:p-20 text-center shadow-xs border border-gray-100 max-w-xl mx-auto flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-6 border border-gray-100">
                <Search className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No products found
              </h2>
              <p className="text-gray-500 mb-6 max-w-md text-sm leading-relaxed">
                We couldn&apos;t find any items matching &ldquo;{rawQuery}&rdquo;.
                Try one of our popular searches below:
              </p>

              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {["Coffee", "Bru", "Tea", "Soap", "Camphor", "Detergent", "Oil"].map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag.toLowerCase())}`}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-[#008080] hover:text-white rounded-full text-xs font-bold text-gray-700 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              <Link
                href="/categories"
                className="px-6 py-3 bg-[#008080] hover:bg-[#006666] text-white font-bold rounded-xl transition-all shadow-md flex items-center gap-2 text-sm"
              >
                Browse All Categories
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
