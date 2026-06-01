import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PackageOpen } from "lucide-react";
import OrderList from "@/components/dashboard/OrderList";

export const dynamic = "force-dynamic";

export default async function DashboardOrdersPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const session = await getServerAuthSession();
  const sp = await searchParams;
  const guestEmail = sp?.email;
  const userEmail = session?.user?.email || guestEmail;

  if (!userEmail) return redirect("/?login=true");

  let orders: any[] = [];
  try {
    const user = session?.user?.email ? await prisma.user.findUnique({
      where: { email: session.user.email },
    }) : null;

    const dbOrders = await (prisma as any).order.findMany({
      where: {
        OR: [
          ...(user?.id ? [{ userId: user.id }] : []),
          ...(session?.user?.email ? [{ user: { email: session.user.email } }] : []),
          { email: userEmail },
        ],
      },
      include: {
        items: {
          include: {
            product: {
              select: { slug: true, mainImage: true, images: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    orders = dbOrders.map((o: any) => ({
      id: String(o.id),
      total: o.total,
      currency: o.currency,
      status: o.status,
      paymentStatus: o.paymentStatus,
      createdAt: o.createdAt,
      itemCount: o.items.reduce((acc: number, item: any) => acc + item.quantity, 0),
      paymentMethod: o.paymentMethodTitle,
      items: o.items.map((it: any) => ({
        id: it.id,
        name: it.nameSnapshot || it.name || "Unknown Product",
        nameSnapshot: it.nameSnapshot,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        imageSnapshot: it.imageSnapshot,
        product: it.product
          ? {
              slug: it.product.slug,
              mainImage: it.product.mainImage,
              images: it.product.images,
            }
          : undefined,
      })),
    }));
  } catch (error) {
    console.error("Dashboard orders fetch error:", error);
  }

  const title = "My Orders";
  const subtitle = "Track and manage your recent purchases.";

  return (
    <div className="space-y-6">
      <div className="glass-panel-heavy rounded-3xl p-8 border border-black/5 shadow-xl bg-white">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-black">{title}</h2>
            <p className="mt-1 text-sm text-black/60 font-medium">{subtitle}</p>
          </div>
          <div className="p-3 bg-black/5 rounded-2xl ring-1 ring-black/10 hidden sm:block">
            <PackageOpen className="w-6 h-6 text-black" />
          </div>
        </div>

        <OrderList orders={orders} />
      </div>
    </div>
  );
}
