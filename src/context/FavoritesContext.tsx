"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/types/database";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";

type FavoritesContextType = {
  favorites: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  favoritesCount: number;
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage or Supabase
  useEffect(() => {
    async function loadFavorites() {
      if (user) {
        // Fetch from Supabase
        const { data, error } = await supabase
          .from('favorites')
          .select('products (*, varieties(*))')
          .eq('user_id', user.id);
        
        if (data && !error) {
          // Extract the product data from the joined query
          const dbFavorites = (data as any[]).map((f: any) => f.products).filter((p): p is Product => !!p);
          
          // Merge with local if any (first time login)
          const stored = localStorage.getItem("ksn_favorites");
          if (stored) {
            const localFavs = JSON.parse(stored);
            const merged = [...dbFavorites];
            localFavs.forEach((lf: Product) => {
              if (!merged.some(m => m.id === lf.id)) {
                merged.push(lf);
                // Also save this new one to DB
                supabase.from('favorites').insert({ user_id: user.id, product_id: lf.id }).then();
              }
            });
            setFavorites(merged);
            localStorage.removeItem("ksn_favorites"); // Clear local once merged
          } else {
            setFavorites(dbFavorites);
          }
        }
      } else {
        // Guest mode: load from localStorage
        const stored = localStorage.getItem("ksn_favorites");
        if (stored) {
          try {
            setFavorites(JSON.parse(stored));
          } catch (e) {
            console.error("Failed to parse favorites", e);
          }
        }
      }
      setIsLoaded(true);
    }

    loadFavorites();
  }, [user]);

  // Save to localStorage ONLY if guest
  useEffect(() => {
    if (isLoaded && !user) {
      localStorage.setItem("ksn_favorites", JSON.stringify(favorites));
    }
  }, [favorites, isLoaded, user]);


  const toggleFavorite = async (product: Product) => {
    const exists = favorites.some(p => p.id === product.id);
    
    // Update local state immediately for UI responsiveness
    if (exists) {
      setFavorites(prev => prev.filter(p => p.id !== product.id));
    } else {
      setFavorites(prev => [...prev, product]);
    }

    // Sync with DB if logged in
    if (user) {
      if (exists) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
      } else {
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, product_id: product.id });
      }
    }
  };

  const isFavorite = (productId: string) => {
    return favorites.some(p => p.id === productId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, favoritesCount: favorites.length }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    return {
      favorites: [],
      toggleFavorite: () => {},
      isFavorite: () => false,
      favoritesCount: 0
    };
  }
  return context;
}
