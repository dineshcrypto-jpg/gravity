"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, Variety } from "@/types/database";

export type CartItem = {
  product: Product;
  variety: Variety;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (product: Product, variety: Variety, quantity: number) => void;
  removeFromCart: (productId: string, varietyId: string) => void;
  updateQuantity: (productId: string, varietyId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Simple add to cart logic
  const addToCart = (product: Product, variety: Variety, quantity: number) => {
    setItems((prev) => {
      // Check if this exact product+variety is already in cart
      const existing = prev.find(i => i.product.id === product.id && i.variety.id === variety.id);
      if (existing) {
        return prev.map(i => 
          i.product.id === product.id && i.variety.id === variety.id 
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, variety, quantity }];
    });
  };

  const removeFromCart = (productId: string, varietyId: string) => {
    setItems((prev) => prev.filter(i => !(i.product.id === productId && i.variety.id === varietyId)));
  };

  const updateQuantity = (productId: string, varietyId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, varietyId);
      return;
    }
    setItems((prev) => 
      prev.map(i => 
        i.product.id === productId && i.variety.id === varietyId 
          ? { ...i, quantity } 
          : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = items.reduce((total, item) => total + (item.variety.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
