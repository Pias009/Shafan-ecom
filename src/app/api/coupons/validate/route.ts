import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code")?.toUpperCase();
    const country = searchParams.get("country") || "AE";

    if (!code) {
      return NextResponse.json({ valid: false, error: "Coupon code required" }, { status: 400 });
    }

    const now = new Date();

    // Find active discount with matching code
    const discount = await prisma.discount.findFirst({
      where: {
        code: { equals: code, mode: "insensitive" },
        active: true,
        status: "ACTIVE",
        countries: {
          has: country.toUpperCase()
        },
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ]
      }
    });

    // Check if discount exists and is valid
    if (!discount) {
      return NextResponse.json({ valid: false, error: "Invalid or expired coupon" }, { status: 400 });
    }

    // Check date validity
    if (discount.startDate && discount.startDate > now) {
      return NextResponse.json({ valid: false, error: "Coupon not yet active" }, { status: 400 });
    }
    if (discount.endDate && discount.endDate < now) {
      return NextResponse.json({ valid: false, error: "Coupon has expired" }, { status: 400 });
    }

    // Check usage limit
    if (discount.maxUses && discount.uses >= discount.maxUses) {
      return NextResponse.json({ valid: false, error: "Coupon usage limit reached" }, { status: 400 });
    }

    // Return discount info
    const discountValue = discount.discountType === "PERCENTAGE" 
      ? discount.value / 100 
      : discount.value / 100;

    return NextResponse.json({
      valid: true,
      discount: discountValue,
      code: discount.code,
      description: discount.description,
      type: discount.discountType,
      minimumOrderValue: discount.minimumOrderValue,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}