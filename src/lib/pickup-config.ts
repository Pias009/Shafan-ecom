import { prisma } from "@/lib/prisma";
import { COUNTRY_CONFIG } from "@/lib/address-config";
import {
  computeReadyBy,
  DEFAULT_PICKUP_READY_DAYS,
  type CountryPickupSettings,
  type PickupDetails,
  type PickupLocation,
  type PickupSettings,
  type PublicPickupConfig,
} from "@/lib/pickup";

export const PICKUP_SETTINGS_TYPE = "pickup";

const DEFAULT_LOCATIONS: Record<string, PickupLocation[]> = {
  AE: [
    {
      id: "ae-satwa",
      name: "Shanfa Store — Al Diyafa",
      address: "Office 405, Al Diyafa Shopping Center, Satwa Roundabout",
      city: "Dubai",
      active: true,
    },
  ],
};

function toFiniteNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function buildDefaultPickupSettings(): PickupSettings {
  const countries: Record<string, CountryPickupSettings> = {};
  for (const country of Object.values(COUNTRY_CONFIG)) {
    countries[country.code] = {
      enabled: true,
      freeDelivery: true,
      pickupFee: 0,
      readyInDays: DEFAULT_PICKUP_READY_DAYS,
      instructions: "Please bring your order number and a valid ID when collecting your order.",
      locations: DEFAULT_LOCATIONS[country.code] || [],
    };
  }
  return { countries };
}

function sanitizeLocations(raw: unknown, countryCode: string): PickupLocation[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const locations: PickupLocation[] = [];
  raw.forEach((loc, index) => {
    if (!loc || typeof loc !== "object") return;
    const l = loc as Record<string, unknown>;
    const name = cleanString(l.name);
    const address = cleanString(l.address);
    if (!name || !address) return;
    let id = cleanString(l.id) || `${countryCode.toLowerCase()}-${index}-${Date.now().toString(36)}`;
    if (seen.has(id)) id = `${id}-${index}`;
    seen.add(id);
    locations.push({
      id,
      name,
      address,
      city: cleanString(l.city),
      phone: cleanString(l.phone),
      hours: cleanString(l.hours),
      mapUrl: cleanString(l.mapUrl),
      active: l.active !== false,
    });
  });
  return locations;
}

/**
 * Merge saved settings (from DB / admin form) over the defaults. Always
 * returns every country so consumers can rely on the full set.
 */
export function mergePickupSettings(saved: unknown): PickupSettings {
  const defaults = buildDefaultPickupSettings();
  const data = saved as { countries?: Record<string, Partial<CountryPickupSettings>> } | null;
  if (!data || typeof data !== "object" || !data.countries) return defaults;

  const merged: Record<string, CountryPickupSettings> = { ...defaults.countries };
  for (const code of Object.keys(merged)) {
    const override = data.countries[code];
    if (!override) continue;
    const base = merged[code];
    merged[code] = {
      enabled: typeof override.enabled === "boolean" ? override.enabled : base.enabled,
      freeDelivery: typeof override.freeDelivery === "boolean" ? override.freeDelivery : base.freeDelivery,
      pickupFee: Math.max(0, toFiniteNumber(override.pickupFee, base.pickupFee)),
      readyInDays: Math.max(0, Math.round(toFiniteNumber(override.readyInDays, base.readyInDays))),
      instructions: typeof override.instructions === "string" ? override.instructions.trim() : base.instructions,
      locations: Array.isArray(override.locations) ? sanitizeLocations(override.locations, code) : base.locations,
    };
  }
  return { countries: merged };
}

/** Read persisted settings from AppSettings, falling back to defaults. */
export async function getPickupSettings(): Promise<PickupSettings> {
  try {
    const row = await prisma.appSettings.findUnique({
      where: { type: PICKUP_SETTINGS_TYPE },
    });
    return mergePickupSettings(row?.data);
  } catch (error) {
    console.error("Failed to load pickup settings:", error);
    return buildDefaultPickupSettings();
  }
}

export function toPublicPickupConfig(settings: CountryPickupSettings | undefined): PublicPickupConfig {
  const locations = (settings?.locations || []).filter((l) => l.active);
  return {
    enabled: Boolean(settings?.enabled) && locations.length > 0,
    fee: settings?.freeDelivery ? 0 : settings?.pickupFee || 0,
    readyInDays: settings?.readyInDays ?? DEFAULT_PICKUP_READY_DAYS,
    instructions: settings?.instructions || undefined,
    locations,
  };
}

/**
 * Resolve a customer's pickup choice for checkout. Returns the fee to charge
 * and the snapshot to store on the order, or an error message.
 */
export async function resolvePickupSelection(
  countryCode: string,
  locationId: unknown
): Promise<{ ok: true; fee: number; details: PickupDetails } | { ok: false; error: string }> {
  const settings = await getPickupSettings();
  const config = toPublicPickupConfig(settings.countries[countryCode.toUpperCase()]);
  if (!config.enabled) {
    return { ok: false, error: "Store pickup is not available in your country. Please choose delivery." };
  }
  const location = config.locations.find((l) => l.id === locationId);
  if (!location) {
    return { ok: false, error: "Please choose a valid pickup location." };
  }
  return {
    ok: true,
    fee: config.fee,
    details: {
      locationId: location.id,
      name: location.name,
      address: location.address,
      city: location.city,
      phone: location.phone,
      hours: location.hours,
      mapUrl: location.mapUrl,
      instructions: config.instructions,
      readyInDays: config.readyInDays,
      readyBy: computeReadyBy(config.readyInDays).toISOString(),
    },
  };
}
