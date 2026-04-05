import { NextResponse } from "next/server";
import { createAramexShipment, trackAramexShipment } from "@/lib/shipping/aramex";

export async function POST(req: Request) {
  try {
    const { action, data } = await req.json();

    if (action === "create") {
      const result = await createAramexShipment({
        orderId: data.orderId || "TEST-001",
        recipientName: data.recipientName || "Test Customer",
        recipientPhone: data.recipientPhone || "+971048387827",
        recipientEmail: data.recipientEmail || "test@shanfaglobal.com",
        recipientAddress: data.recipientAddress || "Test Address, Street 123",
        recipientCity: data.recipientCity || "Dubai",
        recipientCountry: data.recipientCountry || "AE",
        productCode: data.productCode || "PDS",
        weight: data.weight || 0.5,
        description: data.description || "Test Shipment",
        pieces: data.pieces || 1,
        codAmount: data.codAmount || 0,
      });

      return NextResponse.json({
        success: true,
        result
      });
    }

    if (action === "track") {
      const result = await trackAramexShipment(data.trackingNumber);
      return NextResponse.json({
        success: true,
        result
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Aramex API Error:", error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
