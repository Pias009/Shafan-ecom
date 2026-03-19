import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe not configured: missing STRIPE_SECRET_KEY");

  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key, { apiVersion: "2025-01-27.acacia" as any });
  }

  return stripeSingleton;
}

