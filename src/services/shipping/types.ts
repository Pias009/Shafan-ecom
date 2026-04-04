export interface ShippingRateRequest {
  country: string;
  city: string;
  weight: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ShippingRate {
  carrier: string;
  service: string;
  cost: number;
  currency: string;
  estimatedDays: number;
  trackingAvailable: boolean;
}

export interface ShipmentRequest {
  orderId: string;
  recipient: {
    name: string;
    phone: string;
    email?: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  items: {
    name: string;
    sku: string;
    quantity: number;
    weight: number;
    price: number;
  }[];
}

export interface ShipmentResponse {
  success: boolean;
  trackingNumber?: string;
  labelUrl?: string;
  trackingUrl?: string;
  carrier: string;
  service: string;
  estimatedDelivery?: string;
  labelPdf?: string;
  commercialInvoice?: string;
  error?: string;
}

export interface TrackingResponse {
  status: string;
  statusCode: string;
  events: {
    date: string;
    location: string;
    description: string;
  }[];
}

export type CarrierType = 'aramex' | 'naqel';