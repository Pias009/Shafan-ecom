import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const pendingCheckout = await (prisma as any).pendingCheckout.findUnique({
      where: { id: orderId },
    });

    if (!pendingCheckout) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const totalAmount = pendingCheckout.total || 0;
    if (totalAmount <= 0) {
      return NextResponse.json({ error: "Order total must be greater than 0" }, { status: 400 });
    }

    const stripe = getStripe();
    const currency = pendingCheckout.currency?.toLowerCase() || "aed";
    const code = pendingCheckout.currency?.toUpperCase() || "AED";
    const isThreeDecimal = ["KWD", "BHD", "OMR"].includes(code);
    const multiplier = isThreeDecimal ? 1000 : 100;
    let amount = Math.round(totalAmount * multiplier);
    if (isThreeDecimal) {
      amount = Math.round(amount / 10) * 10;
    }

    const baseUrl = process.env.NEXTAUTH_URL || `http://localhost:3000`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: "Order Total" },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: { pendingCheckoutId: pendingCheckout.id },
      success_url: `${baseUrl}/checkout/success?pcid=${pendingCheckout.id}`,
      cancel_url: `${baseUrl}/cart?canceled=stripe`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Session failed:", error);
    return NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 });
  }
}
