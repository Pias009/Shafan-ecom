"use client";

import { useCartStore } from "@/lib/cart-store";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Minus, Plus, Trash2, Info } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { Price } from "@/components/Price";

function CartContent({ items, removeItem, updateQuantity, couponCode, couponDiscount, applyCoupon, removeCoupon, subtotalCents, discountCents, totalCents }: any) {
  const router = useRouter();
  const hasAddress = useCartStore(state => state.hasAddress);

  function handleCheckout() {
    if (!hasAddress) {
      toast.error("Please add your shipping address in Dashboard first!", {
        duration: 4000,
        icon: "📍",
      });
      router.push("/account/address");
      return;
    }
    
    toast.loading("Creating your order...", { id: "checkout" });
    fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        items: items.map((i: any) => ({ productId: i.id, quantity: i.quantity })),
        couponCode 
      }),
    })
    .then(r => r.json())
    .then(data => {
      if (data.orderId) {
        toast.success("Order created!", { id: "checkout" });
        router.push(`/checkout/payment/${data.orderId}`);
      } else {
        toast.error(data.error || "Checkout failed", { id: "checkout" });
      }
    })
    .catch(() => {
      toast.error("Checkout failed", { id: "checkout" });
    });
  }

  return (
    <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 font-body text-xs font-black uppercase tracking-widest text-black/30 hover:text-black transition-colors mb-8"
      >
        <ArrowLeft size={16} /> Continue Shopping
      </Link>

      <h1 className="font-display text-5xl font-black text-black mb-2 tracking-tight">Your Cart</h1>
      <p className="font-body text-xs font-bold uppercase tracking-[0.2em] text-black/30 mb-8">
        {items.reduce((acc: number, i: any) => acc + i.quantity, 0)} item(s) in your bag
      </p>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-4">
          {items.map((item: any) => {
            const price = item.discountPrice ?? item.price;
            return (
              <div
                key={item.id}
                className="glass-panel-heavy flex flex-col sm:flex-row items-center gap-6 rounded-3xl p-5 border border-black/5 shadow-sm group hover:shadow-md transition-shadow"
              >
                <div className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-2xl bg-black/[0.02] border border-black/5">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>

                <div className="flex flex-1 flex-col justify-center min-w-0 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-body text-[10px] font-black uppercase tracking-widest text-black/30">{item.brand}</div>
                      <h3 className="font-display text-xl font-bold text-black leading-tight line-clamp-1">
                        {item.name}
                      </h3>
                    </div>
                    <Price amount={price * item.quantity} className="font-body font-black text-black text-lg" />
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 glass-panel rounded-full px-4 py-2 border border-black/5">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-body text-sm font-black text-black">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 rounded-full hover:bg-black/5 text-black/40 hover:text-black transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        removeItem(item.id);
                        toast.success(`Removed ${item.name}`);
                      }}
                      className="text-black/20 hover:text-red-500 transition flex items-center gap-2 p-2 font-body text-[10px] font-black uppercase tracking-widest"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove Item</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4">
          <div className="glass-panel-heavy sticky top-28 rounded-3xl p-8 border border-black/5 shadow-2xl">
            <h3 className="font-black text-2xl text-black mb-8">Summary</h3>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between font-body text-sm text-black/40 font-bold uppercase tracking-wider">
                <div>Subtotal</div>
                <Price amount={subtotalCents / 100} className="text-black font-black" />
              </div>

              {couponCode && (
                <div className="flex items-center justify-between font-body text-sm text-green-600 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    Promo ({couponCode})
                    <button onClick={removeCoupon} className="text-[10px] underline">(remove)</button>
                  </div>
                  <div className="font-black">- <Price amount={discountCents / 100} /></div>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-black/5">
                <div className="font-black text-sm uppercase tracking-widest">Total</div>
                <Price amount={totalCents / 100} className="text-3xl font-black text-black" />
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="mt-10 w-full rounded-full bg-black text-white py-4 font-body text-xs font-black tracking-[0.2em] transition hover:scale-[1.02] shadow-xl shadow-black/20 active:scale-95"
            >
              COMPLETE PURCHASE
            </button>
            
            {!hasAddress && (
              <p className="mt-4 text-[10px] text-red-500/80 font-bold uppercase text-center flex items-center justify-center gap-1.5 px-4 leading-tight">
                <Info className="w-3 h-3 shrink-0" />
                Shipping address required in Dashboard
              </p>
            )}
            
            <div className="mt-10 flex items-center justify-center gap-3 opacity-20 filter grayscale">
              <Image src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" width={40} height={20} />
              <div className="w-px h-3 bg-black" />
              <div className="text-[8px] font-black uppercase tracking-widest">Secure Checkout</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    couponCode,
    couponDiscount,
    removeCoupon,
  } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const subtotalCents = items.reduce(
    (acc, item) => acc + (item.discountPrice ?? item.price) * 100 * item.quantity,
    0
  );
  const discountCents = Math.round(subtotalCents * couponDiscount);
  const totalCents = subtotalCents - discountCents;

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto text-center">
          <div className="glass-panel mx-auto flex max-w-md flex-col items-center justify-center rounded-3xl p-10 border border-black/5 shadow-xl">
            <div className="mb-4 text-6xl">🛒</div>
            <h1 className="font-display text-3xl text-black font-black">Your Cart</h1>
            <p className="font-body mt-3 text-black/40 font-bold uppercase tracking-widest text-xs">Looks like you haven&apos;t added anything yet.</p>
            <Link
              href="/"
              className="mt-8 inline-block bg-black text-white rounded-full px-8 py-3 font-body text-sm font-bold tracking-widest transition hover:scale-105 shadow-lg shadow-black/20"
            >
              SHOP NOW
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CartContent 
        items={items}
        removeItem={removeItem}
        updateQuantity={updateQuantity}
        couponCode={couponCode}
        couponDiscount={couponDiscount}
        removeCoupon={removeCoupon}
        subtotalCents={subtotalCents}
        discountCents={discountCents}
        totalCents={totalCents}
        applyCoupon={() => {}}
      />
      <Footer />
    </>
  );
}
