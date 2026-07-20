"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, Variation } from "@/data/products";
import { supabase } from "@/lib/supabase";

interface CartItem {
  product: Product;
  variation?: Variation;
  quantity: number;
}

interface StoreContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  cart: CartItem[];
  addToCart: (product: Product, variation?: Variation) => void;
  removeFromCart: (productId: string, variationId?: string) => void;
  decreaseQuantity: (productId: string, variationId?: string) => void;
  clearCart: () => void;
  totalCartItems: number;
  totalCartPrice: number;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  previewProduct: Product | null;
  setPreviewProduct: (product: Product | null) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // ─── Auth listener: track current user ───────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Load cart from localStorage on mount ────────────────────────────────
  useEffect(() => {
    const savedCart = localStorage.getItem("mpstore_cart");
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error(e); }
    }
  }, []);

  // ─── Load wishlist: Supabase (logged in only) ─────────
  useEffect(() => {
    const loadWishlist = async () => {
      if (userId) {
        // Logged in → load from Supabase
        const { data, error } = await supabase
          .from("wishlists")
          .select("product_id")
          .eq("user_id", userId);

        if (!error && data) {
          const serverIds = data.map((row: any) => row.product_id);
          setWishlist(serverIds);
        }
      } else {
        // Guest → clear wishlist so it doesn't leak between accounts
        setWishlist([]);
      }
    };

    loadWishlist();
  }, [userId]);

  // ─── Save cart to localStorage ───────────────────────────────────────────
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("mpstore_cart", JSON.stringify(cart));
    } else {
      localStorage.removeItem("mpstore_cart");
    }
  }, [cart]);

  // ─── Guest: removed wishlist localStorage to prevent global leakage ──────

  // ─── Cart actions ─────────────────────────────────────────────────────────
  const addToCart = (product: Product, variation?: Variation) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.product.id === product.id && item.variation?.id === variation?.id
      );
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id && item.variation?.id === variation?.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, variation, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string, variationId?: string) => {
    setCart((prevCart) => prevCart.filter(
      (item) => !(item.product.id === productId && item.variation?.id === variationId)
    ));
  };

  const decreaseQuantity = (productId: string, variationId?: string) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.product.id === productId && item.variation?.id === variationId) {
          return { ...item, quantity: Math.max(1, item.quantity - 1) };
        }
        return item;
      })
    );
  };

  const clearCart = () => setCart([]);

  // ─── Wishlist toggle: Supabase (login required) ───────────
  const toggleWishlist = async (productId: string) => {
    if (!userId) {
      alert("Silakan login untuk menambahkan produk ke Wishlist Anda.");
      return;
    }

    const isInWishlist = wishlist.includes(productId);

    if (isInWishlist) {
      await supabase
        .from("wishlists")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);
    } else {
      await supabase
        .from("wishlists")
        .insert({ user_id: userId, product_id: productId });
    }

    setWishlist((prev) =>
      isInWishlist ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (acc, item) => {
      const itemPrice = item.variation 
        ? (item.variation.discount_price ?? item.variation.price) 
        : item.product.price;
      return acc + itemPrice * item.quantity;
    },
    0
  );

  return (
    <StoreContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        cart,
        addToCart,
        removeFromCart,
        decreaseQuantity,
        clearCart,
        totalCartItems,
        totalCartPrice,
        wishlist,
        toggleWishlist,
        previewProduct,
        setPreviewProduct,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};
