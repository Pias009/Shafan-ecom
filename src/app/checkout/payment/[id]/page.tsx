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

type PaymentMethod = "card" | "digital" | "cod";

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

export default function CustomPaymentPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [codLoading, setCodLoading] = useState(false);

  const isMENA = order?.shippingAddress?.country?.toUpperCase() in {
    AE: true, SA: true, KW: true, BH: true, OM: true, QA: true
  };
  const isApplePayAvailable = typeof window !== 'undefined' && (window as any).ApplePaySession !== undefined;
  const isGooglePayAvailable = true;

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

        const totalAmount = orderData.total || 0;
        const code = (orderData.currency || "usd").toUpperCase();
        const multiplier = ["KWD", "BHD", "OMR"].includes(code) ? 1000 : 100;
        const calculatedInteger = Math.round(totalAmount * multiplier);

        const stripeRes = await fetch("/api/payments/stripe/create-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: id }),
        });

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
    <div className="min-h-screen bg-white/40 backdrop-blur-sm text-black flex flex-col">
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
                    <div className="text-[10px] md:text-xs text-black/40 font-medium">Visa, Mastercard, Link Pay</div>
                  </div>
                  {method === "card" && <CheckCircle2 className="text-black" size={18} />}
                </div>

                {/* TODO: Enable Digital Payment (Google Pay, Apple Pay) - temporarily disabled */}
                {/* {(isGooglePayAvailable || isApplePayAvailable) && ( */}
                {/*   <div  */}
                {/*     onClick={() => setMethod("digital")} */}
                {/*     className={`flex items-center gap-4 p-4 md:p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white ${method === "digital" ? "border-black shadow-lg" : "border-black/5 hover:border-black/10"}`} */}
                {/*   > */}
                {/*     <div className={`p-2.5 md:p-3 rounded-2xl ${method === "digital" ? "bg-black text-white" : "bg-black/5"}`}> */}
                {/*       <Smartphone size={20} className="md:w-6 md:h-6" /> */}
                {/*     </div> */}
                {/*     <div className="flex-1"> */}
                {/*       <div className="font-bold text-base md:text-lg">Digital Payment</div> */}
                {/*       <div className="text-[10px] md:text-xs text-black/40 font-medium">Google Pay, Apple Pay</div> */}
                {/*     </div> */}
                {/*     {method === "digital" && <CheckCircle2 className="text-black" size={18} />} */}
                {/*   </div> */}
                {/* )} */}

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
                      <Price amount={order.total} countryPrices={order.items?.map((i: any) => i.countryPrices || []).flat()} />
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

              {/* TODO: Enable Digital Payment (Google Pay, Apple Pay) - temporarily disabled */}
              {/* {method === "digital" && clientSecret && ( */}
              {/*   <div className="space-y-6"> */}
              {/*     <PaymentRequestButtonWrapper  */}
              {/*       clientSecret={clientSecret} */}
              {/*       orderId={id} */}
              {/*       amount={order.totalCents} */}
              {/*       currency={order.currency?.toLowerCase() || 'aed'} */}
              {/*     /> */}
              {/*     <p className="text-center text-[10px] text-black/40 font-bold uppercase tracking-widest"> */}
              {/*       Powered by Stripe - Secure & Encrypted */}
              {/*     </p> */}
              {/*   </div> */}
              {/* )} */}
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
