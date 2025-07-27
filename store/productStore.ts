import { create } from "zustand";
import { Product } from "@/types";
import axios from "axios";
import { mutate } from "swr";

interface ProductStore {
  deletedProducts: Set<string>;
  deleteProduct: (productId: string) => Promise<void>;
  isDeleted: (productId: string) => boolean;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  deletedProducts: new Set<string>(),

  deleteProduct: async (productId: string) => {
    try {
      const response = await axios.delete(`/api/products/manage/${productId}`);

      if (response.data.deletedProductId) {
        // Update local state
        set((state) => ({
          deletedProducts: new Set([...state.deletedProducts, productId]),
        }));

        // First broadcast deletion event
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("product:deleted", {
              detail: {
                productId,
                timestamp: Date.now(),
              },
            })
          );
        }

        // Then clear caches after event broadcast
        await Promise.all([
          mutate(
            (key) => typeof key === "string" && key.includes("/api/products"),
            undefined,
            { revalidate: true }
          ),
          mutate(
            (key) =>
              typeof key === "string" &&
              key.includes(`/api/product/${productId}`),
            null,
            { revalidate: false }
          ),
        ]);
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      throw error;
    }
  },

  isDeleted: (productId: string) => {
    return get().deletedProducts.has(productId);
  },
}));
