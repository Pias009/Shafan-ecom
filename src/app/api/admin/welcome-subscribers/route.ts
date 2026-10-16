import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// GET /api/admin/welcome-subscribers - Footer sign-ups with whether their welcome code was redeemed
export async function GET(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = new URL(req.url).searchParams.get("search")?.trim();

  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: search ? { email: { contains: search, mode: "insensitive" } } : {},
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // Resolve "used" per code in two queries instead of one per subscriber.
    const codes = Array.from(new Set(subscribers.map((s) => s.welcomeCode).filter((c): c is string => Boolean(c))));
    const discounts = codes.length
      ? await prisma.discount.findMany({ where: { code: { in: codes } }, select: { id: true, code: true } })
      : [];
    const usages = discounts.length
      ? await prisma.discountUsage.findMany({
          where: { discountId: { in: discounts.map((d) => d.id) } },
          select: { discountId: true, email: true, userId: true, usedAt: true },
        })
      : [];
    const codeByDiscountId = new Map(discounts.map((d) => [d.id, d.code]));
    const usedAt = new Map<string, Date>();
    for (const u of usages) {
      const code = codeByDiscountId.get(u.discountId);
      if (!code) continue;
      if (u.email) usedAt.set(`${code}|email:${u.email.toLowerCase()}`, u.usedAt);
      if (u.userId) usedAt.set(`${code}|user:${u.userId}`, u.usedAt);
    }

    return NextResponse.json({
      subscribers: subscribers.map((s) => ({
        id: s.id,
        email: s.email,
        welcomeCode: s.welcomeCode,
        emailSentAt: s.emailSentAt,
        createdAt: s.createdAt,
        usedAt: s.welcomeCode
          ? usedAt.get(`${s.welcomeCode}|email:${s.email}`) || (s.userId && usedAt.get(`${s.welcomeCode}|user:${s.userId}`)) || null
          : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching welcome subscribers:", error);
    return NextResponse.json({ error: "Failed to fetch sign-ups" }, { status: 500 });
  }
}
