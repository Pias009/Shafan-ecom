import { NextRequest, NextResponse } from "next/server";
import { shippingService } from "@/services/shipping";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, carrier, orderId, trackingNumber, ...params } = body;

    if (action === "calculateRates") {
      const rates = await shippingService.calculateRates({
        country: params.country,
        city: params.city,
        weight: params.weight || 1,
        dimensions: params.dimensions,
      });
      return NextResponse.json({ success: true, rates });
    }

    if (action === "getCheapestRate") {
      const rate = await shippingService.getCheapestRate({
        country: params.country,
        city: params.city,
        weight: params.weight || 1,
      });
      return NextResponse.json({ success: true, rate });
    }

    if (action === "createShipment") {
      if (!carrier || !orderId || !params.recipient) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
      }
      const shipment = await shippingService.createShipment(carrier, {
        orderId,
        recipient: params.recipient,
        items: params.items || [],
      });
      return NextResponse.json({ success: true, shipment });
    }

    if (action === "track") {
      if (!carrier || !trackingNumber) {
        return NextResponse.json({ success: false, error: "Missing carrier or tracking number" }, { status: 400 });
      }
      const tracking = await shippingService.trackShipment(carrier, trackingNumber);
      return NextResponse.json({ success: true, tracking });
    }

    if (action === "getCarriers") {
      const carriers = shippingService.getAvailableCarriers(params.country || "AE");
      return NextResponse.json({ success: true, carriers });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Shipping API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}