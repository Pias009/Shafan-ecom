"use client";

import { useState, useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useCartStore } from "@/lib/cart-store";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useCountryStore } from "@/lib/country-store";
import { hasValidPrice } from "@/lib/product-utils";
import { useLoadingStore } from "@/lib/loading-store";
import { trackAddToCart } from "@/lib/datalayer";
import { Sparkles } from "lucide-react";

export default function RoutinePageClient({ products }: { products: any[] }) {
  const router = useRouter();
  const { addItem, hasAddress } = useCartStore();
  const { selectedCountry } = useCountryStore();
  const [quickView, setQuickView] = useState<any | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => hasValidPrice(p, selectedCountry));
  }, [products, selectedCountry]);

  function addToCart(product: any) {
    const cartItem = {
      id: product.id,
      name: product.name,
      brand: product.brandName || product.brand?.name,
      category: product.categoryName,
      price: product.price || 0,
      discountPrice: product.salePrice || undefined,
      imageUrl: product.mainImage || product.imageUrl,
      countryPrices: product.countryPrices,
    };
    addItem(cartItem, 1);
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      currency: 'AED',
      category: product.categoryName || 'General',
      brand: product.brandName || product.brand?.name || 'Generic',
      quantity: 1,
    });
    toast.success(`Added ${product.name} to cart`);
  }

  async function orderNow(product: any) {
    if (!hasAddress) {
      toast.error("Please add your shipping address first!");
      router.push(`/account/address?redirect=order&productId=${product.id}`);
      return;
    }
    const tid = toast.loading("Preparing your order...");
    try {
      const countryPrice = product.countryPrices?.find((cp: any) =>
        cp.country.toUpperCase() === selectedCountry.toUpperCase()
      );
      const unitPrice = countryPrice && Number(countryPrice.price) > 0
        ? Number(countryPrice.price)
        : product.price;

      let billing = null;
      try {
        const r = await fetch("/api/account/address");
        if (r.ok) { const d = await r.json(); if (d) { billing = d; } }
      } catch {}

      if (!billing) {
        const g = localStorage.getItem('guest_address');
        if (g) { try { billing = JSON.parse(g); } catch {} }
      }

      if (!billing) {
        toast.error("Please provide your shipping address", { id: tid });
        router.push("/account/address");
        return;
      }

      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: product.id, quantity: 1, unitPrice, price: unitPrice }],
          country: selectedCountry,
          billing,
          shipping: billing,
        }),
      });
      const data = await res.json();
      if (data.pendingCheckoutId) {
        toast.success("Redirecting to payment...", { id: tid });
        useLoadingStore.getState().setRedirecting(true, "Creating your order...");
        router.push(`/checkout/payment/${data.pendingCheckoutId}`);
      } else {
        throw new Error(data.error || "Failed");
      }
    } catch (err: any) {
      toast.error(err.message, { id: tid });
      addToCart(product);
      router.push("/cart");
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Hero */}
      <div className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-[1536px] mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-full px-3 py-1.5 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#0c433a]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0c433a]">Curated</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-white mb-3">
            Routine
          </h1>
          <p className="text-white/80 font-medium text-lg max-w-xl">
            Your daily skincare essentials, curated by our experts.
          </p>
        </div>
      </div>

      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 py-8">

        {/* Products grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-24 text-center">
            <div className="text-6xl mb-4 opacity-30">✨</div>
            <p className="font-black text-xl text-white/60">No routine products yet</p>
            <p className="text-sm text-white/40 mt-1">Check back soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={{
                  ...product,
                  imageUrl: product.imageUrl || product.mainImage,
                  brand: product.brandName || product.brand?.name || 'Generic',
                }}
                onQuickView={p => setQuickView(p)}
                onAddToCart={addToCart}
                onOrderNow={orderNow}
                priority={idx < 6}
              />
            ))}
          </div>
        )}
      </div>

      <ProductQuickViewModal
        product={quickView ? {
          ...quickView,
          price: quickView.price || 0,
          imageUrl: quickView.imageUrl || quickView.mainImage,
          brand: quickView.brandName || quickView.brand?.name || 'Generic',
          countryPrices: quickView.countryPrices || [],
        } : null}
        onClose={() => setQuickView(null)}
        onAddToCart={addToCart}
        onOrderNow={orderNow}
        onMoreDetails={id => { setQuickView(null); window.location.href = `/products/${id}`; }}
      />
    </div>
  );
}
