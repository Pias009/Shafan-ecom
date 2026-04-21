import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { createAramexShipment } from "@/lib/shipping/aramex";

function generateTrackingCode(): string {
  const prefix = "GL";
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${random}-${Date.now().toString().slice(-6)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId } = body;


    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }


    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentMethod && order.paymentMethod !== "cod" && order.paymentMethod !== "stripe") {
      return NextResponse.json({ error: "Order already has a payment method" }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: "cod",
        paymentMethodTitle: "Cash on Delivery",
        paymentStatus: PaymentStatus.PENDING,
        status: OrderStatus.ORDER_RECEIVED,
      },
      include: { items: true, shipment: true }
    });

    // Create shipment for COD order
    let shipmentCreated = false;
    try {
      const shippingAddress = updatedOrder.shippingAddress as any;
      const countryCode = shippingAddress?.country || "AE";
      const gulfCountries = ['AE', 'KW', 'SA', 'BH', 'QA', 'OM'];
      const trackingCode = generateTrackingCode();
      
      let aramexResult = null;
      if (gulfCountries.includes(countryCode?.toUpperCase())) {
        try {
          aramexResult = await createAramexShipment({
            orderId: orderId,
            recipientName: `${shippingAddress?.first_name || ''} ${shippingAddress?.last_name || ''}`.trim() || "Customer",
            recipientPhone: shippingAddress?.phone || "+971048387827",
            recipientEmail: updatedOrder.email || "customer@email.com",
            recipientAddress: shippingAddress?.address_1 || "Address",
            recipientCity: shippingAddress?.city || "City",
            recipientCountry: countryCode,
            productCode: "PDS",
            weight: 0.5,
            description: `SHANFA Order ${orderId}`,
            pieces: updatedOrder.items?.length || 1,
          });
        } catch (aramexError) {
          console.error("Aramex shipment creation failed:", aramexError);
        }
      }

      // Create shipment record
      try {
        if (aramexResult?.Shipments?.[0]?.ID) {
          await prisma.shipment.create({
            data: {
              orderId: orderId,
              courier: "ARAMEX",
              trackingCode: aramexResult.Shipments[0].ID,
              trackingUrl: `https://www.aramex.com/track/${aramexResult.Shipments[0].ID}`,
              status: "Pending"
            }
          });
          shipmentCreated = true;
        } else {
          await prisma.shipment.create({
            data: {
              orderId: orderId,
              courier: "GLOBAL_COURIER",
              trackingCode: trackingCode,
              trackingUrl: `https://global-courier.com/track/${trackingCode}`,
              status: "Pending"
            }
          });
          shipmentCreated = true;
        }
      } catch (shipmentError) {
        console.error("Shipment record creation failed:", shipmentError);
      }
    } catch (shipmentError) {
      console.error("Shipment process failed:", shipmentError);
      // Continue even if shipment fails - order is still valid
    }

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      paymentMethod: "cod",
      message: "Order placed successfully with Cash on Delivery"
    });

  } catch (error: any) {
    console.error("=== COD Payment Error ===");
    console.error(error);
    const errorMessage = error?.message || "Payment failed. Please try again.";
    return NextResponse.json({ error: errorMessage, details: error.toString() }, { status: 500 });
  }
}
