import { NextResponse } from "next/server";
import { wooApi } from "@/lib/woocommerce";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { items, couponCode } = await req.json();

    // Fetch user address from Prisma (since we still use NextAuth for users)
    const address = await prisma.address.findUnique({
      where: { userId: session.user.id },
    });

    if (!address) {
      return NextResponse.json({ error: "Shipping address required" }, { status: 400 });
    }

    // Create Order in WooCommerce
    const orderData = {
      payment_method: "online", // Placeholder, WC will handle the active gateway
      payment_method_title: "Online Payment",
      set_paid: false,
      status: "pending",
      billing: {
        first_name: address.fullName?.split(" ")[0] || "",
        last_name: address.fullName?.split(" ").slice(1).join(" ") || "",
        address_1: address.address1 || "",
        address_2: address.address2 || "",
        city: address.city || "",
        postcode: address.postalCode || "",
        country: address.country || "BD",
        email: session.user.email,
        phone: address.phone || "",
      },
      shipping: {
        first_name: address.fullName?.split(" ")[0] || "",
        last_name: address.fullName?.split(" ").slice(1).join(" ") || "",
        address_1: address.address1 || "",
        address_2: address.address2 || "",
        city: address.city || "",
        postcode: address.postalCode || "",
        country: address.country || "BD",
      },
      line_items: items.map((item: any) => ({
        product_id: parseInt(item.productId),
        quantity: item.quantity,
      })),
      coupon_lines: couponCode ? [{ code: couponCode }] : [],
      customer_id: 0, // Guest or map to WooCommerce customer ID if we have it
    };

    const { data: order } = await wooApi.post("orders", orderData);

    // Redirect to our CUSTOM payment page instead of WordPress
    return NextResponse.json({ 
      orderId: order.id,
      url: `/checkout/payment/${order.id}`
    });
  } catch (error: any) {
    console.error("WooCommerce Checkout Error:", error?.response?.data || error.message);
    return NextResponse.json({ error: "Failed to create order in WooCommerce" }, { status: 500 });
  }
}
