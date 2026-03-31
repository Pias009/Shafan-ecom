import { create } from "zustand";
import { persist } from "zustand/middleware";
export interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number; // Base price
  imageUrl: string;
  discountPrice?: number;
  countryPrices?: Array<{
    country: string;
    priceCents: number;
    currency: string;
  }>;
}

export interface CartItem extends ProductSummary {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
  couponDiscount: number;
  addItem: (product: ProductSummary, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  clearCart: () => void;
  hasAddress: boolean;
  setHasAddress: (val: boolean) => void;
  getCountryPrice: (productId: string) => number | null;
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
      getCountryPrice: (productId: string) => {
        return null; // Placeholder - actual implementation depends on country price lookup
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
