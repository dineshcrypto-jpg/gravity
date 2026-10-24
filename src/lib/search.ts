import { Product, Variety } from "@/types/database";

/**
 * Fuzzy / typo tolerance dictionary and synonym mappings
 */
export const SYNONYM_MAP: Record<string, { terms: string[]; relatedCategories?: string[]; relatedKeywords?: string[] }> = {
  // Coffee & related
  coffee: {
    terms: ["coffee", "bru", "nescafe", "sunrise", "continental", "narasu", "kaapi", "காபி"],
    relatedKeywords: ["sugar", "milk powder", "cane jaggery", "biscuit", "tea"],
    relatedCategories: ["snacks & sweets", "cooking essentials"]
  },
  bru: {
    terms: ["bru", "coffee", "instant coffee", "filter coffee"],
    relatedKeywords: ["sugar", "milk powder", "cane jaggery", "biscuit"],
    relatedCategories: ["snacks & sweets", "cooking essentials"]
  },
  tea: {
    terms: ["tea", "chai", "taj mahal", "3 roses", "chakra gold", "red label", "tea powder", "தேநீர்"],
    relatedKeywords: ["sugar", "milk powder", "biscuit", "rusk"],
    relatedCategories: ["snacks & sweets", "cooking essentials"]
  },
  // Soaps & Personal Care
  soap: {
    terms: [
      "soap", "cinthol", "hamam", "mysore sandal", "dove", "lifebuoy", 
      "medimix", "pears", "margo", "rexona", "liril", "velvette", 
      "nature power", "krea", "gokul santol", "lux"
    ],
    relatedKeywords: ["shampoo", "shikakai", "paste", "meswak"],
    relatedCategories: ["personal care"]
  },
  shampoo: {
    terms: ["shampoo", "head & shoulders", "dove", "coop", "shikakai", "கூந்தல்"],
    relatedKeywords: ["soap", "coconut oil", "hair oil"],
    relatedCategories: ["personal care"]
  },
  // Oils & Ghee
  oil: {
    terms: [
      "oil", "gingelly", "sunflower", "groundnut", "castor", "dheepam", 
      "gold winner", "idhayam", "vvd", "winner", "நல்லெண்ணெய்", "porna", "vvv"
    ],
    relatedKeywords: ["ghee", "dalda", "mustard", "kaduku", "seeragam"],
    relatedCategories: ["cooking essentials", "pooja items"]
  },
  ghee: {
    terms: ["ghee", "cow ghee", "நெய்"],
    relatedKeywords: ["oil", "dalda", "sugar", "kalkandu"],
    relatedCategories: ["cooking essentials"]
  },
  // Sweeteners & Salts
  sugar: {
    terms: ["sugar", "jaggery", "cane jaggery", "நாட்டு சர்க்கரை", "வெல்லம்", "kalkandu", "சீனி"],
    relatedKeywords: ["coffee", "tea", "milk powder", "rava"],
    relatedCategories: ["cooking essentials", "snacks & sweets"]
  },
  salt: {
    terms: ["salt", "tata", "kristal", "kassturi", "pasumalai", "rock salt", "கல் உப்பு", "தூள் உப்பு"],
    relatedKeywords: ["chilli powder", "turmeric powder", "oil", "rice"],
    relatedCategories: ["cooking essentials"]
  },
  // Pooja Items
  camphor: {
    terms: ["camphor", "sudam", "கற்பூரம்", "cycle", "dharshini", "சூடம்"],
    relatedKeywords: ["agarbathi", "sambrani", "match box", "dheepam", "cotton wicks"],
    relatedCategories: ["pooja items"]
  },
  agarbathi: {
    terms: ["agarbathi", "agarbatti", "bathi", "incense", "zed black", "cycle", "mangaldeep", "அகர்பத்தி"],
    relatedKeywords: ["camphor", "sambrani", "match box", "vibuthi", "kumkum"],
    relatedCategories: ["pooja items"]
  },
  sambrani: {
    terms: ["sambrani", "cycle", "dharshini", "mangaldeep", "zed black", "sugam", "சாம்பிராணி"],
    relatedKeywords: ["camphor", "agarbathi", "match box", "pure cotton wicks"],
    relatedCategories: ["pooja items"]
  },
  // Cleaning & Laundry
  detergent: {
    terms: [
      "detergent", "surf excel", "rin", "vanish", "challenge", "mugi", 
      "waso", "bubbli", "el-rey-vibe", "washing powder", "soap oil"
    ],
    relatedKeywords: ["scrubber", "clips", "bleaching powder", "fabric conditioner"],
    relatedCategories: ["home & cleaning"]
  },
  toilet_cleaner: {
    terms: ["toilet cleaner", "harpic", "domex", "sri clean", "drain cleaner"],
    relatedKeywords: ["bleaching powder", "floor cleaner", "scrubber", "dustbin cover"],
    relatedCategories: ["home & cleaning"]
  },
  dishwash: {
    terms: [
      "dishwash", "dish wash", "vim", "higard", "pril", "jay ec", 
      "sabena", "pitambari", "scrubber", "sponge"
    ],
    relatedKeywords: ["steel scrubber", "table sponge", "detergent"],
    relatedCategories: ["home & cleaning"]
  },
  // Cooking & Spices
  masala: {
    terms: [
      "masala", "sakthi", "aachi", "meiyal", "preethi", "everest", 
      "sambar powder", "chilli powder", "turmeric powder", "coriander powder"
    ],
    relatedKeywords: ["oil", "salt", "mustard", "kaduku", "seeragam", "milagu"],
    relatedCategories: ["cooking essentials"]
  },
  rice: {
    terms: [
      "rice", "basmathi", "seeraga samba", "karuppu kavuni", "samai", 
      "varagu", "kuthirai valli", "solam", "அரிசி", "idiyappam flour", "rava"
    ],
    relatedKeywords: ["dhall", "dal", "oil", "ghee", "salt"],
    relatedCategories: ["cooking essentials"]
  },
  dal: {
    terms: ["dhall", "dal", "dhal", "orid", "sundal", "pasi payar", "pattani", "கானப் பயர்", "உளுந்து", "பருப்பு"],
    relatedKeywords: ["rice", "mustard", "chilli powder", "turmeric powder", "oil"],
    relatedCategories: ["cooking essentials"]
  }
};

