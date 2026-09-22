import { prisma } from "@/lib/prisma";
import { COUNTRY_CONFIG } from "@/lib/address-config";

export const VAT_DELIVERY_SETTINGS_TYPE = "vat_delivery";

export interface CountryChargeSettings {
  vatPercent: number;
  deliveryFee: number;
  freeDelivery: number;
}

export interface VATDeliverySettings {
  countries: Record<string, CountryChargeSettings>;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function buildDefaultVATDeliverySettings(): VATDeliverySettings {
  const countries: Record<string, CountryChargeSettings> = {};
  for (const country of Object.values(COUNTRY_CONFIG)) {
    countries[country.code] = {
      vatPercent: Math.round(country.taxRate * 100 * 100) / 100,
      deliveryFee: country.deliveryFee,
      freeDelivery: country.freeDelivery,
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
      vatPercent: toFiniteNumber(override.vatPercent, merged[code].vatPercent),
      deliveryFee: toFiniteNumber(override.deliveryFee, merged[code].deliveryFee),
      freeDelivery: toFiniteNumber(override.freeDelivery, merged[code].freeDelivery),
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
}

/**
 * Effective per-country charge config: hardcoded base values (active, minOrder,
 * regions, etc.) with admin-editable deliveryFee / freeDelivery / taxRate applied.
 * This is the single source of truth used by checkout + order creation.
 */
export async function loadCountryCharges(): Promise<Record<string, CountryChargeConfig>> {
  const settings = await getVATDeliverySettings();
  const charges: Record<string, CountryChargeConfig> = {};

  for (const country of Object.values(COUNTRY_CONFIG)) {
    const cs = settings.countries[country.code];
    charges[country.code] = {
      minOrder: country.minOrder,
      deliveryFee: cs?.deliveryFee ?? country.deliveryFee,
      freeDelivery: cs?.freeDelivery ?? country.freeDelivery,
      taxRate: (cs?.vatPercent ?? country.taxRate * 100) / 100,
    };
  }

  return charges;
}
