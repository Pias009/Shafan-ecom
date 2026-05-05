"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, Banknote, Wallet } from "lucide-react";
import toast from "react-hot-toast";

import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js";
import dynamic from "next/dynamic";
import { Price } from "@/components/Price";

const StripePaymentForm = dynamic(() => import("@/components/StripePaymentForm"), {
  ssr: false,
  loading: () => (
    <div className="py-12 text-center flex flex-col items-center">
      <Loader2 className="w-8 h-8 animate-spin text-black/20 mb-3" />
      <p className="text-[10px] font-bold uppercase tracking-widest text-black/30">Loading Secure Form...</p>
    </div>
  ),
});

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

type PaymentMethod = "card" | "digital" | "cod" | "tabby" | "tamara";

function PaymentRequestButtonWrapper({ 
  clientSecret, 
  orderId, 
  amount, 
  currency 
}: { 
  clientSecret?: string | null; 
  orderId: string; 
  amount: number; 
  currency?: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  const [canMakePayment, setCanMakePayment] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!stripe || isReady) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: currency || 'usd',
      total: {
        label: 'SHANFA Order',
        amount: amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: false,
    });

    setPaymentRequest(pr);

    pr.canMakePayment().then((result: any) => {
      setCanMakePayment(result ? (result.applePay || result.googlePay) : false);
      setIsReady(true);
    });

    const handler = (e: any) => {
      if (!clientSecret) {
        e.complete('fail');
        return;
      }

      stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
        },
      }).then(({ error }: any) => {
        if (error) {
          e.complete('fail');
          toast.error(error.message || "Payment failed");
        } else {
          e.complete('success');
        }
      }).catch(() => {
        e.complete('fail');
        toast.error("Payment failed");
      });
    };

    (pr.on as any)('paymentmethod', handler);
  }, [stripe, clientSecret, orderId, amount, currency, isReady]);

  if (!stripe || !elements) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-black/40" />
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-6 h-6 animate-spin text-black/40" />
      </div>
    );
  }

  if (!canMakePayment) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 text-center">
        <p>Apple Pay / Google Pay not available in this browser.</p>
      </div>
    );
  }

  return (
    <PaymentRequestButtonElement
      options={{
        paymentRequest,
        style: {
          paymentRequestButton: {
            type: 'default',
            theme: 'dark',
            height: '56px',
          },
        },
      }}
    />
  );
}

