"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Landmark, Smartphone, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

// Stripe Imports
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";
import { Price } from "@/components/Price";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CustomPaymentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [method, setMethod] = useState("card");

  useEffect(() => {
    async function fetchOrderAndStripe() {
      try {
        // 1. Fetch WooCommerce Order
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setOrder(data);

        // 2. Fetch Stripe Intent (Client Secret)
        const stripeRes = await fetch("/api/checkout/stripe-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: id }),
        });
        const stripeData = await stripeRes.json();
        setClientSecret(stripeData.clientSecret);
      } catch (err: any) {
        toast.error(err.message || "Failed to load payment details");
        router.push("/cart");
      } finally {
        setLoading(false);
      }
    }
    fetchOrderAndStripe();
  }, [id, router]);

  if (loading || !order) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-black/20" />
      <p className="font-body text-xs font-bold uppercase tracking-widest text-black/40">Securely loading your order...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream text-black">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-20">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Main Payment UI */}
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight">Secure Payment</h1>
              <p className="font-body text-sm text-black/40 mt-1 uppercase font-bold tracking-widest">Order #{id}</p>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black uppercase tracking-widest text-black/30">Select Payment Method</label>
              
              <div 
                onClick={() => setMethod("card")}
                className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "card" ? "border-black shadow-lg" : "border-black/5 hover:border-black/20"}`}
              >
                <div className={`p-3 rounded-2xl ${method === "card" ? "bg-black text-white" : "bg-black/5"}`}>
                  <CreditCard size={24} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">Stripe Pay</div>
                  <div className="text-xs text-black/40 font-medium">Pay securely with Credit / Debit Card</div>
                </div>
                {method === "card" && <CheckCircle2 className="text-black" size={20} />}
              </div>

              <div 
                onClick={() => setMethod("bkash")}
                className={`flex items-center gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "bkash" ? "border-black shadow-lg" : "border-black/5 hover:border-black/20"}`}
              >
                <div className={`p-3 rounded-2xl ${method === "bkash" ? "bg-black text-white" : "bg-black/5"}`}>
                  <Smartphone size={24} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg">Mobile Banking</div>
                  <div className="text-xs text-black/40 font-medium">Offline Payment (bKash/Nagad)</div>
                </div>
                {method === "bkash" && <CheckCircle2 className="text-black" size={20} />}
              </div>
            </div>

            {/* Dynamic Payment Forms */}
            <div className="glass-panel-heavy rounded-[2.5rem] p-8 border border-black/5 bg-white shadow-lg">
              {method === "card" && clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripePaymentForm orderId={id} />
                </Elements>
              ) : method === "card" ? (
                <div className="py-10 text-center flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-black/20 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest text-black/30">Initializing Stripe...</p>
                </div>
              ) : (
                <div className="py-10 text-center space-y-6">
                  <p className="font-body text-sm text-black/60 font-medium">
                    Please send the total amount to our bKash/Nagad number <strong>+880123456789</strong> and include your order ID <strong>#{id}</strong> in the reference.
                  </p>
                  <button
                    onClick={() => router.push(`/checkout/success?order_id=${id}`)}
                    className="w-full h-16 rounded-full bg-black text-white font-bold text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02]"
                  >
                    Confirm Offline Payment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-2">
            <div className="glass-panel-heavy rounded-[2.5rem] p-8 border border-black/5 sticky top-32 shadow-2xl space-y-8">
              <h3 className="font-bold text-xl">Order Summary</h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {order.line_items.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-12 h-12 bg-black/5 rounded-xl shrink-0 border border-black/5 overflow-hidden flex items-center justify-center font-bold text-[10px] text-black/20">
                      BOX
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate leading-tight">{item.name}</div>
                      <div className="text-[10px] text-black/40 font-bold uppercase tracking-widest mt-1">Qty: {item.quantity}</div>
                    </div>
                    <div className="flex-1 text-right font-bold text-sm">
                      <Price amount={item.total} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-black/5">
                <div className="flex justify-between text-xs text-black/40 font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <Price amount={parseFloat(order.total) - parseFloat(order.total_tax)} className="text-black" />
                </div>
                <div className="flex justify-between text-xs text-black/40 font-bold uppercase tracking-widest">
                  <span>Tax</span>
                  <Price amount={order.total_tax} className="text-black" />
                </div>
                <div className="flex justify-between pt-4 border-t border-black/5">
                  <span className="font-bold text-lg">Total</span>
                  <Price amount={order.total} className="font-black text-2xl" />
                </div>
              </div>

              <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-black/30">Shipping To</div>
                <div className="text-xs font-bold leading-relaxed">
                  {order.shipping.first_name} {order.shipping.last_name}<br />
                  {order.shipping.address_1}, {order.shipping.city}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
