import { getStripe } from "@/lib/stripe";

export async function createPaymentIntent(amount: number, orderId: string, customerEmail?: string, currency: string = "usd") {
  const stripe = getStripe();
  
  try {
    console.log(`STRIIPE: Creating intent for ${amount} ${currency} (Order: ${orderId})`);
    
    // Stripe expects amount in the smallest currency unit (cents, fils, etc.)
    // We convert our database "whole units" (e.g. 665 for 665 AED) to Stripe subunits.
    const code = currency.toUpperCase();
    const divisor = ["KWD", "BHD", "OMR"].includes(code) ? 1000 : 100;
    
    // For 3-decimal currencies (KWD, BHD, OMR), Stripe REQUIRES the amount to be divisible by 10
    // (the last decimal place must be zero).
    let finalAmount = Math.round(amount * divisor);
    if (divisor === 1000) {
      finalAmount = Math.round(finalAmount / 10) * 10;
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: currency.toLowerCase(),
      receipt_email: customerEmail,
      metadata: {
        orderId: orderId,
      },
      payment_method_types: ['card'],
    });

    return paymentIntent;
  } catch (error: any) {
    console.error("STRIPE SDK ERROR:", {
      message: error.message,
      type: error.type,
      code: error.code
    });
    throw new Error(`Stripe: ${error.message}`);
  }

}

export async function verifyStripeWebhook(body: string, signature: string) {
  const stripe = getStripe();
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    return event;
  } catch (error: any) {
    console.error("Stripe Webhook Verification Error:", error.message);
    throw new Error(`Webhook Error: ${error.message}`);
  }
}
