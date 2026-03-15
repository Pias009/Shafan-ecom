import { getStripe } from "@/lib/stripe";

export async function createPaymentIntent(amount: number, orderId: string, customerEmail?: string) {
  const stripe = getStripe();
  
  try {
    // Stripe expects amount in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd", // Adjust based on your WooCommerce currency
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
    console.error("Stripe Payment Intent Error:", error.message);
    throw new Error("Failed to create Stripe payment intent");
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
