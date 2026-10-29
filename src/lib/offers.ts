import { supabase } from "@/lib/supabase";
import { Offer } from "@/types/database";

// Empty by default - no fake or sample offers!
export const DEFAULT_OFFERS: Offer[] = [];

const LOCAL_STORAGE_KEY = "ksn_store_offers_cache";

export async function fetchOffers(): Promise<Offer[]> {
  // 1. Try fetching from Supabase if table exists
  try {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      // Purge any fake sample offers if they exist
      const cleanData = data.filter((o) => o.id !== "offer-1" && o.id !== "offer-2");
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanData));
        } catch {}
      }
      return cleanData;
    }
  } catch (err) {
    // Supabase table may not exist yet, fallback to localStorage
  }

  // 2. Fallback to localStorage
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached !== null) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          // Filter out any fake sample offers
          const clean = parsed.filter((o) => o.id !== "offer-1" && o.id !== "offer-2");
          return clean;
        }
      }
    } catch {}
  }

  return [];
}

export async function saveOfferToDb(offer: Partial<Offer> & { id?: string }): Promise<Offer> {
  // Clean up any fake offers first
  const current = await fetchOffers();
  const existing = offer.id ? current.find((o) => o.id === offer.id) : null;
  const isNew = !offer.id || !existing;

  const payload: any = {
    title: offer.title?.trim() || "Special Offer",
    description: offer.description?.trim() || "",
    badge: offer.badge?.trim() || "SPECIAL DEAL",
    image_url: offer.image_url?.trim() || null,
    link_url: offer.link_url?.trim() || "/products",
    product_id: offer.product_id || null,
    variety_id: offer.variety_id || null,
    is_active: offer.is_active ?? true,
  };

  try {
    if (isNew) {
      const { data, error } = await supabase
        .from("offers")
        .insert(payload)
        .select()
        .single();
      if (!error && data) {
        syncLocalStorage(data, true);
        return data;
      }
    } else {
      const { data, error } = await supabase
        .from("offers")
        .update(payload)
        .eq("id", offer.id)
        .select()
        .single();
      if (!error && data) {
        syncLocalStorage(data, false);
        return data;
      }
    }
  } catch (err) {
    console.warn("Supabase offers table save fallback", err);
  }

  // Local storage fallback
  const fallbackOffer: Offer = {
    id: offer.id && !isNew ? offer.id : `custom-offer-${Date.now()}`,
    title: payload.title,
    description: payload.description,
    badge: payload.badge,
    image_url: payload.image_url,
    link_url: payload.link_url,
    product_id: payload.product_id,
    variety_id: payload.variety_id,
    is_active: payload.is_active,
    created_at: new Date().toISOString(),
  };

  syncLocalStorage(fallbackOffer, isNew);
  return fallbackOffer;
}

function syncLocalStorage(offer: Offer, isNew: boolean) {
  if (typeof window === "undefined") return;
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    let list: Offer[] = cached ? JSON.parse(cached) : [];
    // Clean out fake offers
    list = list.filter((o) => o.id !== "offer-1" && o.id !== "offer-2");

    if (isNew) {
      list = [offer, ...list.filter((o) => o.id !== offer.id)];
    } else {
      list = list.map((o) => (o.id === offer.id ? offer : o));
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {}
}

export async function deleteOfferFromDb(offerId: string): Promise<boolean> {
  try {
    await supabase.from("offers").delete().eq("id", offerId);
  } catch {}

  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      let list: Offer[] = cached ? JSON.parse(cached) : [];
      list = list.filter((o) => o.id !== offerId && o.id !== "offer-1" && o.id !== "offer-2");
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch {}
  }

  return true;
}
