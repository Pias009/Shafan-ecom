import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DemoProduct } from "./demo-data"; // Currently using DemoProduct since there are no schema definitions for Product.

export interface CartItem extends DemoProduct {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number; // For demo: e.g. 0.1 for 10% off
  addItem: (product: DemoProduct, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  hasAddress: boolean;
  setHasAddress: (val: boolean) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,
      addItem: (product, quantity = 1) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity }] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),
      applyCoupon: (code) =>
        set(() => {
          // Dummy coupon validation logic
          if (code.toUpperCase() === "DISCOUNT10") {
            return { couponCode: code, couponDiscount: 0.1 };
          }
          if (code.toUpperCase() === "SAVE20") {
            return { couponCode: code, couponDiscount: 0.2 };
          }
          return { couponCode: null, couponDiscount: 0 };
        }),
      removeCoupon: () => set({ couponCode: null, couponDiscount: 0 }),
      clearCart: () => set({ items: [], couponCode: null, couponDiscount: 0 }),
      hasAddress: false,
      setHasAddress: (val) => set({ hasAddress: val }),
    }),
    {
      name: "cart-storage",
    }
  )
);
