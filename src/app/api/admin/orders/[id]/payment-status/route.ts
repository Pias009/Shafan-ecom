import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { z } from "zod";

const PaymentStatusSchema = z.object({
  paymentStatus: z.string().refine(
    (val) => ['PAID', 'PENDING', 'CANCELLED'].includes(val),
    { message: "Invalid payment status" }
  ),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = PaymentStatusSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid payment status provided", details: parsed.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { paymentStatus } = parsed.data;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { paymentStatus: paymentStatus as PaymentStatus },
    });

    return new Response(JSON.stringify(updatedOrder), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Admin Payment Status Update Error:", e.message);
    return new Response(JSON.stringify({ error: "Server error or payment status update failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
