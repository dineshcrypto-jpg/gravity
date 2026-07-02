import { Product } from "@/types/database";

/**
 * Normalizes/renames product names to fit exact requested spelling.
 */
export function fixProduct<T extends Product | null | undefined>(product: T): T {
  if (!product) return product;
  
  // Map "Vanish Washing Powder" to the exact user-specified name and assign 'Home & Cleaning' category
  if (product.name === "Vanish Washing Powder") {
    return {
      ...product,
      name: "vanie washine powder",
      category_id: "de975c3a-13d9-4944-8bb7-aa8574d6a4fa",
      categories: {
        name: "Home & Cleaning",
        slug: "home-cleaning"
      }
    };
  }
  
  return product;
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