/**
 * Common typo mappings for instant phonetic/fuzzy resolution
 */
export const TYPO_CORRECTIONS: Record<string, string> = {
  // Coffee / Tea
  coffy: "coffee",
  cofe: "coffee",
  coffe: "coffee",
  bry: "bru",
  brue: "bru",
  kaapi: "coffee",
  chai: "tea",
  chay: "tea",
  // Personal care
  shampo: "shampoo",
  shamoo: "shampoo",
  shampu: "shampoo",
  senso: "santoor",
  santur: "santoor",
  mysor: "mysore sandal",
  cinthol: "godrej cinthol",
  // Cleaning
  harpeek: "harpic",
  harpek: "harpic",
  tolit: "toilet cleaner",
  tolet: "toilet cleaner",
  flour: "floor cleaner",
  dustpin: "dustbin cover",
  vamish: "vanish",
  // Pooja
  sudam: "camphor",
  sutham: "camphor",
  karpooram: "camphor",
  agarbati: "agarbathi",
  agarbatti: "agarbathi",
  sambirani: "sambrani",
  // Essentials
  pantani: "pattani",
  sakkarai: "sugar",
  vellam: "jaggery",
  ney: "ghee",
  uppu: "salt",
  kadugu: "kaduku"
};

/**
 * Standard Levenshtein distance algorithm for calculating typo distance
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Expand a user's search query into all synonymous search tokens,
 * brand keywords, and typo-corrected terms.
 */
