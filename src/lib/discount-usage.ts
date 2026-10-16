import { prisma } from "@/lib/prisma";

// How many times this customer has redeemed a discount. Guest checkouts record
// usage with only an email, so match on userId OR email (case-insensitive) —
// otherwise a "once per customer" coupon could be reused as a guest.
export async function countCustomerDiscountUses(
  discountId: string,
  who: { userId?: string | null; email?: string | null }
): Promise<number> {
  const or: any[] = [];
  if (who.userId) or.push({ userId: who.userId });
  if (who.email?.trim()) or.push({ email: { equals: who.email.trim(), mode: "insensitive" } });
  if (or.length === 0) return 0;
  return prisma.discountUsage.count({ where: { discountId, OR: or } });
}

// Per-customer limit check shared by cart validation and order creation.
export async function customerUsageError(
  discount: { id: string; usageType?: string | null; maxUsesPerUser?: number | null },
  who: { userId?: string | null; email?: string | null }
): Promise<string | null> {
  const used = await countCustomerDiscountUses(discount.id, who);
  if (discount.maxUsesPerUser && used >= discount.maxUsesPerUser) {
    return discount.maxUsesPerUser === 1
      ? "You have already used this code"
      : `You can only use this code ${discount.maxUsesPerUser} times`;
  }
  if ((discount.usageType || "MULTI_USE") === "SINGLE_USE" && used > 0) {
    return "This code can only be used once per customer";
  }
  return null;
}
