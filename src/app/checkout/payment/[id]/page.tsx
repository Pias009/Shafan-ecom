"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Smartphone, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";
import { Price } from "@/components/Price";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PaymentMethod = "card" | "bkash" | "tabby" | "tamara";

interface TabbyProduct {
  type: string;
  minAmount?: number;
  maxAmount?: number;
}

export default function CustomPaymentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [tabbyProducts, setTabbyProducts] = useState<TabbyProduct[]>([]);
  const [tabbyLoading, setTabbyLoading] = useState(false);
  const [tamaraLoading, setTamaraLoading] = useState(false);

  const isMENA = order?.shippingAddress?.country?.toUpperCase() in {
    AE: true, SA: true, KW: true
  };

  useEffect(() => {
    async function fetchOrderAndStripe() {
      try {
        const [orderRes, stripeRes] = await Promise.all([
          fetch(`/api/orders/${id}`),
          fetch("/api/payments/stripe/create-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: id }),
          })
        ]);

        const orderData = await orderRes.json();
        if (orderData.error) throw new Error(orderData.error);
        setOrder(orderData);

        const stripeData = await stripeRes.json();
        if (stripeData.error) throw new Error(stripeData.error);
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

  const handleTabbyPayment = async () => {
    setTabbyLoading(true);
    try {
      const res = await fetch("/api/payments/tabby/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.webUrl) {
        window.location.href = data.webUrl;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize Tabby payment");
      setTabbyLoading(false);
    }
  };

  const handleTamaraPayment = async () => {
    setTamaraLoading(true);
    try {
      const res = await fetch("/api/payments/tamara/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize Tamara payment");
      setTamaraLoading(false);
    }
  };

  if (loading || !order) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 p-6 text-center">
      <Loader2 className="w-10 h-10 animate-spin text-black/20" />
      <p className="font-body text-[10px] md:text-xs font-bold uppercase tracking-widest text-black/40">Securely loading your order...</p>
    </div>
  );

  const billing = order.billingAddress || {};
  const shipping = order.shippingAddress || {};
  const currency = order.currency?.toUpperCase() || "USD";

  return (
    <div className="min-h-screen bg-cream text-black">
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-20">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-12 xl:col-span-8 space-y-6 md:space-y-8 order-1 w-full overflow-x-hidden">
            <div className="text-center xl:text-left">
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-black">Secure Payment</h1>
              <p className="font-body text-[10px] md:text-sm text-black/40 mt-1 uppercase font-bold tracking-widest">Order ID: {id.substring(0, 8)}</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/30 px-2">Select Payment Method</label>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setMethod("card")}
                  className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "card" ? "border-black shadow-lg" : "border-black/5 hover:border-black/10"}`}
                >
                  <div className={`p-2.5 md:p-3 rounded-2xl ${method === "card" ? "bg-black text-white" : "bg-black/5"}`}>
                    <CreditCard size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base md:text-lg">Credit Card</div>
                    <div className="text-[10px] md:text-xs text-black/40 font-medium">Visa, Mastercard</div>
                  </div>
                  {method === "card" && <CheckCircle2 className="text-black" size={18} />}
                </div>

                {isMENA && (
                  <>
                    <div 
                      onClick={() => setMethod("tabby")}
                      className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "tabby" ? "border-black shadow-lg" : "border-black/5 hover:border-black/10"}`}
                    >
                      <div className={`p-2.5 md:p-3 rounded-2xl ${method === "tabby" ? "bg-black text-white" : "bg-black/5"}`}>
                        <span className="text-sm font-black">T</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-base md:text-lg">Tabby</div>
                        <div className="text-[10px] md:text-xs text-black/40 font-medium">Pay in 4 installments</div>
                      </div>
                      {method === "tabby" && <CheckCircle2 className="text-black" size={18} />}
                    </div>

                    <div 
                      onClick={() => setMethod("tamara")}
                      className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "tamara" ? "border-black shadow-lg" : "border-black/5 hover:border-black/10"}`}
                    >
                      <div className={`p-2.5 md:p-3 rounded-2xl ${method === "tamara" ? "bg-black text-white" : "bg-black/5"}`}>
                        <span className="text-sm font-black">TM</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-base md:text-lg">Tamara</div>
                        <div className="text-[10px] md:text-xs text-black/40 font-medium">Pay later in installments</div>
                      </div>
                      {method === "tamara" && <CheckCircle2 className="text-black" size={18} />}
                    </div>
                  </>
                )}

                <div 
                  onClick={() => setMethod("bkash")}
                  className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "bkash" ? "border-black shadow-lg" : "border-black/5 hover:border-black/10"}`}
                >
                  <div className={`p-2.5 md:p-3 rounded-2xl ${method === "bkash" ? "bg-black text-white" : "bg-black/5"}`}>
                    <Smartphone size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base md:text-lg">Mobile Banking</div>
                    <div className="text-[10px] md:text-xs text-black/40 font-medium">bKash / Nagad</div>
                  </div>
                  {method === "bkash" && <CheckCircle2 className="text-black" size={18} />}
                </div>
              </div>
            </div>

            <div className="glass-panel-heavy rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-black/5 bg-white shadow-xl">
              {method === "card" && clientSecret && (
                <Elements 
                  key={clientSecret} 
                  stripe={stripePromise} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#000000',
                      }
                    }
                  }}
                >
                  <StripePaymentForm orderId={id} />
                </Elements>
              )}

              {method === "card" && !clientSecret && (
                <div className="py-12 text-center flex flex-col items-center">
                  <Loader2 className="w-8 h-8 animate-spin text-black/20 mb-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 text-center">Initializing Stripe Elements...</p>
                </div>
              )}

              {method === "tabby" && (
                <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                  <div className="space-y-2">
                    <p className="font-bold text-lg">Pay with Tabby</p>
                    <p className="font-body text-sm text-black/60 font-medium leading-relaxed">
                      Split your payment into 4 interest-free installments. No hidden fees.
                    </p>
                  </div>
                  <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-black/30">Order Total</div>
                    <div className="font-black text-2xl">
                      <Price amount={order.totalCents / 100} />
                    </div>
                  </div>
                  <button
                    onClick={handleTabbyPayment}
                    disabled={tabbyLoading}
                    className="w-full h-14 md:h-16 rounded-full bg-[#10b982] hover:bg-[#059669] text-white font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-black/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {tabbyLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Redirecting to Tabby...
                      </>
                    ) : (
                      "Continue with Tabby"
                    )}
                  </button>
                </div>
              )}

              {method === "tamara" && (
                <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                  <div className="space-y-2">
                    <p className="font-bold text-lg">Pay with Tamara</p>
                    <p className="font-body text-sm text-black/60 font-medium leading-relaxed">
                      Buy now, pay later with 0% interest. Easy monthly payments.
                    </p>
                  </div>
                  <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-black/30">Order Total</div>
                    <div className="font-black text-2xl">
                      <Price amount={order.totalCents / 100} />
                    </div>
                  </div>
                  <button
                    onClick={handleTamaraPayment}
                    disabled={tamaraLoading}
                    className="w-full h-14 md:h-16 rounded-full bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-black/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {tamaraLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Redirecting to Tamara...
                      </>
                    ) : (
                      "Continue with Tamara"
                    )}
                  </button>
                </div>
              )}

              {method === "bkash" && (
                <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                  <p className="font-body text-sm text-black/60 font-medium leading-relaxed">
                    Please send the total amount to our bKash/Nagad number <strong className="text-black font-black">+880123456789</strong> and include your order ID <strong className="text-black font-black">#{id.substring(0,8)}</strong> in the reference.
                  </p>
                  <button
                    onClick={() => router.push(`/checkout/success?order_id=${id}`)}
                    className="w-full h-14 md:h-16 rounded-full bg-black text-white font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-black/20"
                  >
                    Confirm Offline Payment
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-12 xl:col-span-4 order-2 xl:order-2 w-full md:w-auto overflow-x-hidden">
            <div className="glass-panel-heavy rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-black/5 md:sticky top-24 xl:top-32 shadow-2xl space-y-6 md:space-y-8 bg-white/50 backdrop-blur-sm">
              <h3 className="font-bold text-lg md:text-xl">Order Summary</h3>
              
              <div className="space-y-4 max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-black/5 rounded-xl shrink-0 border border-black/5 overflow-hidden flex items-center justify-center font-bold text-[10px] text-black/20 uppercase tracking-tighter">
                      {item.nameSnapshot.substring(0, 3)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs md:text-sm truncate leading-tight">{item.nameSnapshot}</div>
                      <div className="text-[9px] md:text-[10px] text-black/40 font-bold uppercase tracking-widest mt-1">Quantity: {item.quantity}</div>
                    </div>
                    <div className="text-right font-black text-xs md:text-sm">
                      <Price amount={item.unitPriceCents * item.quantity} currency={order.currency} isCents={true} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-black/5">
                <div className="flex justify-between text-[10px] text-black/40 font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <Price amount={order.subtotalCents} currency={order.currency} isCents={true} className="text-black" />
                </div>
                <div className="flex justify-between pt-4 border-t border-black/5">
                  <span className="font-bold text-base md:text-lg">Total</span>
                  <Price amount={order.totalCents} currency={order.currency} isCents={true} className="font-black text-xl md:text-2xl" />
                </div>
              </div>

              <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                <div className="text-[9px] font-black uppercase tracking-wider text-black/30">Shipping To</div>
                <div className="text-[10px] md:text-xs font-bold leading-relaxed">
                  {shipping.first_name} {shipping.last_name}<br />
                  <span className="text-black/60 font-medium">{shipping.address_1}, {shipping.city}</span>
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
