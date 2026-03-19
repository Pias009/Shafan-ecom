"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function StripePaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe.js has not loaded yet.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || "Please check your payment details.");
        setIsProcessing(false);
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Payment confirmation failed");
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("Unexpected payment error:", err);
      setErrorMessage("An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-[10px] font-bold uppercase tracking-widest text-center">
          {errorMessage}
        </div>
      )}

      <PaymentElement 
        onReady={() => setIsReady(true)} 
        onLoadError={(event) => {
          console.error("Stripe Load Error:", event.error);
          setErrorMessage(event.error.message || "Failed to load payment form from Stripe.");
        }}
      />
      
      <button
        disabled={isProcessing || !stripe || !elements || !isReady}
        className="w-full h-16 rounded-full bg-black text-white font-bold text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] shadow-2xl shadow-black/20 disabled:opacity-50 flex items-center justify-center gap-3"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          "Pay Now"
        )}
      </button>
    </form>
  );
}
