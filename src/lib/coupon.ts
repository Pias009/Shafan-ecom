import { prisma } from "@/lib/prisma";
import { customerUsageError } from "@/lib/discount-usage";
import type { CouponRule, CouponType } from "@/lib/coupon-math";

// Single source of truth for "is this code valid, and which cart products does
// it cover?" — used by /api/coupons/validate (cart preview) and create-order.

const OBJECT_ID = /^[a-f0-9]{24}$/i;

export type ResolvedCoupon =
  | { ok: true; discountId: string; code: string; description: string | null; rule: CouponRule }
  | { ok: false; error: string; usageLimitReached?: boolean };

export async function resolveCoupon(input: {
  code: string;
  country: string;
  productIds: string[];
  userId?: string | null;
  email?: string | null;
}): Promise<ResolvedCoupon> {
  const code = input.code.trim();
  const country = input.country.toUpperCase();
  if (!code) return { ok: false, error: "Coupon code required" };

  const discount = await prisma.discount.findFirst({
    where: { code: { equals: code, mode: "insensitive" } },
    include: {
      productDiscounts: { select: { productId: true } },
      categoryDiscounts: { select: { categoryId: true } },
    },
  });

  if (!discount || !discount.active || discount.status !== "ACTIVE") {
    return { ok: false, error: "Invalid or expired coupon" };
  }
  if (discount.countries?.length && !discount.countries.includes(country)) {
    return { ok: false, error: "This coupon is not valid in your country" };
  }
  const now = new Date();
  if (discount.startDate && discount.startDate > now) return { ok: false, error: "Coupon not yet active" };
  if (discount.endDate && discount.endDate < now) return { ok: false, error: "Coupon has expired" };
  if (discount.maxUses && discount.uses >= discount.maxUses) {
    return { ok: false, error: "Coupon usage limit reached" };
  }

  const usageError = await customerUsageError(discount, { userId: input.userId, email: input.email });
  if (usageError) return { ok: false, error: usageError, usageLimitReached: true };

  // Scope. A code with no products/brands/categories selected keeps its
  // historical whole-cart behaviour; otherwise only matching products qualify.
  const productSet = new Set(discount.productDiscounts.map((p) => p.productId));
  const brandSet = new Set(discount.brandIds || []);
  const categorySet = new Set(discount.categoryDiscounts.map((c) => c.categoryId));
  const targeted = !discount.applyToAll && (productSet.size > 0 || brandSet.size > 0 || categorySet.size > 0);

  let eligibleProductIds: string[] | null = null;
  if (targeted) {
    const ids = [...new Set(input.productIds.filter((id) => OBJECT_ID.test(id)))];
    const products = ids.length
      ? await prisma.product.findMany({
          where: { id: { in: ids } },
          select: { id: true, brandId: true, productCategories: { select: { categoryId: true } } },
        })
      : [];
    eligibleProductIds = products
      .filter(
        (p) =>
          productSet.has(p.id) ||
          (p.brandId && brandSet.has(p.brandId)) ||
          p.productCategories.some((c) => categorySet.has(c.categoryId))
      )
      .map((p) => p.id);

    if (eligibleProductIds.length === 0) {
      return { ok: false, error: "This coupon doesn't apply to the products in your cart" };
    }
  }

  const countryCaps = discount.countryMaxLimits as Record<string, number> | null;
  const maxLimit = countryCaps?.[country] || discount.maxLimitAmount || null;

  return {
    ok: true,
    discountId: discount.id,
    code: discount.code || code.toUpperCase(),
    description: discount.description,
    rule: {
      type: discount.discountType as CouponType,
      value: discount.value,
      maxLimit,
      minOrder: discount.minimumOrderValue || null,
      eligibleProductIds,
    },
  };
}
