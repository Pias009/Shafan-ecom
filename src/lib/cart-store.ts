import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useCountryStore } from "./country-store";

export interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number; // Base price (direct decimal)
  imageUrl: string;
  discountPrice?: number;
  countryPrices?: Array<{
    country: string;
    price: number;
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
  couponMaxLimit: number | null;
  addItem: (product: ProductSummary, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeCoupon: () => void;
  clearCart: () => void;
  hasAddress: boolean;
  setHasAddress: (val: boolean) => void;
  refreshPrices: () => Promise<void>;
}

const getPriceForCountry = (product: ProductSummary, countryCode: string): number => {
  if (product.countryPrices && product.countryPrices.length > 0) {
    const countryPrice = product.countryPrices.find(
      (cp) => cp.country.toUpperCase() === countryCode.toUpperCase()
    );
    if (countryPrice && countryPrice.price > 0) {
      return countryPrice.price;
    }
  }
  return 0;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      couponDiscount: 0,
      couponMaxLimit: null,
      addItem: (product, quantity = 1) =>
        set((state) => {
          // STRICT: Preserve entire countryPrices object for live recalculation
          const { selectedCountry } = useCountryStore.getState();
          const validPrice = getPriceForCountry(product, selectedCountry);
          
          if (validPrice <= 0) return state;
          
          // Preserve all product data including countryPrices for live price calculation
          const cartItem = {
            ...product,
            price: validPrice,
            quantity,
            // Ensure countryPrices is always preserved
            countryPrices: product.countryPrices || []
          };
          
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id 
                  ? { ...item, quantity: item.quantity + quantity } 
                  : item
              ),
            };
          }
          return { items: [...state.items, cartItem] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== productId) })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
          ),
        })),
      applyCoupon: async (code: string) => {
        try {
          const country = useCountryStore.getState().selectedCountry || "AE";
          const res = await fetch("/api/coupons/validate?code=" + code + "&country=" + country);
          const data = await res.json();
          if (data.valid && data.discount) {
            set({ 
              couponCode: code, 
              couponDiscount: data.discount,
              couponMaxLimit: data.maxLimitAmount || null 
            });
            return { success: true };
          }
          set({ couponCode: null, couponDiscount: 0, couponMaxLimit: null });
          return { success: false, error: data.error || "Invalid coupon" };
        } catch {
          set({ couponCode: null, couponDiscount: 0, couponMaxLimit: null });
          return { success: false, error: "Failed to validate coupon" };
        }
      },
      removeCoupon: () => set({ couponCode: null, couponDiscount: 0, couponMaxLimit: null }),
      clearCart: () => set({ items: [], couponCode: null, couponDiscount: 0 }),
      hasAddress: false,
      setHasAddress: (val) => set({ hasAddress: val }),
      refreshPrices: async () => {
        const { items } = get();
        const { selectedCountry } = useCountryStore.getState();
        
        // Fetch fresh prices from DB
        try {
          const productIds = items.map((item) => item.id);
          const res = await fetch("/api/products/prices?ids=" + productIds.join(",") + "&country=" + selectedCountry);
          const data = await res.json();
          
          if (data.prices) {
            set((state) => ({
              items: state.items.map((item) => {
                const freshPrice = data.prices[item.id];
                if (freshPrice && freshPrice > 0) {
                  return { ...item, price: freshPrice };
                }
                // If no valid price for country, mark as unavailable
                return { ...item, price: 0 };
              }),
            }));
          }
        } catch (error) {
          console.error("Failed to refresh cart prices:", error);
        }
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
