import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { prisma } from "@/lib/prisma";

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.TABBY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return signature === expected;
}

export async function POST(request: NextRequest) {
  const rawPayload = await request.text();
  const signature = request.headers.get("x-tabby-signature") || "";

  if (!verifySignature(rawPayload, signature)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawPayload);
    const status = body?.status || body?.payload?.status;
    const orderId = body?.metadata?.order_id || body?.payload?.order_id || body?.payload?.order?.reference_id;

    switch (status?.toLowerCase()) {
      case "authorized":
        break;

      case "captured":
      case "closed":
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: "PAID" },
          });
        }
        break;

      case "rejected":
      case "failed":
        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: "CANCELLED" },
          });
        }
        break;
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ received: true });
  }
}
