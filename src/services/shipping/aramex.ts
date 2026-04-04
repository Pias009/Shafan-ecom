import { ShippingRateRequest, ShippingRate, ShipmentRequest, ShipmentResponse, TrackingResponse } from "./types";

const ARAMEX_API_URL = process.env.ARAMEX_API_URL || "https://ws.aramex.net";
const ARAMEX_USE_DEV = process.env.ARAMEX_USE_DEV === "true" || false;

interface AramexConfig {
  accountNumber: string;
  userName: string;
  password: string;
  accountPin: string;
  accountEntity: string;
  accountCountryCode: string;
}

interface AramexConfig {
  accountNumber: string;
  userName: string;
  password: string;
  accountPin: string;
}

export class AramexService {
  private config: AramexConfig;
  private shipper: {
    name: string;
    phone: string;
    email: string;
    address: {
      line1: string;
      city: string;
      country: string;
    };
  };

  constructor() {
    const useDev = process.env.ARAMEX_USE_DEV === "true";
    const baseUrl = useDev ? "https://ws.dev.aramex.net" : "https://ws.aramex.net";
    
    this.config = {
      accountNumber: process.env.ARAMEX_ACCOUNTNO || process.env.ARAMEX_ACCOUNT_NUMBER || "",
      userName: process.env.ARAMEX_USER || process.env.ARAMEX_USER_NAME || "",
      password: process.env.ARAMEX_PASSWORD || "",
      accountPin: process.env.ARAMEX_ACCOUNTPIN || process.env.ARAMEX_ACCOUNT_PIN || "",
      accountEntity: process.env.ARAMEX_ENTITY || "DXB",
      accountCountryCode: process.env.ARAMEX_COUNTRYCODE || "AE",
    };
    this.shipper = {
      name: process.env.ARAMEX_SHIPPER_NAME || "Shafan Store",
      phone: process.env.ARAMEX_SHIPPER_PHONE || "",
      email: process.env.ARAMEX_SHIPPER_EMAIL || "",
      address: {
        line1: process.env.ARAMEX_SHIPPER_ADDRESS || "",
        city: process.env.ARAMEX_SHIPPER_CITY || useDev ? "Dubai" : "Dubai",
        country: process.env.ARAMEX_COUNTRYCODE || "AE",
      },
    };
  }

  private getClientInfo() {
    return {
      UserName: this.config.userName,
      Password: this.config.password,
      AccountNumber: this.config.accountNumber,
      AccountPin: this.config.accountPin,
      AccountEntity: this.config.accountEntity,
      AccountCountryCode: this.config.accountCountryCode,
      Source: 0,
      PreferredLanguageCode: null,
    };
  }

  private getApiUrl(service: string): string {
    const useDev = process.env.ARAMEX_USE_DEV === "true";
    const baseUrl = useDev ? "https://ws.dev.aramex.net" : "https://ws.aramex.net";
    return `${baseUrl}/ShippingAPI.V2/${service}/Service_1_0.svc/json`;
  }

