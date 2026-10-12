import { prisma } from "@/lib/prisma";

/**
 * Find an order by its short number (last 8 chars of the id, as printed on
 * receipts/emails) or a full id. The caller must prove ownership: either the
 * email used at checkout, or being the signed-in user who placed the order.
 */
export async function findOrderForTracking(
  orderNumberRaw: string,
  emailRaw: string,
  userId?: string | null
) {
  const email = emailRaw.trim().toLowerCase();
  const cleaned = orderNumberRaw.trim().replace(/^#/, "");

  if ((!email && !userId) || !cleaned) return null;

  // A full Mongo ObjectId was pasted (e.g. copied from a link/invoice).
  if (/^[0-9a-fA-F]{24}$/.test(cleaned)) {
    const order = await prisma.order.findUnique({
      where: { id: cleaned.toLowerCase() },
      include: { items: true, shipment: true, user: { select: { email: true } } },
    });
    if (!order) return null;
    const orderEmail = order.email?.toLowerCase() || order.user?.email?.toLowerCase();
    const owned = (email && orderEmail === email) || (userId && order.userId === userId);
    return owned ? order : null;
  }

  // Short order number — find the owner's orders first (real fields), then
  // match the derived order number in JS.
  const candidates = await prisma.order.findMany({
    where: {
      OR: [
        ...(email
          ? [
              { email: { equals: email, mode: "insensitive" as const } },
              { user: { email: { equals: email, mode: "insensitive" as const } } },
            ]
          : []),
        ...(userId ? [{ userId }] : []),
      ],
    },
    include: { items: true, shipment: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const target = cleaned.toUpperCase();
  return candidates.find((o) => o.id.slice(-8).toUpperCase() === target) || null;
}
