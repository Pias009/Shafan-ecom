import { getStripe } from "@/lib/stripe";

export async function createPaymentIntent(amount: number, orderId: string, customerEmail?: string, currency: string = "usd") {
  const stripe = getStripe();
  
  try {
    console.log(`STRIIPE: Creating intent for ${amount} ${currency} (Order: ${orderId})`);
    
    // Stripe expects amount in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(), // Real order currency
      receipt_email: customerEmail,
      metadata: {
        orderId: orderId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
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
