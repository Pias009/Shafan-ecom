import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";
import { WELCOME_OFFER_SETTING, getWelcomeOfferCode } from "@/lib/welcome-offer";

export const dynamic = "force-dynamic";

// GET /api/admin/welcome-offer - Current footer welcome coupon + coupons it can be switched to
export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [code, coupons, subscribers] = await Promise.all([
    getWelcomeOfferCode(),
    prisma.discount.findMany({
      where: { code: { not: null }, active: true, status: "ACTIVE" },
      select: { code: true, name: true, discountType: true, value: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.newsletterSubscriber.count(),
  ]);

  return NextResponse.json({ code, coupons, subscribers });
}

// POST /api/admin/welcome-offer - { code } sets which coupon the footer sign-up emails
export async function POST(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const discount = code
    ? await prisma.discount.findFirst({ where: { code: { equals: code, mode: "insensitive" } }, select: { code: true } })
    : null;
  if (!discount?.code) {
    return NextResponse.json({ error: "Coupon code not found" }, { status: 400 });
  }

  await prisma.appSettings.upsert({
    where: { type: WELCOME_OFFER_SETTING },
    update: { data: { code: discount.code } },
    create: { type: WELCOME_OFFER_SETTING, data: { code: discount.code } },
  });

  return NextResponse.json({ success: true, code: discount.code });
}
