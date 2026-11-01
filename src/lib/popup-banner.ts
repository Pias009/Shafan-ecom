import { prisma } from "@/lib/prisma";

// Site-wide popup banner attached to a discount/coupon. The admin sets it in
// the discount form; SitePopupBanner shows it once per visitor on whatever
// page they land on.

export const POPUP_ACTIONS = ["COPY_CODE", "LINK", "NONE"] as const;
export type PopupAction = (typeof POPUP_ACTIONS)[number];

export interface PublicPopupBanner {
  /** `${discountId}:${version}` — changes whenever the banner changes, so it shows once more. */
  key: string;
  image: string;
  action: PopupAction;
  link: string | null;
  code: string | null;
}

type PopupFields = {
  popupEnabled: boolean;
  popupImage: string | null;
  popupAction: PopupAction;
  popupLink: string | null;
};

/** Validates the popup fields from an admin create/update body. */
export function parsePopupInput(body: any): { data: PopupFields } | { error: string } {
  const popupEnabled = !!body.popupEnabled;
  const popupImage = typeof body.popupImage === "string" && body.popupImage.trim() ? body.popupImage.trim() : null;
  const popupAction: PopupAction = POPUP_ACTIONS.includes(body.popupAction) ? body.popupAction : "COPY_CODE";
  let popupLink = typeof body.popupLink === "string" && body.popupLink.trim() ? body.popupLink.trim() : null;

  if (popupEnabled && !popupImage) return { error: "Upload a popup banner image, or turn the popup off" };
  if (popupEnabled && popupAction === "LINK") {
    if (!popupLink) return { error: "Enter the link the popup banner should open" };
    // Allow site paths ("/offers") and absolute http(s) URLs only.
    if (!popupLink.startsWith("/") && !/^https?:\/\//i.test(popupLink)) popupLink = `https://${popupLink}`;
  }
  return { data: { popupEnabled, popupImage, popupAction, popupLink: popupAction === "LINK" ? popupLink : null } };
}

/** True when any visible part of the banner differs from what is stored. */
export function popupChanged(
  existing: { popupEnabled?: boolean | null; popupImage?: string | null; popupAction?: string | null; popupLink?: string | null },
  next: PopupFields
): boolean {
  return (
    !!existing.popupEnabled !== next.popupEnabled ||
    (existing.popupImage || null) !== next.popupImage ||
    (existing.popupAction || "COPY_CODE") !== next.popupAction ||
    (existing.popupLink || null) !== next.popupLink
  );
}

type LiveCheck = {
  active?: boolean | null;
  status?: string | null;
  countries?: string[] | null;
  startDate?: Date | null;
  endDate?: Date | null;
  maxUses?: number | null;
  uses?: number | null;
};

// Date window checked in JS: Mongo stores blank dates as absent, which
// Prisma's `{ startDate: null }` filter does not match.
function isLiveFor(d: LiveCheck, country: string, now: Date): boolean {
  return (
    !!d.active &&
    d.status === "ACTIVE" &&
    (!d.countries?.length || d.countries.includes(country)) &&
    (!d.startDate || d.startDate <= now) &&
    (!d.endDate || d.endDate >= now) &&
    !(d.maxUses && (d.uses || 0) >= d.maxUses)
  );
}

function asAction(value: string | null | undefined): PopupAction {
  return (POPUP_ACTIONS as readonly string[]).includes(value || "") ? (value as PopupAction) : "COPY_CODE";
}

/**
 * The banner to show a visitor from `country`: the most recently updated live
 * one, from either a coupon (Discounts & coupons) or an offer section.
 */
export async function getActivePopupBanner(country: string): Promise<PublicPopupBanner | null> {
  const now = new Date();
  const upper = country.toUpperCase();
  const candidates: (PublicPopupBanner & { at: number })[] = [];

  const discountSelect = {
    id: true, code: true, active: true, status: true, countries: true, startDate: true, endDate: true,
    maxUses: true, uses: true,
  } as const;

  const discounts = await prisma.discount.findMany({
    where: { popupEnabled: true, active: true, status: "ACTIVE" },
    select: { ...discountSelect, popupImage: true, popupAction: true, popupLink: true, popupUpdatedAt: true, updatedAt: true },
  });
  for (const d of discounts) {
    if (!d.popupImage || !isLiveFor(d, upper, now)) continue;
    const action = asAction(d.popupAction);
    const at = (d.popupUpdatedAt || d.updatedAt).getTime();
    candidates.push({
      key: `${d.id}:${at}`,
      image: d.popupImage,
      action: action === "COPY_CODE" && !d.code ? "NONE" : action,
      link: action === "LINK" ? d.popupLink : null,
      code: d.code,
      at,
    });
  }

  const sections = await prisma.offerSection.findMany({
    where: { popupEnabled: true, active: true },
    select: { id: true, discountId: true, popupImage: true, popupAction: true, popupLink: true, popupUpdatedAt: true, updatedAt: true },
  });
  const linkedIds = sections.map((s) => s.discountId).filter((id): id is string => !!id);
  const linked = linkedIds.length
    ? new Map(
        (await prisma.discount.findMany({ where: { id: { in: linkedIds } }, select: discountSelect })).map((d) => [d.id, d])
      )
    : new Map();
  for (const s of sections) {
    if (!s.popupImage) continue;
    const coupon = s.discountId ? linked.get(s.discountId) : undefined;
    const liveCode = coupon && isLiveFor(coupon, upper, now) ? coupon.code : null;
    const action = asAction(s.popupAction);
    // A banner advertising a code must disappear once the code stops working.
    if (action === "COPY_CODE" && !liveCode) continue;
    const at = (s.popupUpdatedAt || s.updatedAt).getTime();
    candidates.push({
      key: `section-${s.id}:${at}`,
      image: s.popupImage,
      action,
      link: action === "LINK" ? s.popupLink : null,
      code: liveCode,
      at,
    });
  }

  if (candidates.length === 0) return null;
  const latest = candidates.sort((a, b) => b.at - a.at)[0];
  return { key: latest.key, image: latest.image, action: latest.action, link: latest.link, code: latest.code };
}
