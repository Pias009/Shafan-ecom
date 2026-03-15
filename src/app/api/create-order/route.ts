import { NextResponse } from "next/server";
import { createWooCommerceOrder } from "@/services/woocommerce/order-service";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();
    // Allow guest checkout if session is not available, but user wants orders created
    
    const body = await req.json();
    const { items, billing, shipping, payment_method, payment_method_title } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // If session exists, we might want to fetch user address from DB if not provided in body
    let finalBilling = billing;
    let finalShipping = shipping;

    if (session?.user?.id && (!billing || !shipping)) {
      const address = await prisma.address.findUnique({
        where: { userId: session.user.id },
      });

      if (address) {
        const addressData = {
          first_name: address.fullName?.split(" ")[0] || "",
          last_name: address.fullName?.split(" ").slice(1).join(" ") || "",
          address_1: address.address1 || "",
          address_2: address.address2 || "",
          city: address.city || "",
          postcode: address.postalCode || "",
          country: address.country || "BD",
          email: session.user.email || "",
          phone: address.phone || "",
        };
        finalBilling = finalBilling || addressData;
        finalShipping = finalShipping || addressData;
      }
    }

    const orderData = {
      payment_method: payment_method || "stripe",
      payment_method_title: payment_method_title || "Credit Card (Stripe)",
      set_paid: false,
      billing: finalBilling,
      shipping: finalShipping,
      line_items: items.map((item: any) => ({
        product_id: parseInt(item.productId),
        quantity: item.quantity,
      })),
      customer_id: session?.user?.id ? 0 : 0, // In a real app, map to WC customer ID
    };

    const order = await createWooCommerceOrder(orderData);

    return NextResponse.json({ 
      orderId: order.id,
      total: order.total,
      currency: order.currency,
      status: order.status
    });
  } catch (error: any) {
    console.error("Create Order Route Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
