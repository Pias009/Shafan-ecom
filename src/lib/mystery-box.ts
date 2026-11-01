// Checkout "Mystery Box" incentive: once the cart holds `threshold` units, a
// free mystery box ships with the order. Shared by the client banner and (for
// fulfilment) create-order, so both agree on who qualifies.
// Kill switch: NEXT_PUBLIC_MYSTERY_BOX_PROMO=false.
export const MYSTERY_BOX_PROMO = {
  id: "mystery_box_v1",
  name: "Free Mystery Box",
  enabled: process.env.NEXT_PUBLIC_MYSTERY_BOX_PROMO !== "false",
  threshold: Number(process.env.NEXT_PUBLIC_MYSTERY_BOX_THRESHOLD) || 3,
};

export function mysteryBoxProgress(units: number, threshold = MYSTERY_BOX_PROMO.threshold) {
  const count = Math.max(0, Math.floor(units));
  return {
    count: Math.min(count, threshold),
    remaining: Math.max(0, threshold - count),
    unlocked: count >= threshold,
  };
}
