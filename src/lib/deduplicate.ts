import { Product } from "@/types/database";

/**
 * Extracts embedded offer metadata (fallback when DB offer column hasn't been migrated yet)
 * and cleans product description.
 */
export function parseProductOffers<T extends Product | null | undefined>(product: T): T {
  if (!product) return product;

  let offer = product.offer || null;
  let cleanDesc = product.description || "";
  let varietyOffers: Record<string, string> = {};

  const match = cleanDesc.match(/<!--KSN_OFFERS:(.*?)-->/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (!offer && parsed.product) {
        offer = parsed.product;
      }
      if (parsed.varieties && typeof parsed.varieties === "object") {
        varietyOffers = parsed.varieties;
      }
    } catch {}
    cleanDesc = cleanDesc.replace(/<!--KSN_OFFERS:.*?-->/g, "").trim();
  }

  const updatedVarieties = product.varieties?.map((v) => ({
    ...v,
    offer:
      v.offer ||
      varietyOffers[v.id] ||
      (v.label ? varietyOffers[v.label.trim()] : null) ||
      (v.name ? varietyOffers[v.name.trim()] : null) ||
      null,
  }));

  return {
    ...product,
    offer: offer || null,
    description: cleanDesc || null,
    varieties: updatedVarieties,
  } as T;
}

/**
 * Normalizes/renames product names to fit exact requested spelling.
 */
export function fixProduct<T extends Product | null | undefined>(product: T): T {
  if (!product) return product;

  let p = parseProductOffers(product);
  
  // Map "Vanish Washing Powder" to the exact user-specified name and assign 'Home & Cleaning' category
  if (p.name === "Vanish Washing Powder") {
    p = {
      ...p,
      name: "vanie washine powder",
      category_id: "de975c3a-13d9-4944-8bb7-aa8574d6a4fa",
      categories: {
        name: "Home & Cleaning",
        slug: "home-cleaning"
      }
    };
  }
  
  return p as T;
}

/**
 * Clean up and deduplicate products list based on case-insensitive names.
 * Ensures the product with valid varieties and working images is selected.
 */
export function deduplicateProducts(products: Product[] | null): Product[] {
  if (!products) return [];
  
  const map = new Map<string, Product>();
  
  for (const rawProduct of products) {
    const product = fixProduct(rawProduct);
    const key = product.name.trim().toLowerCase();
    const existing = map.get(key);
    
    if (!existing) {
      map.set(key, product);
    } else {
      const existingVarietiesCount = existing.varieties?.length || 0;
      const currentVarietiesCount = product.varieties?.length || 0;
      
      // Rule 1: Prefer the product entry with actual varieties in database
      if (currentVarietiesCount > existingVarietiesCount) {
        map.set(key, product);
      } 
      // Rule 2: If varieties count is same, prefer the one with a real/working image URL
      else if (currentVarietiesCount === existingVarietiesCount) {
        const isExistingImgValid = existing.image_url && 
          !existing.image_url.includes('example.com') && 
          (existing.image_url.includes('supabase.co') || existing.image_url.includes('unsplash.com'));
          
        const isCurrentImgValid = product.image_url && 
          !product.image_url.includes('example.com') && 
          (product.image_url.includes('supabase.co') || product.image_url.includes('unsplash.com'));
          
        if (isCurrentImgValid && !isExistingImgValid) {
          map.set(key, product);
        }
      }
    }
  }
  
  return Array.from(map.values());
}
