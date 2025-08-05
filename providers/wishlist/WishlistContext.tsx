"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

type WishlistItem = {
  _id: string;
  name: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  price: number;
  images: string[];
};

type WishlistContextType = {
  wishlist: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
  loading: boolean;
  error: string | null;
};

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch (error) {
        console.error("Failed to parse wishlist from localStorage:", error);
        setError("Failed to load wishlist");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const addItem = (item: WishlistItem) => {
    setWishlist((current) => {
      const exists = current.some((i) => i._id === item._id);
      if (exists) {
        toast.error("Item already in wishlist");
        return current;
      }
      toast.success("Added to wishlist");
      return [...current, item];
    });
  };

  const removeItem = (id: string) => {
    setWishlist((current) => current.filter((item) => item._id !== id));
    toast.success("Removed from wishlist");
  };

  const clearWishlist = () => {
    setWishlist([]);
    toast.success("Wishlist cleared");
  };

  const isInWishlist = (id: string) => {
    return wishlist.some((item) => item._id === id);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addItem,
        removeItem,
        clearWishlist,
        isInWishlist,
        loading,
        error,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
