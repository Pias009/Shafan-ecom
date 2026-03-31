"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Loader2, Banknote } from "lucide-react";
import toast from "react-hot-toast";

import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentRequestButtonElement, useStripe, useElements } from "@stripe/react-stripe-js";
import StripePaymentForm from "@/components/StripePaymentForm";
import { Price } from "@/components/Price";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type PaymentMethod = "card" | "cod" | "tabby" | "tamara" | "apple-pay" | "google-pay";

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
        label: 'Shafan Order',
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

export default function CustomPaymentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [tabbyLoading, setTabbyLoading] = useState(false);
  const [tamaraLoading, setTamaraLoading] = useState(false);
  const [codLoading, setCodLoading] = useState(false);

  const isMENA = order?.shippingAddress?.country?.toUpperCase() in {
    AE: true, SA: true, KW: true, BH: true, OM: true, QA: true
  };
  const isApplePayAvailable = typeof window !== 'undefined' && (window as any).ApplePaySession !== undefined;
  const isGooglePayAvailable = true;

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

  if (loading || !order) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 p-6 text-center">
      <Loader2 className="w-10 h-10 animate-spin text-black/20" />
      <p className="font-body text-[10px] md:text-xs font-bold uppercase tracking-widest text-black/40">Securely loading your order...</p>
    </div>
  );

  const shipping = order.shippingAddress || {};

  return (
    <div className="min-h-screen bg-cream text-black flex flex-col">
      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-20">
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

                {(isMENA || isApplePayAvailable) && (
                  <div 
                    onClick={() => setMethod("apple-pay")}
                    className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "apple-pay" ? "border-black shadow-lg" : "border-black/5 hover:border-black/10"}`}
                  >
                    <div className={`p-2.5 md:p-3 rounded-2xl ${method === "apple-pay" ? "bg-black text-white" : "bg-black/5"}`}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base md:text-lg">Apple Pay</div>
                      <div className="text-[10px] md:text-xs text-black/40 font-medium">Quick & secure</div>
                    </div>
                    {method === "apple-pay" && <CheckCircle2 className="text-black" size={18} />}
                  </div>
                )}

                {isGooglePayAvailable && (
                  <div 
                    onClick={() => setMethod("google-pay")}
                    className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "google-pay" ? "border-black shadow-lg" : "border-black/5 hover:border-black/10"}`}
                  >
                    <div className={`p-2.5 md:p-3 rounded-2xl ${method === "google-pay" ? "bg-black text-white" : "bg-black/5"}`}>
                      <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-base md:text-lg">Google Pay</div>
                      <div className="text-[10px] md:text-xs text-black/40 font-medium">Fast checkout</div>
                    </div>
                    {method === "google-pay" && <CheckCircle2 className="text-black" size={18} />}
                  </div>
                )}

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

              {method === "apple-pay" && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: clientSecret || undefined,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#000000',
                      }
                    }
                  }}
                >
                  <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                    <div className="space-y-2">
                      <p className="font-bold text-lg">Pay with Apple Pay</p>
                      <p className="font-body text-sm text-black/60 font-medium leading-relaxed">
                        Quick and secure payment with Apple Pay.
                      </p>
                    </div>
                    <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-black/30">Order Total</div>
                      <div className="font-black text-2xl">
                        <Price amount={order.totalCents / 100} currency={order.currency} isCents={true} />
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                      <p>To enable Apple Pay, verify your domain at stripe.com and add it to your Apple Developer account.</p>
                    </div>
                    <div className="flex justify-center">
                      <PaymentRequestButtonWrapper 
                        clientSecret={clientSecret}
                        orderId={id}
                        amount={order.totalCents}
                        currency={order.currency}
                      />
                    </div>
                  </div>
                </Elements>
              )}

              {method === "google-pay" && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: clientSecret || undefined,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#000000',
                      }
                    }
                  }}
                >
                  <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                    <div className="space-y-2">
                      <p className="font-bold text-lg">Pay with Google Pay</p>
                      <p className="font-body text-sm text-black/60 font-medium leading-relaxed">
                        Fast and secure payment with Google Pay.
                      </p>
                    </div>
                    <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-black/30">Order Total</div>
                      <div className="font-black text-2xl">
                        <Price amount={order.totalCents / 100} currency={order.currency} isCents={true} />
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                      <p>To enable Google Pay, verify your domain with Stripe.</p>
                    </div>
                    <div className="flex justify-center">
                      <PaymentRequestButtonWrapper 
                        clientSecret={clientSecret}
                        orderId={id}
                        amount={order.totalCents}
                        currency={order.currency}
                      />
                    </div>
                  </div>
                </Elements>
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
                      Pay with cash or card when your order arrives. Our delivery partner will collect the payment.
                    </p>
                  </div>
                  <div className="bg-black/5 rounded-2xl p-4 space-y-2">
                    <div className="text-[10px] font-black uppercase tracking-wider text-black/30">Order Total</div>
                    <div className="font-black text-2xl">
                      <Price amount={order.totalCents} currency={order.currency} isCents={true} />
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                    <p className="font-bold mb-1">Note:</p>
                    <p>AED 10 Cash on Delivery fee may apply.</p>
                  </div>
                  <button
                    onClick={handleCODPayment}
                    disabled={codLoading}
                    className="w-full h-14 md:h-16 rounded-full bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] md:text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-xl shadow-black/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {codLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Cash on Delivery"
                    )}
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
    </div>
  );
}
