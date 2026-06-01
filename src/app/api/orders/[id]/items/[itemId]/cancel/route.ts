import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await getServerAuthSession();
  const { id, itemId } = await params;
  const url = new URL(req.url);
  const guestEmail = url.searchParams.get("email")?.toLowerCase();

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { email: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderEmail = ((order as any).email as string)?.toLowerCase();
    const orderUserEmail = ((order as any).user?.email as string)?.toLowerCase();
    const userEmail = session?.user?.email?.toLowerCase();
    const callerEmail = userEmail || guestEmail;

    if (!callerEmail) {
      return NextResponse.json({ error: "Email required" }, { status: 401 });
    }

    const matched = callerEmail === orderEmail || callerEmail === orderUserEmail;
    if (!matched) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const item = (order as any).items.find((it: any) => it.id === itemId);
    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (item.cancelledAt) {
      return NextResponse.json({ error: "Item already cancelled" }, { status: 400 });
    }

    const status = (order as any).status;
    if (status === "DELIVERED" || status === "CANCELLED" || status === "REFUNDED") {
      return NextResponse.json({ error: "Order is already completed, cancelled, or refunded" }, { status: 400 });
    }

    const updatedItem = await (prisma as any).orderItem.update({
      where: { id: itemId },
      data: { cancelledAt: new Date() },
    });

    const cancelledItems = (order as any).items.filter((it: any) => it.id !== itemId && !it.cancelledAt);
    const allCancelled = cancelledItems.length === 0;

    if (allCancelled) {
      await prisma.order.update({
        where: { id },
        data: { status: "CANCELLED" as any },
      });
    }

    return NextResponse.json({ item: updatedItem, allCancelled });
  } catch (error) {
    console.error("Cancel item error:", error);
    return NextResponse.json({ error: "Failed to cancel item" }, { status: 500 });
  }
}
