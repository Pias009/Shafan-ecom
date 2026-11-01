import { prisma } from "@/lib/prisma";

const OBJECT_ID = /^[a-f0-9]{24}$/i;
const ALL_COUNTRIES = ["AE", "KW", "BH", "SA", "OM", "QA"];

// Validates the admin offer-section form body (shared by the POST and PUT routes).
export function parseOfferSectionBody(body: any) {
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return { error: "Title is required" } as const;

  const productIds: string[] = Array.isArray(body.productIds)
    ? Array.from(new Set(body.productIds.filter((id: unknown) => typeof id === "string" && OBJECT_ID.test(id))))
    : [];
  if (productIds.length === 0) return { error: "Select at least one product" } as const;

  return {
    data: {
      title,
      subtitle: typeof body.subtitle === "string" && body.subtitle.trim() ? body.subtitle.trim() : null,
      productIds,
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0,
      active: body.active !== false,
    },
  } as const;
}

// ── Section coupon ─────────────────────────────────────────────────────────
// An offer section can carry a coupon code that discounts only its products.
// It is stored as a normal Discount (so it shows under Discounts & coupons and
// goes through the same checkout validation); its products are re-synced to
// the section's products on every save.

export interface SectionCouponInput {
  enabled: boolean;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  maxLimitAmount: number | null;
  minimumOrderValue: number | null;
  endDate: Date | null;
}

const num = (v: unknown) => (v === "" || v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));

export function parseSectionCoupon(raw: any): { data: SectionCouponInput } | { error: string } {
  if (!raw || !raw.enabled) {
    return { data: { enabled: false, code: "", discountType: "PERCENTAGE", value: 0, maxLimitAmount: null, minimumOrderValue: null, endDate: null } };
  }
  const code = typeof raw.code === "string" ? raw.code.trim().toUpperCase() : "";
  if (!code) return { error: "Enter a coupon code" };
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return { error: "Coupon code: 3–30 letters, numbers, - or _" };

  const discountType = raw.discountType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE";
  const value = num(raw.value);
  if (!value || value <= 0) return { error: "Enter the coupon discount value" };
  if (discountType === "PERCENTAGE" && value > 100) return { error: "Coupon percentage cannot exceed 100" };

  const endDate = raw.endDate ? new Date(raw.endDate) : null;
  if (endDate && Number.isNaN(endDate.getTime())) return { error: "Invalid coupon end date" };

  return {
    data: {
      enabled: true,
      code,
      discountType,
      value,
      maxLimitAmount: num(raw.maxLimitAmount),
      minimumOrderValue: num(raw.minimumOrderValue),
      endDate,
    },
  };
}

/** Creates/updates/pauses the section's coupon. Returns the Discount id to store on the section. */
export async function syncSectionCoupon(opts: {
  title: string;
  productIds: string[];
  coupon: SectionCouponInput;
  discountId: string | null;
  adminEmail?: string | null;
}): Promise<{ discountId: string | null } | { error: string }> {
  const existing = opts.discountId
    ? await prisma.discount.findUnique({ where: { id: opts.discountId } })
    : null;

  if (!opts.coupon.enabled) {
    // Turned off: pause the code but keep the link so it can be switched back on.
    if (existing?.active) {
      await prisma.discount.update({ where: { id: existing.id }, data: { active: false, status: "DRAFT" } });
    }
    return { discountId: existing?.id || null };
  }

  const clash = await prisma.discount.findFirst({
    where: {
      code: { equals: opts.coupon.code, mode: "insensitive" },
      ...(existing ? { id: { not: existing.id } } : {}),
    },
    select: { id: true },
  });
  if (clash) return { error: `Coupon code ${opts.coupon.code} is already used by another discount` };

  const data = {
    code: opts.coupon.code,
    name: `${opts.title} (offer section)`,
    discountType: opts.coupon.discountType,
    value: opts.coupon.value,
    maxLimitAmount: opts.coupon.maxLimitAmount,
    minimumOrderValue: opts.coupon.minimumOrderValue,
    endDate: opts.coupon.endDate,
    applyToAll: false,
    brandIds: [],
    active: true,
    status: "ACTIVE",
  };
  const products = opts.productIds.map((productId) => ({ productId }));

  if (existing) {
    await prisma.discount.update({
      where: { id: existing.id },
      data: {
        ...data,
        publishedAt: existing.publishedAt || new Date(),
        productDiscounts: { deleteMany: {}, create: products },
        categoryDiscounts: { deleteMany: {} },
      },
    });
    return { discountId: existing.id };
  }

  const created = await prisma.discount.create({
    data: {
      ...data,
      countries: ALL_COUNTRIES,
      uses: 0,
      publishedAt: new Date(),
      createdBy: opts.adminEmail || null,
      productDiscounts: { create: products },
    },
  });
  return { discountId: created.id };
}

/** The section's coupon in the shape the admin form edits. */
export async function getSectionCouponForForm(discountId: string | null) {
  if (!discountId) return null;
  const d = await prisma.discount.findUnique({ where: { id: discountId } });
  if (!d) return null;
  return {
    enabled: d.active && d.status === "ACTIVE",
    code: d.code || "",
    discountType: d.discountType === "FIXED_AMOUNT" ? "FIXED_AMOUNT" : "PERCENTAGE",
    value: d.value,
    maxLimitAmount: d.maxLimitAmount,
    minimumOrderValue: d.minimumOrderValue,
    endDate: d.endDate ? d.endDate.toISOString().slice(0, 16) : "",
    uses: d.uses,
  };
}
