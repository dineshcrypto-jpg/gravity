import { Category } from "@/types/database";

/**
 * Sorts categories with exact business priority:
 * 1. KSN Homemade Specials (Always #1 at the very top)
 * 2. Cooking Essentials (Always #2 directly after KSN Specials)
 * 3. Snacks & Sweets
 * 4. Pooja Essentials
 * 5. Personal Care
 * 6. Home & Cleaning
 * 7. Other Essentials
 * 8. Stationery
 * 9. Electronics & Gadgets
 * Followed by any remaining categories sorted alphabetically.
 */
export function sortCategories(categories: Category[]): Category[] {
  if (!Array.isArray(categories)) return [];

  const getPriority = (c: Category): number => {
    const slug = (c.slug || "").toLowerCase();
    const name = (c.name || "").toLowerCase();

    // 1. KSN Specials at the very top
    if (slug.includes("ksn") || name.includes("ksn") || name.includes("homemade")) {
      return 1;
    }
    // 2. Cooking Essentials second
    if (slug.includes("cooking") || name.includes("cooking")) {
      return 2;
    }
    // 3. Snacks & Sweets
    if (slug.includes("snack") || name.includes("snack") || slug.includes("sweet") || name.includes("sweet")) {
      return 3;
    }
    // 4. Pooja Essentials
    if (slug.includes("pooja") || name.includes("pooja")) {
      return 4;
    }
    // 5. Personal Care
    if (slug.includes("personal") || name.includes("personal")) {
      return 5;
    }
    // 6. Home & Cleaning
    if (slug.includes("home") || name.includes("cleaning") || slug.includes("cleaning")) {
      return 6;
    }
    // 7. Other Essentials
    if (slug.includes("other") || name.includes("other")) {
      return 7;
    }
    // 8. Stationery
    if (slug.includes("stationery") || name.includes("stationery")) {
      return 8;
    }
    // 9. Electronics & Gadgets
    if (slug.includes("electronic") || name.includes("electronic") || slug.includes("gadget")) {
      return 9;
    }
    return 100;
  };

  return [...categories].sort((a, b) => {
    const pA = getPriority(a);
    const pB = getPriority(b);
    if (pA !== pB) return pA - pB;
    return (a.name || "").localeCompare(b.name || "");
  });
}
