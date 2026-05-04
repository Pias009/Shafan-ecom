export type TamaraRegion = "UAE" | "SAU";
export type TamaraCurrency = "AED" | "SAR";

export type TamaraPaymentStatus = 
  | "initiated"
  | "pending"
  | "approved"
  | "declined"
  | "captured"
  | "refunded"
  | "cancelled";

export interface TamaraBuyer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** ISO 3166-1 alpha-2 */
  country?: string;
}

export interface TamaraAddress {
  firstName: string;
  lastName: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postcode?: string;
  country: string;
  phone?: string;
}

export interface TamaraItem {
  sku: string;
  name: string;
  type: "physical" | "digital";
  unitPrice: { amount: string; currency: TamaraCurrency };
  quantity: number;
  description?: string;
  imageUrl?: string;
  productUrl?: string;
}

export type TamaraShippingAddress = TamaraAddress;

export interface TamaraSessionRequest {
  orderReferenceId: string;
  description?: string;
  billingAddress: TamaraAddress;
  shippingAddress: TamaraAddress;
  items: TamaraItem[];
  consumer: TamaraBuyer;
  currency: TamaraCurrency;
  locale?: "en-US" | "ar-SA";
  paymentType?: "pay_later" | "pay_now" | "pay_later_with installments";
  isMobile?: boolean;
  discount?: { amount: string; currency: TamaraCurrency; name?: string };
  taxAmount?: { amount: string; currency: TamaraCurrency };
  shippingAmount?: { amount: string; currency: TamaraCurrency };
  totalAmount: { amount: string; currency: TamaraCurrency };
  merchantUrls?: {
    success: string;
    cancel: string;
    failure: string;
    notification?: string;
  };
}

export interface TamaraSessionResponse {
  checkout_id: string;
  checkout_url: string;
  status: string;
  order_id?: string;
}

export interface TamaraWebhookPayload {
  eventType: string;
  eventDate: string;
  orderId: string;
  orderReferenceId: string;
  status: TamaraPaymentStatus;
  paymentType?: string;
  amount?: { amount: string; currency: TamaraCurrency };
  refundedAmount?: { amount: string; currency: TamaraCurrency };
  capturedAmount?: { amount: string; currency: TamaraCurrency };
  declineReason?: {
    code: string;
    description: string;
  };
}

export interface TamaraCaptureRequest {
  orderId: string;
  totalAmount: { amount: string; currency: TamaraCurrency };
  shippingInfo?: {
    shipping_company: string;
    tracking_number: string;
    tracking_url?: string;
  };
  taxAmount?: { amount: string; currency: TamaraCurrency };
  shippingAmount?: { amount: string; currency: TamaraCurrency };
}

export interface TamaraRefundRequest {
  orderId: string;
  totalAmount: { amount: string; currency: TamaraCurrency };
  comment?: string;
}
