import { prisma } from "@/lib/prisma";
import { countCustomerDiscountUses } from "@/lib/discount-usage";

// AppSettings key holding { code } of the coupon given out by the footer
// "Claim 10%" sign-up and shown on the account dashboard. Admin picks it on
// /ueadmin/discounts; WLC10 is the coupon that existed when this shipped.
export const WELCOME_OFFER_SETTING = "welcome_offer";
export const DEFAULT_WELCOME_CODE = "WLC10";

export interface WelcomeOffer {
  id: string;
  code: string;
  name: string;
  discountType: string;
  value: number;
  minimumOrderValue: number | null;
  endDate: Date | null;
  maxUsesPerUser: number | null;
}

export async function getWelcomeOfferCode(): Promise<string> {
  const setting = await prisma.appSettings.findUnique({ where: { type: WELCOME_OFFER_SETTING } }).catch(() => null);
  const code = (setting?.data as any)?.code;
  return typeof code === "string" && code.trim() ? code.trim() : DEFAULT_WELCOME_CODE;
}

// Same validity rules as /api/coupons/validate, so we never hand out a code checkout would reject.
export async function getWelcomeOffer(): Promise<WelcomeOffer | null> {
  const code = await getWelcomeOfferCode();
  const now = new Date();
  const discount = await prisma.discount.findFirst({
    where: { code: { equals: code, mode: "insensitive" }, active: true, status: "ACTIVE" },
  });
  if (!discount?.code) return null;
  if (discount.startDate && discount.startDate > now) return null;
  if (discount.endDate && discount.endDate < now) return null;
  if (discount.maxUses && discount.uses >= discount.maxUses) return null;

  return {
    id: discount.id,
    code: discount.code,
    name: discount.name,
    discountType: discount.discountType,
    value: discount.value,
    minimumOrderValue: discount.minimumOrderValue,
    endDate: discount.endDate,
    maxUsesPerUser: discount.maxUsesPerUser,
  };
}

export function welcomeOfferLabel(offer: Pick<WelcomeOffer, "discountType" | "value">): string {
  if (offer.discountType === "PERCENTAGE") return `${offer.value}% OFF`;
  if (offer.discountType === "FREE_SHIPPING") return "FREE SHIPPING";
  return `${offer.value} OFF`;
}

// Whether this customer has already redeemed the welcome coupon (mirrors the per-user check in create-order).
export async function hasUsedWelcomeOffer(offer: WelcomeOffer, who: { userId?: string | null; email?: string | null }) {
  if (!who.userId && !who.email) return false;
  const used = await countCustomerDiscountUses(offer.id, who);
  return used >= (offer.maxUsesPerUser || 1);
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function buildWelcomeEmail(offer: WelcomeOffer) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.shanfaglobal.com";
  const label = welcomeOfferLabel(offer);
  const code = escapeHtml(offer.code);
  const expiry = offer.endDate
    ? `Valid until ${offer.endDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";
  const subject = `Your ${label} welcome code: ${offer.code}`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f6f1f4;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1f4;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;">
        <tr><td style="background:linear-gradient(90deg,#3e0325,#890754);background-color:#540434;padding:28px 32px;text-align:center;">
          <div style="color:#f9a8d4;font-size:11px;font-weight:700;letter-spacing:3px;">SHANFA PRIVÉ • VIP ACCESS</div>
          <div style="color:#ffffff;font-size:26px;font-weight:800;margin-top:8px;">Welcome to Shanfa</div>
        </td></tr>
        <tr><td style="padding:32px;text-align:center;color:#1f1f1f;">
          <p style="margin:0 0 8px;font-size:15px;">Thank you for joining us. Here is your gift:</p>
          <p style="margin:0 0 20px;font-size:30px;font-weight:800;color:#890754;">${label} your first order</p>
          <div style="display:inline-block;border:2px dashed #890754;border-radius:14px;padding:14px 28px;font-size:24px;font-weight:800;letter-spacing:4px;color:#540434;background:#fdf2f8;">${code}</div>
          <p style="margin:20px 0 0;font-size:13px;color:#6b6b6b;">Enter this code at checkout. ${expiry} One use per customer.</p>
          <a href="${siteUrl}/products" style="display:inline-block;margin-top:24px;background:#890754;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:999px;">Start Shopping</a>
        </td></tr>
        <tr><td style="padding:16px 32px 28px;text-align:center;font-size:11px;color:#9b9b9b;">
          You can also find this code anytime in your account dashboard.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `Welcome to Shanfa!\n\nYour gift: ${label} your first order.\nCode: ${offer.code}\n\nEnter this code at checkout. ${expiry} One use per customer.\n\nShop now: ${siteUrl}/products`;

  return { subject, html, text };
}