  async calculateRate(request: ShippingRateRequest): Promise<ShippingRate> {
    const response = await fetch(this.getApiUrl("RateCalculator") + "/CalculateRate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ClientInfo: this.getClientInfo(),
        OriginAddress: {
          Line1: this.shipper.address.line1,
          City: this.shipper.address.city,
          CountryCode: this.shipper.address.country,
        },
        DestinationAddress: {
          City: request.city,
          CountryCode: request.country,
        },
        ShipmentDetails: {
          ProductGroup: "EXP",
          ProductType: "EPX",
          PaymentType: "P",
          ActualWeight: {
            Unit: "KG",
            Value: Math.max(request.weight, 0.5),
          },
          NumberOfPieces: 1,
        },
        PreferredCurrencyCode: "AED",
      }),
    });

    const data = await response.json();
    
    if (data.RateResponse && data.RateResponse.TotalAmount) {
      return {
        carrier: "aramex",
        service: "Express",
        cost: parseFloat(data.RateResponse.TotalAmount.Value),
        currency: data.RateResponse.TotalAmount.CurrencyCode || "AED",
        estimatedDays: data.RateResponse.TransitDays || 3,
        trackingAvailable: true,
      };
    }

    const errMsg = data.error?.message || data.Notifications?.[0]?.Message || "Failed to calculate rate";
    throw new Error(errMsg);
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    const response = await fetch(this.getApiUrl("Shipping") + "/CreateShipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ClientInfo: this.getClientInfo(),
        Shipments: [{
          Reference1: request.orderId,
          Shipper: {
            Name: this.shipper.name,
            Phone: this.shipper.phone,
            Email: this.shipper.email,
            Address: {
              Line1: this.shipper.address.line1,
              City: this.shipper.address.city,
              CountryCode: this.shipper.address.country,
            },
          },
          Consignee: {
            Name: request.recipient.name,
            Phone: request.recipient.phone,
            Email: request.recipient.email,
            Address: {
              Line1: request.recipient.address.street,
              City: request.recipient.address.city,
              State: request.recipient.address.state,
              CountryCode: request.recipient.address.country,
              PostCode: request.recipient.address.postalCode,
            },
          },
          PaymentType: "P",
          ProductGroup: "EXP",
          ProductType: "EPX",
          Items: request.items.map((item) => ({
            Description: item.name,
            SKU: item.sku,
            Quantity: item.quantity,
            UnitWeight: { Value: item.weight / item.quantity, Unit: "KG" },
            UnitPrice: { Value: item.price, CurrencyCode: "AED" },
          })),
        }],
      }),
    });

    const data = await response.json();

    if (data.Shipments && data.Shipments[0]) {
      const shipment = data.Shipments[0];
      return {
        success: true,
        trackingNumber: shipment.ID,
        labelUrl: shipment.LabelURL,
        trackingUrl: `https://www.aramex.com/track/${shipment.ID}`,
        carrier: "aramex",
        service: "Express",
        estimatedDelivery: shipment.ExpectedDeliveryDate,
      };
    }

    // Check for errors in notifications
    const errorMsg = data.Notifications?.[0]?.Message || data.error?.message || "Failed to create shipment";
    return {
      success: false,
      error: errorMsg,
      carrier: "aramex",
      service: "Express",
    };
  }

  async printLabel(trackingNumber: string): Promise<{ labelUrl: string }> {
    const response = await fetch(this.getApiUrl("Shipping") + "/PrintLabel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ClientInfo: this.getClientInfo(),
        LabelInfo: {
          ReportID: 9729,
          ReportType: "URL",
        },
        OriginEntity: process.env.ARAMEX_ENTITY || "DXB",
        ProductGroup: "EXP",
        ShipmentNumber: trackingNumber,
      }),
    });

    const data = await response.json();
    
    if (data.LabelURL) {
      return { labelUrl: data.LabelURL };
    }
    
    throw new Error(data.Notifications?.[0]?.Message || "Failed to print label");
  }

  async getCommercialInvoice(trackingNumber: string): Promise<{ invoiceUrl: string }> {
    const response = await fetch(this.getApiUrl("Shipping") + "/PrintLabel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ClientInfo: this.getClientInfo(),
        LabelInfo: {
          ReportID: 9724, // Commercial Invoice report
          ReportType: "URL",
        },
        OriginEntity: process.env.ARAMEX_ENTITY || "DXB",
        ProductGroup: "EXP",
        ShipmentNumber: trackingNumber,
      }),
    });

    const data = await response.json();
    
    if (data.LabelURL) {
      return { invoiceUrl: data.LabelURL };
    }
    
    throw new Error(data.Notifications?.[0]?.Message || "Failed to get invoice");
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    const response = await fetch(this.getApiUrl("Shipping") + "/TrackShipments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ClientInfo: this.getClientInfo(),
        Shipments: [trackingNumber],
      }),
    });

    const data = await response.json();

    if (data.TrackingResult) {
      return {
        status: data.TrackingResult.CurrentStatus || "Unknown",
        statusCode: data.TrackingResult.StatusCode || "",
        events: (data.TrackingResult.Events || []).map((event: { Time: string; Location: string; Description: string }) => ({
          date: event.Time,
          location: event.Location,
          description: event.Description,
        })),
      };
    }

    return {
      status: "Unknown",
      statusCode: "",
      events: [],
    };
  }
}

export const aramexService = new AramexService();