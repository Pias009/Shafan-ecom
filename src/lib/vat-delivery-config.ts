import { prisma } from "@/lib/prisma";
import { COUNTRY_CONFIG } from "@/lib/address-config";

export const VAT_DELIVERY_SETTINGS_TYPE = "vat_delivery";

export interface CountryChargeSettings {
  /** Minimum order subtotal (country currency). 0 = no minimum. */
  minOrder: number;
  vatPercent: number;
  deliveryFee: number;
  freeDelivery: number;
  deliveryTime?: string;
  deliveryText?: string;
}

export interface VATDeliverySettings {
  countries: Record<string, CountryChargeSettings>;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const DEFAULT_DELIVERY_INFO: Record<string, { deliveryTime: string; deliveryText: string }> = {
  AE: { deliveryTime: "1 - 2 Business Days", deliveryText: "Same-Day Dispatch for Morning Orders" },
  SA: { deliveryTime: "2 - 4 Business Days", deliveryText: "GCC Air Cargo • Direct Doorstep Delivery" },
  KW: { deliveryTime: "2 - 3 Business Days", deliveryText: "Priority Courier • Doorstep Delivery" },
  BH: { deliveryTime: "2 - 3 Business Days", deliveryText: "Fast Express • Direct Delivery" },
  OM: { deliveryTime: "2 - 4 Business Days", deliveryText: "GCC Direct Transit • Full Tracking" },
  QA: { deliveryTime: "2 - 3 Business Days", deliveryText: "Priority GCC Air Flight • Fast Delivery" },
  BD: { deliveryTime: "3 - 5 Business Days", deliveryText: "Standard International Courier" },
};

export function buildDefaultVATDeliverySettings(): VATDeliverySettings {
  const countries: Record<string, CountryChargeSettings> = {};
  for (const country of Object.values(COUNTRY_CONFIG)) {
    const defInfo = DEFAULT_DELIVERY_INFO[country.code] || {
      deliveryTime: `${country.estimatedDays || 2} - ${(country.estimatedDays || 2) + 1} Business Days`,
      deliveryText: "Express Tracked Delivery",
    };
    countries[country.code] = {
      minOrder: country.minOrder,
      vatPercent: Math.round(country.taxRate * 100 * 100) / 100,
      deliveryFee: country.deliveryFee,
      freeDelivery: country.freeDelivery,
      deliveryTime: defInfo.deliveryTime,
      deliveryText: defInfo.deliveryText,
    };
  }
  return { countries };
}

export const DEFAULT_VAT_DELIVERY_SETTINGS = buildDefaultVATDeliverySettings();

/**
 * Merge saved settings (from DB / admin form) over the hardcoded defaults.
 * Always returns every country so consumers can rely on the full set.
 */
export function mergeVATDeliverySettings(saved: unknown): VATDeliverySettings {
  const defaults = buildDefaultVATDeliverySettings();
  const data = saved as { countries?: Record<string, Partial<CountryChargeSettings>> } | null;
  if (!data || typeof data !== "object" || !data.countries) return defaults;

  const merged: Record<string, CountryChargeSettings> = { ...defaults.countries };
  for (const code of Object.keys(merged)) {
    const override = data.countries[code];
    if (!override) continue;
    merged[code] = {
      minOrder: Math.max(0, toFiniteNumber(override.minOrder, merged[code].minOrder)),
      vatPercent: toFiniteNumber(override.vatPercent, merged[code].vatPercent),
      deliveryFee: toFiniteNumber(override.deliveryFee, merged[code].deliveryFee),
      freeDelivery: toFiniteNumber(override.freeDelivery, merged[code].freeDelivery),
      deliveryTime:
        typeof override.deliveryTime === "string" && override.deliveryTime.trim()
          ? override.deliveryTime.trim()
          : merged[code].deliveryTime,
      deliveryText:
        typeof override.deliveryText === "string" && override.deliveryText.trim()
          ? override.deliveryText.trim()
          : merged[code].deliveryText,
    };
  }
  return { countries: merged };
}

/** Read persisted settings from AppSettings, falling back to defaults. */
export async function getVATDeliverySettings(): Promise<VATDeliverySettings> {
  try {
    const row = await (prisma as any).appSettings.findUnique({
      where: { type: VAT_DELIVERY_SETTINGS_TYPE },
    });
    return mergeVATDeliverySettings(row?.data);
  } catch (error) {
    console.error("Failed to load VAT/delivery settings:", error);
    return buildDefaultVATDeliverySettings();
  }
}

export interface CountryChargeConfig {
  minOrder: number;
  deliveryFee: number;
  freeDelivery: number;
  taxRate: number; // decimal ratio, e.g. 0.05 = 5%
  deliveryTime?: string;
  deliveryText?: string;
}

/**
 * Effective per-country charge config: hardcoded base values (active, regions,
 * etc.) with admin-editable minOrder / deliveryFee / freeDelivery / taxRate applied.
 * This is the single source of truth used by checkout + order creation.
 */
export async function loadCountryCharges(): Promise<Record<string, CountryChargeConfig>> {
  const settings = await getVATDeliverySettings();
  const charges: Record<string, CountryChargeConfig> = {};

  for (const country of Object.values(COUNTRY_CONFIG)) {
    const cs = settings.countries[country.code];
    const defInfo = DEFAULT_DELIVERY_INFO[country.code];
    charges[country.code] = {
      minOrder: cs?.minOrder ?? country.minOrder,
      deliveryFee: cs?.deliveryFee ?? country.deliveryFee,
      freeDelivery: cs?.freeDelivery ?? country.freeDelivery,
      taxRate: (cs?.vatPercent ?? country.taxRate * 100) / 100,
      deliveryTime: cs?.deliveryTime || defInfo?.deliveryTime || `${country.estimatedDays || 2} - ${(country.estimatedDays || 2) + 1} Business Days`,
      deliveryText: cs?.deliveryText || defInfo?.deliveryText || "Express Tracked Delivery",
    };
  }

  return charges;
}
