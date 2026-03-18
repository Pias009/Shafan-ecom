import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { z } from "zod";

const StatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  const user = session?.user as any;
  if (!session || !["ADMIN", "SUPERADMIN"].includes(user?.role)) {
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

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: parsed.data.status
      }
    });

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
