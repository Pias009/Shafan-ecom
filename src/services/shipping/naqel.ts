import { ShippingRateRequest, ShippingRate, ShipmentRequest, ShipmentResponse, TrackingResponse } from "./types";

const NAQEL_API_URL = "https://infotrack.naqelexpress.com/NaqelAPIServices/NaqelAPIDemo/9.0/XMLShippingService.asmx";

interface NaqelConfig {
  userName: string;
  password: string;
  apiKey: string;
}

export class NaqelService {
  private config: NaqelConfig;
  private shipper: {
    name: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };

  constructor() {
    this.config = {
      userName: process.env.NAQEL_USER_NAME || "",
      password: process.env.NAQEL_PASSWORD || "",
      apiKey: process.env.NAQEL_API_KEY || "",
    };
    this.shipper = {
      name: process.env.NAQEL_SHIPPER_NAME || "Your Store Name",
      phone: process.env.NAQEL_SHIPPER_PHONE || "",
      address: process.env.NAQEL_SHIPPER_ADDRESS || "",
      city: process.env.NAQEL_SHIPPER_CITY || "Riyadh",
      country: process.env.NAQEL_SHIPPER_COUNTRY || "SA",
    };
  }

  private async soapRequest(action: string, body: string): Promise<any> {
    const response = await fetch(NAQEL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": `http://tempuri.org/${action}`,
      },
      body: body,
    });

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    return xml;
  }

  async calculateRate(request: ShippingRateRequest): Promise<ShippingRate> {
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        xmlns:q1="http://tempuri.org/">
        <soap:Body>
          <q1:CalculateRate>
            <q1:RateRequest>
              <q1:UserName>${this.config.userName}</q1:UserName>
              <q1:Password>${this.config.password}</q1:Password>
              <q1:Consignee>
                <q1:City>${request.city}</q1:City>
                <q1:CountryCode>${request.country}</q1:CountryCode>
              </q1:Consignee>
              <q1:Weight>${Math.max(request.weight, 0.5)}</q1:Weight>
              <q1:ServiceType>Express</q1:ServiceType>
            </q1:RateRequest>
          </q1:CalculateRate>
        </soap:Body>
      </soap:Envelope>`;

    const xml = await this.soapRequest("CalculateRate", xmlBody);
    const result = xml.getElementsByTagName("CalculateRateResult")[0];

    if (result) {
      const cost = parseFloat(result.getElementsByTagName("TotalAmount")[0]?.textContent || "0");
      const currency = result.getElementsByTagName("Currency")[0]?.textContent || "SAR";
      const days = result.getElementsByTagName("TransitDays")[0]?.textContent || "3";

      return {
        carrier: "naqel",
        service: "Express",
        cost,
        currency,
        estimatedDays: parseInt(days),
        trackingAvailable: true,
      };
    }

    throw new Error("Failed to calculate Naqel rate");
  }

  async createShipment(request: ShipmentRequest): Promise<ShipmentResponse> {
    const itemsXml = request.items.map(item => `
      <q1:Items>
        <q1:Description>${item.name}</q1:Description>
        <q1:SKU>${item.sku}</q1:SKU>
        <q1:Quantity>${item.quantity}</q1:Quantity>
        <q1:Weight>${item.weight}</q1:Weight>
        <q1:Value>${item.price}</q1:Value>
      </q1:Items>
    `).join("");

    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        xmlns:q1="http://tempuri.org/">
        <soap:Body>
          <q1:CreateShipment>
            <q1:ShipmentRequest>
              <q1:UserName>${this.config.userName}</q1:UserName>
              <q1:Password>${this.config.password}</q1:Password>
              <q1:ReferenceNumber>${request.orderId}</q1:ReferenceNumber>
              <q1:Shipper>
                <q1:Name>${this.shipper.name}</q1:Name>
                <q1:Phone>${this.shipper.phone}</q1:Phone>
                <q1:Address>${this.shipper.address}</q1:Address>
                <q1:City>${this.shipper.city}</q1:City>
                <q1:CountryCode>${this.shipper.country}</q1:CountryCode>
              </q1:Shipper>
              <q1:Consignee>
                <q1:Name>${request.recipient.name}</q1:Name>
                <q1:Phone>${request.recipient.phone}</q1:Phone>
                <q1:Address>${request.recipient.address.street}</q1:Address>
                <q1:City>${request.recipient.address.city}</q1:City>
                <q1:State>${request.recipient.address.state}</q1:State>
                <q1:CountryCode>${request.recipient.address.country}</q1:CountryCode>
                <q1:PostCode>${request.recipient.address.postalCode}</q1:PostCode>
              </q1:Consignee>
              <q1:ServiceType>Express</q1:ServiceType>
              ${itemsXml}
            </q1:ShipmentRequest>
          </q1:CreateShipment>
        </soap:Body>
      </soap:Envelope>`;

    const xml = await this.soapRequest("CreateShipment", xmlBody);
    const result = xml.getElementsByTagName("CreateShipmentResult")[0];

    if (result) {
      const trackingNumber = result.getElementsByTagName("ShipmentNo")[0]?.textContent;
      const labelUrl = result.getElementsByTagName("LabelURL")[0]?.textContent;
      const expectedDate = result.getElementsByTagName("ExpectedDate")[0]?.textContent;

      if (trackingNumber) {
        return {
          success: true,
          trackingNumber,
          labelUrl: labelUrl || undefined,
          carrier: "naqel",
          service: "Express",
          estimatedDelivery: expectedDate || undefined,
        };
      }
    }

    return {
      success: false,
      error: "Failed to create Naqel shipment",
      carrier: "naqel",
      service: "Express",
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResponse> {
    const xmlBody = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:xsd="http://www.w3.org/2001/XMLSchema"
        xmlns:q1="http://tempuri.org/">
        <soap:Body>
          <q1:TrackShipment>
            <q1:ShipmentNo>${trackingNumber}</q1:ShipmentNo>
            <q1:UserName>${this.config.userName}</q1:UserName>
            <q1:Password>${this.config.password}</q1:Password>
          </q1:TrackShipment>
        </soap:Body>
      </soap:Envelope>`;

    const xml = await this.soapRequest("TrackShipment", xmlBody);
    const result = xml.getElementsByTagName("TrackShipmentResult")[0];

    if (result) {
      const statusNode = result.getElementsByTagName("Status")[0];
      const eventsNodes = result.getElementsByTagName("Events")[0];

      const events: any[] = [];
      if (eventsNodes) {
        const eventList = eventsNodes.getElementsByTagName("Event");
        for (let i = 0; i < eventList.length; i++) {
          events.push({
            date: eventList[i].getElementsByTagName("Time")[0]?.textContent || "",
            location: eventList[i].getElementsByTagName("Location")[0]?.textContent || "",
            description: eventList[i].getElementsByTagName("Description")[0]?.textContent || "",
          });
        }
      }

      return {
        status: statusNode?.textContent || "Unknown",
        statusCode: statusNode?.getAttribute("Code") || "",
        events,
      };
    }

    return {
      status: "Unknown",
      statusCode: "",
      events: [],
    };
  }
}

export const naqelService = new NaqelService();