import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { resolveCoupon } from "@/lib/coupon";

// GET /api/coupons/validate?code=X&country=AE&products=id1,id2
// `products` are the cart's product ids; the response says which of them the
// code covers (eligibleProductIds: null = whole cart).
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code") || "";
    const country = searchParams.get("country") || "AE";
    const productIds = (searchParams.get("products") || "").split(",").map((s) => s.trim()).filter(Boolean);

    if (!code.trim()) {
      return NextResponse.json({ valid: false, error: "Coupon code required" }, { status: 400 });
    }

    const session = await getServerAuthSession().catch(() => null);
    const result = await resolveCoupon({
      code,
      country,
      productIds,
      userId: session?.user?.id,
      email: session?.user?.email || searchParams.get("email"),
    });

    if (!result.ok) {
      return NextResponse.json({ valid: false, error: result.error }, { status: 400 });
    }

    const { rule } = result;
    return NextResponse.json({
      valid: true,
      code: result.code,
      description: result.description,
      type: rule.type,
      value: rule.value,
      rule,
      // Legacy fields (fraction for %, amount for fixed) kept for older callers.
      discount: rule.type === "PERCENTAGE" ? rule.value / 100 : rule.value,
      minimumOrderValue: rule.minOrder,
      maxLimitAmount: rule.maxLimit,
      eligibleProductIds: rule.eligibleProductIds,
    });
  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json({ valid: false, error: "Server error" }, { status: 500 });
  }
}