export function getExpandedSearchTerms(query: string): {
  normalizedQuery: string;
  searchTokens: string[];
  relatedKeywords: string[];
  suggestedCorrection?: string;
} {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return { normalizedQuery: "", searchTokens: [], relatedKeywords: [] };
  }

  // 1. Direct typo check
  const corrected = TYPO_CORRECTIONS[clean];
  const activeWord = corrected || clean;

  const searchTokensSet = new Set<string>([clean, activeWord]);
  const relatedKeywordsSet = new Set<string>();

  // 2. Check each word in multi-word queries
  const words = clean.split(/\s+/);
  for (const w of words) {
    searchTokensSet.add(w);
    if (TYPO_CORRECTIONS[w]) {
      searchTokensSet.add(TYPO_CORRECTIONS[w]);
    }
  }

  // 3. Match against Synonym Dictionary
  for (const [key, mapping] of Object.entries(SYNONYM_MAP)) {
    const isDirectMatch = 
      activeWord === key || 
      mapping.terms.some((t) => t.toLowerCase().includes(activeWord) || activeWord.includes(t.toLowerCase()));

    // Fuzzy check if word length >= 4
    const isFuzzyMatch = 
      !isDirectMatch && 
      activeWord.length >= 4 && 
      (levenshteinDistance(activeWord, key) <= 2 || mapping.terms.some((t) => t.length >= 4 && levenshteinDistance(activeWord, t) <= 1));

    if (isDirectMatch || isFuzzyMatch) {
      mapping.terms.forEach((t) => searchTokensSet.add(t));
      mapping.relatedKeywords?.forEach((k) => relatedKeywordsSet.add(k));
    }
  }

  return {
    normalizedQuery: activeWord,
    searchTokens: Array.from(searchTokensSet),
    relatedKeywords: Array.from(relatedKeywordsSet),
    suggestedCorrection: corrected && corrected !== clean ? corrected : undefined
  };
}

/**
 * Represents a single expanded variety card item for search results.
 * Allows every single variety of a product (even 10 varieties) to be displayed
 * individually with exact price, size, and image.
 */
export interface SearchItemCard {
  id: string; // unique key (e.g. `${product.id}-${variety.id}`)
  productId: string;
  varietyId: string;
  displayName: string;
  variantLabel: string;
  price: number;
  weight: string | null;
  imageUrl: string;
  isInStock: boolean;
  categoryName?: string;
  rawProduct: Product;
  rawVariety?: Variety;
}

/**
 * Expands a list of products and their varieties into granular search items.
 * If a product has multiple varieties (e.g., 3 or 10 varieties), it expands them
 * so the customer can see all varieties directly in the search grid.
 */
export function expandProductVarietiesForSearch(
  products: Product[],
  searchQuery: string
): SearchItemCard[] {
  const result: SearchItemCard[] = [];
  const cleanQuery = searchQuery.trim().toLowerCase();

  for (const product of products) {
    const varieties = product.varieties || [];

    if (varieties.length === 0) {
      // Standard product without varieties
      result.push({
        id: product.id,
        productId: product.id,
        varietyId: "default",
        displayName: product.name,
        variantLabel: product.weight || "Standard",
        price: product.price,
        weight: product.weight || null,
        imageUrl: product.image_url || "/images/placeholder.svg",
        isInStock: product.is_in_stock,
        categoryName: product.categories?.name,
        rawProduct: product
      });
    } else {
      // Product has multiple varieties (e.g., 10 varieties!)
      // Check if user searched for a specific variant or the whole product
      for (const v of varieties) {
        const variantName = v.name || v.label || "";
        const fullName = `${product.name} ${variantName}`.trim();

        result.push({
          id: `${product.id}_${v.id}`,
          productId: product.id,
          varietyId: v.id,
          displayName: product.name,
          variantLabel: variantName,
          price: v.price || product.price,
          weight: v.weight || product.weight || null,
          imageUrl: v.image_url || product.image_url || "/images/placeholder.svg",
          isInStock: product.is_in_stock && (v.is_in_stock !== false),
          categoryName: product.categories?.name,
          rawProduct: product,
          rawVariety: v
        });
      }
    }
  }

  // Prioritize exact matches to the top
  if (cleanQuery) {
    result.sort((a, b) => {
      const aMatchesDirectly = 
        a.displayName.toLowerCase().includes(cleanQuery) || 
        a.variantLabel.toLowerCase().includes(cleanQuery);
      const bMatchesDirectly = 
        b.displayName.toLowerCase().includes(cleanQuery) || 
        b.variantLabel.toLowerCase().includes(cleanQuery);

      if (aMatchesDirectly && !bMatchesDirectly) return -1;
      if (!aMatchesDirectly && bMatchesDirectly) return 1;
      return 0;
    });
  }

  return result;
}
