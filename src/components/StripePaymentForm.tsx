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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error("Stripe.js has not loaded yet.");
      return;
    }

    setIsProcessing(true);

    try {
      // Explicitly submit the elements first. 
      // This helps ensure all fields are validated and captured.
      const { error: submitError } = await elements.submit();
      if (submitError) {
        toast.error(submitError.message || "Please check your payment details.");
        setIsProcessing(false);
        return;
      }

      // Proceed to confirm payment
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success?order_id=${orderId}`,
        },
      });

      if (error) {
        // This point will only be reached if there is an immediate error 
        // confirming the payment. Otherwise, the customer will be redirected 
        // to your `return_url`.
        toast.error(error.message || "Payment confirmation failed");
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error("Unexpected payment error:", err);
      toast.error("An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement onReady={() => setIsReady(true)} />
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
