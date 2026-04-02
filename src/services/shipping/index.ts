import { ShippingRateRequest, ShippingRate, ShipmentRequest, ShipmentResponse, TrackingResponse, CarrierType } from "./types";
import { aramexService } from "./aramex";
import { naqelService } from "./naqel";

const CARRIER_COUNTRY_MAP: Record<string, CarrierType[]> = {
  AE: ["aramex", "naqel"],
  SA: ["naqel", "aramex"],
  KW: ["naqel", "aramex"],
  BH: ["aramex", "naqel"],
  OM: ["aramex", "naqel"],
  QA: ["aramex", "naqel"],
  EG: ["aramex"],
  JO: ["aramex"],
  LB: ["aramex"],
  IQ: ["naqel"],
};

const DEFAULT_CARRIERS: CarrierType[] = ["aramex", "naqel"];

export class ShippingService {
  async calculateRates(request: ShippingRateRequest): Promise<ShippingRate[]> {
    const countryCode = request.country.toUpperCase();
    const carriers = CARRIER_COUNTRY_MAP[countryCode] || DEFAULT_CARRIERS;
    const rates: ShippingRate[] = [];

    for (const carrier of carriers) {
      try {
        if (carrier === "aramex") {
          const rate = await aramexService.calculateRate(request);
          rates.push(rate);
        } else if (carrier === "naqel") {
          const rate = await naqelService.calculateRate(request);
          rates.push(rate);
        }
      } catch (error) {
        console.error(`Failed to get rate from ${carrier}:`, error);
      }
    }

    return rates.sort((a, b) => a.cost - b.cost);
  }

  async getCheapestRate(request: ShippingRateRequest): Promise<ShippingRate | null> {
    const rates = await this.calculateRates(request);
    return rates[0] || null;
  }

  async createShipment(carrier: CarrierType, request: ShipmentRequest): Promise<ShipmentResponse> {
    if (carrier === "aramex") {
      return aramexService.createShipment(request);
    } else if (carrier === "naqel") {
      return naqelService.createShipment(request);
    }
    return { success: false, error: "Invalid carrier", carrier, service: "" };
  }

  async trackShipment(carrier: CarrierType, trackingNumber: string): Promise<TrackingResponse> {
    if (carrier === "aramex") {
      return aramexService.trackShipment(trackingNumber);
    } else if (carrier === "naqel") {
      return naqelService.trackShipment(trackingNumber);
    }
    return { status: "Unknown", statusCode: "", events: [] };
  }

  getAvailableCarriers(country: string): CarrierType[] {
    return CARRIER_COUNTRY_MAP[country.toUpperCase()] || DEFAULT_CARRIERS;
  }
}

export const shippingService = new ShippingService();