function PaymentPageContent() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const initialMethod = (searchParams?.get("method") as PaymentMethod) || "card";
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>(initialMethod);
  const [codLoading, setCodLoading] = useState(false);
  const [tabbyLoading, setTabbyLoading] = useState(false);
  const [tamaraLoading, setTamaraLoading] = useState(false);

  useEffect(() => {
    async function fetchOrderAndStripe() {
      try {
        const orderRes = await fetch(`/api/orders/${id}`);
        const orderData = await orderRes.json();
        if (orderData.error) throw new Error(orderData.error);
        setOrder(orderData);

        if (orderData.paymentMethod === "cod") {
          router.push(`/checkout/success?orderId=${id}&cod=true`);
          return;
        }

        try {
          const stripeRes = await fetch("/api/payments/stripe/create-intent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: id }),
          });

          const stripeData = await stripeRes.json();
          if (stripeData.clientSecret) {
            setClientSecret(stripeData.clientSecret);
          }
        } catch (stripeErr) {
          console.error("Stripe initialization failed:", stripeErr);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    }
    fetchOrderAndStripe();
  }, [id, router]);

  const handleCODPayment = async () => {
    setCodLoading(true);
    try {
      const res = await fetch("/api/payments/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Order placed successfully!");
      router.push(`/checkout/success?orderId=${id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to place COD order");
      setCodLoading(false);
    }
  };

  const handleTabbyPayment = async () => {
    setTabbyLoading(true);
    const tid = toast.loading("Connecting to Tabby...");
    try {
      const res = await fetch("/api/payments/tabby/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("Invalid response from server. Please try again.");
      }

      if (!res.ok || data.error) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }

      if (data.checkoutUrl) {
        toast.success("Redirecting to Tabby...", { id: tid });
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received from Tabby.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize Tabby payment", { id: tid });
      setTabbyLoading(false);
    }
  };

  const handleTamaraPayment = async () => {
    setTamaraLoading(true);
    const tid = toast.loading("Connecting to Tamara...");
    try {
      // CACHE-BUSTER: Added timestamp to force Vercel to use fresh code
      const res = await fetch(`/api/payments/tamara/create-session?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned invalid response (${res.status}). Please check Vercel logs.`);
      }

      if (!res.ok) {
        const errorMessage = data.error || `Server error: ${res.status}`;
        throw new Error(errorMessage);
      }

      if (data.checkoutUrl) {
        toast.success("Redirecting to Tamara...", { id: tid });
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No checkout URL received from Tamara.");
      }
    } catch (err: any) {
      console.error("Tamara Payment Error:", err);
      toast.error(err.message || "Failed to initialize Tamara payment", { 
        id: tid,
        duration: 5000 // Show for longer so user can read it
      });
      setTamaraLoading(false);
    }
  };

  if (loading || !order) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 p-6 text-center">
      <Loader2 className="w-10 h-10 animate-spin text-black/20" />
      <p className="font-body text-[10px] md:text-xs font-bold uppercase tracking-widest text-black/40">Securely loading your order...</p>
    </div>
  );

  const shipping = order?.shippingAddress || {};
  const country = (order?.shippingAddress as any)?.country?.toUpperCase() || "";

  return (
    <div className="min-h-screen bg-white/40 backdrop-blur-sm text-black flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-20">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-12 xl:col-span-8 space-y-6 md:space-y-8 order-1 w-full overflow-x-hidden">
            <div className="text-center xl:text-left">
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-black">Secure Payment</h1>
              <p className="font-body text-[10px] md:text-sm text-black/40 mt-1 uppercase font-bold tracking-widest">Order ID: {id.substring(0, 8)}</p>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/30 px-2">Express Checkout</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleTabbyPayment}
                  disabled={tabbyLoading}
                  className="group relative flex items-center justify-between p-1 rounded-3xl bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#3ECF8E]/20 overflow-hidden h-14 md:h-16"
                >
                  <div className="flex items-center gap-3 ml-5">
                    <img src="https://cdn.tabby.ai/assets/logo.svg" alt="Tabby" className="h-6" />
                  </div>
                  <div className="mr-5 bg-black/10 px-3 py-1.5 rounded-full text-[10px] font-black text-black uppercase tracking-widest">
                    {tabbyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pay in 4"}
                  </div>
                </button>

                <button
                  onClick={handleTamaraPayment}
                  disabled={tamaraLoading}
                  className="group relative flex items-center justify-between p-1 rounded-3xl bg-[#FF4D4D] hover:bg-[#FF4D4D]/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#FF4D4D]/20 overflow-hidden h-14 md:h-16"
                >
                  <div className="flex items-center gap-3 ml-5">
                    <img src="https://cdn.tamara.co/assets/svg/tamara-logo-badge-en.svg" alt="Tamara" className="h-8" />
                  </div>
                  <div className="mr-5 bg-white/20 px-3 py-1.5 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                    {tamaraLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Installments"}
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-black/30 px-2">Other Payment Methods</label>
              
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
                    <div className="text-[10px] md:text-xs text-black/40 font-medium">Visa, Mastercard, Link Pay</div>
                  </div>
                  {method === "card" && <CheckCircle2 className="text-black" size={18} />}
                </div>

                <div 
                  onClick={() => setMethod("cod")}
                  className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "cod" ? "border-black shadow-lg" : "border-black/5 hover:border-black/10"}`}
                >
                  <div className={`p-2.5 md:p-3 rounded-2xl ${method === "cod" ? "bg-black text-white" : "bg-black/5"}`}>
                    <Banknote size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base md:text-lg">Cash on Delivery</div>
                    <div className="text-[10px] md:text-xs text-black/40 font-medium">Pay when you receive</div>
                  </div>
                  {method === "cod" && <CheckCircle2 className="text-black" size={18} />}
                </div>

                <div 
                  onClick={() => setMethod("tabby")}
                  className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "tabby" ? "border-[#3ECF8E] shadow-lg" : "border-black/5 hover:border-black/10"}`}
                >
                  <div className={`p-2.5 md:p-3 rounded-2xl flex items-center justify-center ${method === "tabby" ? "bg-[#3ECF8E] text-black" : "bg-black/5"}`}>
                    <img src="https://cdn.tabby.ai/assets/logo.svg" alt="Tabby" className="w-8 md:w-10" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base md:text-lg">Tabby</div>
                    <div className="text-[10px] md:text-xs text-black/40 font-medium">Split into 4 interest-free payments</div>
                  </div>
                  {method === "tabby" && <CheckCircle2 className="text-[#3ECF8E]" size={18} />}
                </div>

                <div 
                  onClick={() => setMethod("tamara")}
                  className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "tamara" ? "border-[#FF4D4D] shadow-lg" : "border-black/5 hover:border-black/10"}`}
                >
                  <div className={`p-2.5 md:p-3 rounded-2xl flex items-center justify-center ${method === "tamara" ? "bg-[#FF4D4D] text-white" : "bg-black/5"}`}>
                    <img src="https://cdn.tamara.co/assets/svg/tamara-logo-badge-en.svg" alt="Tamara" className="w-8 md:w-10" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-base md:text-lg">Tamara</div>
                    <div className="text-[10px] md:text-xs text-black/40 font-medium">Split your payments with Tamara</div>
                  </div>
                  {method === "tamara" && <CheckCircle2 className="text-[#FF4D4D]" size={18} />}
                </div>
              </div>
            </div>

            <div className="glass-panel-heavy rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-black/5 bg-white shadow-xl">
              {method === "card" && clientSecret && stripePromise && (
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
                  <StripePaymentForm orderId={id} order={order} />
                </Elements>
              )}

              {method === "card" && !stripePromise && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs md:text-sm font-bold border border-red-200 text-center">
                  Stripe configuration is missing.
                </div>
              )}

              {method === "cod" && (
                <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                      <Banknote className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-lg">Pay Upon Delivery</p>
                    <p className="font-body text-sm text-black/60 font-medium leading-relaxed">
                      Pay with cash or card when your order arrives.
                    </p>
                  </div>
                  <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-black/30">Order Total</div>
                    <div className="font-black text-2xl">
                      <Price amount={order.total} />
                    </div>
                  </div>
                  <button
                    onClick={handleCODPayment}
                    disabled={codLoading}
                    className="w-full h-14 md:h-16 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-black/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {codLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Cash on Delivery"}
                  </button>
                </div>
              )}

              {method === "tabby" && (
                <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#3ECF8E]/10 flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-[#3ECF8E]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-lg">Pay in 4 with Tabby</p>
                    <p className="font-body text-sm text-black/60 font-medium leading-relaxed">
                      No interest. No fees. No catch.
                    </p>
                  </div>
                  <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-black/30">Total Amount</div>
                    <div className="font-black text-2xl">
                      <Price amount={order.total} />
                    </div>
                  </div>
                  <button
                    onClick={handleTabbyPayment}
                    disabled={tabbyLoading}
                    className="w-full h-14 md:h-16 rounded-full bg-[#3ECF8E] hover:bg-[#3ECF8E]/90 text-black font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-[#3ECF8E]/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {tabbyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Tabby Payment"}
                  </button>
                </div>
              )}

              {method === "tamara" && (
                <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#FF4D4D]/10 flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-[#FF4D4D]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-lg">Pay with Tamara</p>
                    <p className="font-body text-sm text-black/60 font-medium leading-relaxed">
                      Split your payments into flexible installments.
                    </p>
                  </div>
                  <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-black/30">Total Amount</div>
                    <div className="font-black text-2xl">
                      <Price amount={order.total} />
                    </div>
                  </div>
                  <button
                    onClick={handleTamaraPayment}
                    disabled={tamaraLoading}
                    className="w-full h-14 md:h-16 rounded-full bg-[#FF4D4D] hover:bg-[#FF4D4D]/90 text-white font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-[#FF4D4D]/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {tamaraLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Tamara Payment"}
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
                      <Price amount={Number(item.unitPrice) * item.quantity} currency={order.currency} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-black/5">
                <div className="flex justify-between text-[10px] text-black/40 font-bold uppercase tracking-widest">
                  <span>Subtotal</span>
                  <Price amount={order.subtotal} className="text-black" />
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between text-[10px] text-orange-600 font-bold uppercase tracking-widest">
                    <span>VAT ({(order.taxRate * 100).toFixed(0)}%)</span>
                    <Price amount={order.taxAmount} />
                  </div>
                )}
                <div className="flex justify-between pt-4 border-t border-black/5">
                  <span className="font-bold text-base md:text-lg">Total</span>
                  <Price amount={order.total} className="font-black text-xl md:text-2xl" />
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
    </div>
  );
}

export default function CustomPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 p-6 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-black/20" />
          <p className="font-body text-[10px] md:text-xs font-bold uppercase tracking-widest text-black/40">
            Loading...
          </p>
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  );
}
