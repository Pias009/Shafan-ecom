import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/lib/stripe";
import { demoProducts } from "@/lib/demo-data";
import type Stripe from "stripe";

const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  couponCode: z.string().trim().min(1).max(40).optional(),
});

export async function POST(req: Request) {
  let stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 500 });
  }
  const body = await req.json().catch(() => null);
  const parsed = CheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  // Demo-only: map items from demoProducts. Next step: real cart + DB products + coupons.
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = parsed.data.items.flatMap((it) => {
    const p = demoProducts.find((x) => x.id === it.productId);
    if (!p) return [];
    const unit = p.discountPrice ?? p.price;
    return [
      {
        quantity: it.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(unit * 100),
          product_data: {
            name: `${p.brand} — ${p.name}`,
            images: [p.imageUrl],
          },
        },
      },
    ];
  });

  if (line_items.length === 0) {
    return NextResponse.json({ error: "No valid items." }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    allow_promotion_codes: true,
    success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/cart`,
    metadata: {
      couponCode: parsed.data.couponCode ?? "",
    },
  });

  return NextResponse.json({ url: session.url });
}

