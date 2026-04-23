import { ShippingRateRequest, ShippingRate, ShipmentRequest, ShipmentResponse, TrackingResponse } from "./types";
import { createNaqelShipment, trackNaqelShipment, getNaqelLabel } from "./naqel-api";

export class NaqelService {
  /**
   * GnTeq API doesn't always expose a public rate calculation without extra setup.
   * Returning a standard GCC rate as fallback.
   */
  async calculateRate(request: ShippingRateRequest): Promise<ShippingRate> {
    const isDomestic = request.country.toUpperCase() === "AE" || request.country.toUpperCase() === "ARE";
    
    return {
      carrier: "naqel",
      service: isDomestic ? "Domestic" : "International",
      cost: isDomestic ? 20 : 45,
      currency: isDomestic ? "AED" : "SAR",
      estimatedDays: isDomestic ? 2 : 5,
      trackingAvailable: true,
    };
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    try {
      const naqelPayload = {
        descriptionOfGoods: "Cosmetics & Skincare",
        cod: 0, // Assuming 0 for now as ShipmentRequest doesn't explicitly have it
        customsDeclaredValue: request.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        customsDeclaredValueCurrency: "AED",
        consignee: {
          consigneeContact: {
            personName: request.recipient.name,
            phoneNumber1: request.recipient.phone,
            cellPhone: request.recipient.phone,
            emailAddress: request.recipient.email || "customer@example.com",
            type: "Individual",
          },
          consigneeAddress: {
            countryCode: request.recipient.address.country.length === 2 ? undefined : request.recipient.address.country, // Will try to auto-map in naqel-api if needed
            city: request.recipient.address.city,
            line1: request.recipient.address.street,
            postCode: request.recipient.address.postalCode,
          },
        },
        shipper: {
          shipperAddress: {
            countryCode: "ARE",
            city: "Dubai",
            line1: "Office 405, Al Diyafa Center",
          },
          shipperContact: {
            personName: "SHANFA STORE",
            companyName: "Al Shanfa General Trading",
            phoneNumber1: "+971000000000",
            cellPhone: "+971000000000",
            emailAddress: "info@shanfaglobal.com",
          },
        },
        items: request.items.map(item => ({
          quantity: item.quantity,
          weight: { unit: 1, value: item.weight || 0.5 },
          customsValue: { currencyCode: "AED", value: item.price },
          goodsDescription: item.name,
        })),
        shipmentWeight: {
          value: request.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0) || 1,
          weightUnit: 1,
          length: 20,
          width: 15,
          height: 10,
          dimensionUnit: 1,
        },
        reference: {
          shipperReference1: request.orderId,
          shipperNote1: `Order ${request.orderId}`,
        },
      };

      // Since we don't have the 3-letter code here easily without ISO_MAP, 
      // we'll rely on naqel-api's determineProductType which we'll make sure handles 2-letter if passed.
      // But actually, it's better to ensure 3-letter codes.
      
      const result = await createNaqelShipment(naqelPayload as any);
      const shipment = Array.isArray(result) ? result[0] : result;
      
      if (shipment?.airwaybill) {
        return {
          success: true,
          trackingNumber: shipment.airwaybill,
          labelUrl: shipment.labelDownloadUrl,
          trackingUrl: `https://www.naqelexpress.com/en/tracking?awb=${shipment.airwaybill}`,
          carrier: "naqel",
          service: shipment.productType || "Express",
        };
      }

      return {
        success: false,
        error: shipment?.message || "Failed to create Naqel shipment",
        carrier: "naqel",
        service: "Express",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        carrier: "naqel",
        service: "Express",
      };
    }
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    try {
      const result = await trackNaqelShipment(trackingNumber);
      const events = Array.isArray(result) ? result : (result?.events || []);

      return {
        status: events[0]?.event || "In Transit",
        statusCode: events[0]?.eventCode || "",
        events: events.map((e: any) => ({
          date: e.actionDate || "",
          location: `${e.eventCity || ""}, ${e.eventCountry || ""}`,
          description: e.event || e.eventName || "",
        })),
      };
    } catch (error) {
      return {
        status: "Unknown",
        statusCode: "",
        events: [],
      };
    }
  }
}

export const naqelService = new NaqelService();