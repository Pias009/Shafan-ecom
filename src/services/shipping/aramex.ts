import { ShippingRateRequest, ShippingRate, ShipmentRequest, ShipmentResponse, TrackingResponse } from "./types";

const ARAMEX_API_URL = "https://ws.aramex.net";

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
    this.config = {
      accountNumber: process.env.ARAMEX_ACCOUNT_NUMBER || "",
      userName: process.env.ARAMEX_USER_NAME || "",
      password: process.env.ARAMEX_PASSWORD || "",
      accountPin: process.env.ARAMEX_ACCOUNT_PIN || "",
    };
    this.shipper = {
      name: process.env.ARAMEX_SHIPPER_NAME || "Your Store Name",
      phone: process.env.ARAMEX_SHIPPER_PHONE || "",
      email: process.env.ARAMEX_SHIPPER_EMAIL || "",
      address: {
        line1: process.env.ARAMEX_SHIPPER_ADDRESS || "",
        city: process.env.ARAMEX_SHIPPER_CITY || "Dubai",
        country: process.env.ARAMEX_SHIPPER_COUNTRY || "AE",
      },
    };
  }

  private getClientInfo() {
    return {
      UserName: this.config.userName,
      Password: this.config.password,
      AccountNumber: this.config.accountNumber,
      AccountPin: this.config.accountPin,
    };
  }

  async calculateRate(request: ShippingRateRequest): Promise<ShippingRate> {
    const response = await fetch(`${ARAMEX_API_URL}/shippingapi/shippingcalculator/service_1_0.svc/json/CalculateRate`, {
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
          ProductType: "Express",
          PaymentType: "Prepaid",
          Weight: {
            Unit: "kg",
            Value: Math.max(request.weight, 0.5),
          },
        },
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

    throw new Error(data.error?.message || "Failed to calculate rate");
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    const response = await fetch(`${ARAMEX_API_URL}/shippingapi/shippingcalculator/service_1_0.svc/json/CreateShipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ClientInfo: this.getClientInfo(),
        Shipment: {
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
          PaymentType: "Prepaid",
          ProductType: "Express",
          Items: request.items.map((item) => ({
            Description: item.name,
            SKU: item.sku,
            Quantity: item.quantity,
            UnitWeight: { Value: item.weight / item.quantity, Unit: "kg" },
            UnitPrice: { Value: item.price, CurrencyCode: "AED" },
          })),
        },
      }),
    });

    const data = await response.json();

    if (data.Shipments && data.Shipments[0]) {
      return {
        success: true,
        trackingNumber: data.Shipments[0].ID,
        labelUrl: data.Shipments[0].LabelURL,
        carrier: "aramex",
        service: "Express",
        estimatedDelivery: data.Shipments[0].ExpectedDeliveryDate,
      };
    }

    return {
      success: false,
      error: data.error?.message || "Failed to create shipment",
      carrier: "aramex",
      service: "Express",
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    const response = await fetch(`${ARAMEX_API_URL}/shippingapi/shippingcalculator/service_1_0.svc/json/TrackShipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ClientInfo: this.getClientInfo(),
        ShipmentNumber: trackingNumber,
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