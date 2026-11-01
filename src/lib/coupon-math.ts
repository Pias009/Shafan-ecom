// Coupon amount maths shared by the cart (preview) and create-order (authoritative),
// so the discount a customer sees is exactly the discount they are charged.
// Client-safe: no server imports.

export type CouponType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";

export interface CouponRule {
  type: CouponType;
  /** Percent (15 = 15%) or a fixed amount in the order currency. */
  value: number;
  /** Discount cap for the customer's country, if any. */
  maxLimit: number | null;
  /** Minimum cart subtotal required. */
  minOrder: number | null;
  /** Cart products the code covers; null = the whole cart. */
  eligibleProductIds: string[] | null;
}

export interface CouponLine {
  productId: string;
  lineTotal: number;
}

export interface CouponResult {
  discount: number;
  eligibleSubtotal: number;
  freeShipping: boolean;
  /** Why nothing was discounted, if so. */
  reason?: "NO_ELIGIBLE_ITEMS" | "MIN_ORDER";
}

export function computeCouponDiscount(lines: CouponLine[], rule: CouponRule): CouponResult {
  const eligible = rule.eligibleProductIds ? new Set(rule.eligibleProductIds) : null;
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const eligibleSubtotal = lines.reduce(
    (sum, l) => (!eligible || eligible.has(l.productId) ? sum + l.lineTotal : sum),
    0
  );

  if (eligibleSubtotal <= 0) {
    return { discount: 0, eligibleSubtotal: 0, freeShipping: false, reason: "NO_ELIGIBLE_ITEMS" };
  }
  if (rule.minOrder && subtotal < rule.minOrder) {
    return { discount: 0, eligibleSubtotal, freeShipping: false, reason: "MIN_ORDER" };
  }

  let discount = 0;
  if (rule.type === "PERCENTAGE") discount = (eligibleSubtotal * rule.value) / 100;
  else if (rule.type === "FIXED_AMOUNT") discount = rule.value;

  if (rule.maxLimit && rule.maxLimit > 0) discount = Math.min(discount, rule.maxLimit);
  // A product-specific code can never discount more than the products it covers.
  discount = Math.max(0, Math.min(discount, eligibleSubtotal));

  return { discount, eligibleSubtotal, freeShipping: rule.type === "FREE_SHIPPING" };
}
