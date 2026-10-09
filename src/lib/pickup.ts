/**
 * Store-pickup shared types & helpers. Safe to import from client components —
 * the DB-backed loader lives in `pickup-config.ts`.
 */

export const DELIVERY_METHOD_SHIP = "SHIP";
export const DELIVERY_METHOD_PICKUP = "PICKUP";
export type DeliveryMethod = typeof DELIVERY_METHOD_SHIP | typeof DELIVERY_METHOD_PICKUP;

export const DEFAULT_PICKUP_READY_DAYS = 3;

export interface PickupLocation {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  hours?: string;
  mapUrl?: string;
  active: boolean;
}

export interface CountryPickupSettings {
  enabled: boolean;
  /** Pickup orders pay no delivery charge (default). When false, `pickupFee` applies. */
  freeDelivery: boolean;
  pickupFee: number;
  /** Days after the order is placed until it is ready to collect. */
  readyInDays: number;
  instructions?: string;
  locations: PickupLocation[];
}

export interface PickupSettings {
  countries: Record<string, CountryPickupSettings>;
}

/** What the storefront receives per country (only active locations). */
export interface PublicPickupConfig {
  enabled: boolean;
  fee: number;
  readyInDays: number;
  instructions?: string;
  locations: PickupLocation[];
}

/** Snapshot stored on PendingCheckout / Order. */
export interface PickupDetails {
  locationId: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  hours?: string;
  mapUrl?: string;
  instructions?: string;
  readyInDays: number;
  readyBy: string; // ISO date
}

export function isPickupOrder(order: { deliveryMethod?: string | null } | null | undefined): boolean {
  return order?.deliveryMethod === DELIVERY_METHOD_PICKUP;
}

export function getPickupDetails(order: { deliveryMethod?: string | null; pickupDetails?: unknown } | null | undefined): PickupDetails | null {
  if (!isPickupOrder(order)) return null;
  const details = order?.pickupDetails as PickupDetails | null | undefined;
  return details && typeof details === "object" && details.name ? details : null;
}

export function computeReadyBy(readyInDays: number, from: Date = new Date()): Date {
  const date = new Date(from);
  date.setDate(date.getDate() + Math.max(0, Math.round(readyInDays)));
  return date;
}

export function formatReadyBy(readyBy: string | Date): string {
  return new Date(readyBy).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Dubai",
  });
}

export function formatReadyInDays(days: number): string {
  if (days <= 0) return "Same day";
  return `${days} ${days === 1 ? "day" : "days"}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Customer-email card describing where/when to collect the order. */
export function renderPickupEmailBlock(details: PickupDetails): string {
  const lines = [
    `<strong>${escapeHtml(details.name)}</strong>`,
    escapeHtml([details.address, details.city].filter(Boolean).join(", ")),
    details.hours ? `🕒 ${escapeHtml(details.hours)}` : "",
    details.phone ? `📞 ${escapeHtml(details.phone)}` : "",
  ].filter(Boolean);

  return `
    <div style="background:white;padding:24px;border-radius:12px;margin:0 0 24px;border:2px solid #2563eb;">
      <h3 style="color:#333;margin:0 0 4px;font-size:16px;">📍 Store Pickup</h3>
      <p style="color:#2563eb;margin:0 0 12px;font-size:13px;font-weight:600;">Ready for pickup from ${escapeHtml(formatReadyBy(details.readyBy))}</p>
      <p style="color:#495057;margin:0;line-height:1.6;">${lines.join("<br>")}</p>
      ${details.instructions ? `<p style="color:#6c757d;margin:12px 0 0;font-size:13px;line-height:1.5;">${escapeHtml(details.instructions)}</p>` : ""}
      ${details.mapUrl ? `<a href="${escapeHtml(details.mapUrl)}" style="display:inline-block;margin-top:12px;color:#2563eb;font-weight:600;font-size:13px;">Open in Maps →</a>` : ""}
    </div>`;
}

/** One-row addition for admin notification tables. Empty for shipped orders. */
export function renderPickupAdminRow(order: { deliveryMethod?: string | null; pickupDetails?: unknown }): string {
  const details = getPickupDetails(order);
  if (!details) return "";
  return `<tr><td style="padding: 8px 0; color: #666;">Delivery</td><td style="padding: 8px 0;"><strong style="color: #2563eb;">STORE PICKUP</strong> — ${escapeHtml(details.name)} (ready ${escapeHtml(formatReadyBy(details.readyBy))})</td></tr>`;
}
