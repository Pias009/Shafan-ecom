"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useCountryStore } from "@/lib/country-store";
import { hasValidPrice } from "@/lib/product-utils";
import { Sparkles } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  mainImage: string;
  brand?: { name: string };
  brandName?: string;
  averageRating?: number;
  ratingCount?: number;
  stockQuantity?: number;
  totalSales?: number;
  countryPrices?: Array<{ country: string; price: number; currency: string }>;
}

interface NewArrivalsClientProps {
  products: Product[];
}

export default function NewArrivalsClient({ products }: NewArrivalsClientProps) {
  const router = useRouter();
  const { addItem, hasAddress } = useCartStore();
  const { selectedCountry } = useCountryStore();
  const [quickView, setQuickView] = useState<any | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => hasValidPrice(p, selectedCountry));
  }, [products, selectedCountry]);

  function addToCart(product: any) {
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brandName || product.brand?.name,
      category: product.categoryName,
      price: product.price || 0,
      imageUrl: product.mainImage,
      countryPrices: product.countryPrices,
    };
    addItem(cartItem, 1);
    toast.success(`${product.name} added to cart`);
  }

  async function orderNow(product: any) {
    if (!hasAddress) {
      toast.error("Please add your shipping address first!");
      router.push("/account/address");
      return;
    }

    const tid = toast.loading("Preparing order...");
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: 1, unitPrice: product.price, price: product.price }],
          country: selectedCountry,
        }),
      });
      const data = await res.json();
      if (data.orderId) {
        toast.success("Redirecting...", { id: tid });
        router.push(`/checkout/payment/${data.orderId}`);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      addToCart(product);
      router.push("/cart");
    }
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="min-h-screen bg-white/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
          <div className="text-6xl mb-4 opacity-30">✨</div>
          <h1 className="text-4xl font-black text-black mb-4">Fresh From The Shelf</h1>
          <p className="text-black/50">No new products available right now. Check back soon!</p>
          <button
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-3 bg-black text-white rounded-full font-black text-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 px-4 py-2 rounded-full mb-4">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="font-black text-sm uppercase tracking-widest text-emerald-600">New</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-black">Fresh From The Shelf</h1>
          <p className="text-black/60 mt-2">Latest additions to our collection</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                price: product.price || 0,
                imageUrl: product.mainImage,
                brand: product.brandName || product.brand?.name,
              }}
              onQuickView={(p) => setQuickView(p)}
              onAddToCart={(p) => addToCart(p)}
              onOrderNow={(p) => orderNow(p)}
            />
          ))}
        </div>
      </div>

      <ProductQuickViewModal
        product={quickView}
        onClose={() => setQuickView(null)}
        onAddToCart={(p) => addToCart(p)}
        onOrderNow={(p) => orderNow(p)}
        onMoreDetails={(id) => router.push(`/products/${id}`)}
      />
    </div>
  );
}