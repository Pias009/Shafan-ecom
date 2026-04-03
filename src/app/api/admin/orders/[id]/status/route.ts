import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";
import { sendOrderStatusEmail } from "@/lib/email/service";

const StatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  sendEmail: z.boolean().optional().default(true),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid status provided", details: parsed.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { status, sendEmail } = parsed.data;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true, user: true }
    });

    if (sendEmail !== false && updatedOrder.email) {
      const shippingAddr = updatedOrder.shippingAddress as any;
      const customerName = shippingAddr?.first_name 
        ? `${shippingAddr.first_name} ${shippingAddr.last_name || ''}`
        : 'Customer';

      await sendOrderStatusEmail(
        id,
        updatedOrder.email,
        customerName,
        status,
        updatedOrder.items as any,
        updatedOrder.totalCents,
        updatedOrder.currency,
        shippingAddr
      );
    }

    return new Response(JSON.stringify(updatedOrder), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Admin Order Update Error:", e.message);
    return new Response(JSON.stringify({ error: "Server error or order update failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
