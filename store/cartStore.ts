import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartStore, AddToCartItem } from "@/types";
import axios from "axios";

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedDeliveryType: 0,
      addItem: (item: AddToCartItem) =>
        set((state) => {
          const existingItem = state.items.find((i) => i._id === item._id);
          if (existingItem) {
            return {
              ...state,
              items: state.items.map((i) =>
                i._id === item._id
                  ? {
                      ...i,
                      quantity: (i.quantity || 1) + (item.quantity || 1),
                    }
                  : i
              ),
            };
          }
          const cartItem: CartItem = {
            _id: item._id,
            name: item.name,
            displayNames: item.displayNames,
            images: item.images,
            price: item.price,
            brand: item.brand,
            quantity: item.quantity || 1,
          };
          return { ...state, items: [...state.items, cartItem] };
        }),
      removeItem: (itemId: string) =>
        set((state) => ({
          ...state,
          items: state.items.filter((item) => item._id !== itemId),
        })),
      clearCart: async () => {
        console.log("Clearing cart...");

        try {
          // Clear Zustand state first to prevent any UI flicker
          set({ items: [], selectedDeliveryType: 0 });

          // Clear all storage synchronously
          window.localStorage.removeItem("cart-storage");

          // Then clear server cart
          await axios.patch("/api/userData", { cart: [] });
          console.log("Server cart cleared successfully");

          // Double-check that everything is cleared after a short delay
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              set({ items: [], selectedDeliveryType: 0 });
              window.localStorage.removeItem("cart-storage");
              resolve();
            }, 100);
          });
        } catch (error) {
          console.error("Failed to clear server cart:", error);
          // Ensure local state is cleared even if server fails
          set({ items: [], selectedDeliveryType: 0 });
          window.localStorage.removeItem("cart-storage");
          // Resolve the promise even if there's an error
          return Promise.resolve();
        }
      },
      getTotalItems: () =>
        get().items.reduce((total, item) => total + (item.quantity || 1), 0),
      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.price * (item.quantity || 1),
          0
        ),
      updateItemQuantity: (itemId: string, quantity: number) =>
        set((state) => ({
          ...state,
          items: state.items.map((item) =>
            item._id === itemId ? { ...item, quantity } : item
          ),
        })),
      loadServerCart: async () => {
        try {
          const response = await axios.get("/api/userData");
          if (response.data?.cart) {
            const serverCart = response.data.cart;
            set((state) => ({ ...state, items: serverCart }));
          }
        } catch (error) {
          console.error("Failed to load server cart:", error);
        }
      },
      setSelectedDeliveryType: (type: number) => {
        console.log("Setting delivery type in store:", {
          type,
          typeOf: typeof type,
        });
        set((state) => {
          if (type < 0) {
            console.warn(
              `Invalid delivery type index: ${type}, defaulting to 0`
            );
            return { ...state, selectedDeliveryType: 0 };
          }
          return { ...state, selectedDeliveryType: type };
        });

        // Persist the delivery type to localStorage immediately
        try {
          const currentStore = JSON.parse(
            localStorage.getItem("cart-storage") || "{}"
          );
          console.log("Current store before update:", currentStore);
          localStorage.setItem(
            "cart-storage",
            JSON.stringify({
              ...currentStore,
              state: { ...currentStore.state, selectedDeliveryType: type },
            })
          );
          console.log(
            "Updated store:",
            JSON.parse(localStorage.getItem("cart-storage") || "{}")
          );
        } catch (error) {
          console.error("Failed to persist delivery type:", error);
        }
      },
    }),
    {
      name: "cart-storage",
      version: 1,
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          console.log("Loading cart from storage:", str);
          try {
            const data = str ? JSON.parse(str) : null;
            if (data && typeof data.state.selectedDeliveryType === "string") {
              console.log("Converting delivery type from string:", {
                before: data.state.selectedDeliveryType,
                after: Number(data.state.selectedDeliveryType),
              });
              data.state.selectedDeliveryType = Number(
                data.state.selectedDeliveryType
              );
            }
            return data;
          } catch (error) {
            console.error("Failed to parse cart storage:", error);
            return null;
          }
        },
        setItem: (name, value) => {
          console.log("Saving cart to storage:", {
            ...value,
            state: {
              ...value.state,
              selectedDeliveryType: {
                value: value.state.selectedDeliveryType,
                type: typeof value.state.selectedDeliveryType,
              },
            },
          });
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          console.log("Removing cart from storage:", name);
          localStorage.removeItem(name);
        },
      },
    }
  )
);

export default useCartStore;
