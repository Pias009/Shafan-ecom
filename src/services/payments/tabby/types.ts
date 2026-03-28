export type TabbyRegion = "UAE" | "KSA" | "Kuwait";
export type TabbyCurrency = "AED" | "SAR" | "KWD";

export type TabbyPaymentStatus = 
  | "PENDING" 
  | "APPROVED" 
  | "REJECTED" 
  | "EXPIRED" 
  | "AUTHORIZED" 
  | "CAPTURED" 
  | "CLOSED" 
  | "VOIDED";

export type TabbySessionStatus = 
  | "PENDING" 
  | "APPROVED" 
  | "REJECTED" 
  | "EXPIRED";

export interface TabbyBuyer {
  email: string;
  phone?: string;
  name?: string;
  dob?: string;
}

export interface TabbyShippingAddress {
  address?: string;
  city?: string;
  zip?: string;
}

export interface TabbyItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: string;
  imageUrl?: string;
  category?: string;
}

export interface TabbySession {
  session: {
    id: string;
    status: TabbySessionStatus;
    created: string;
    updated: string;
  };
  payment: {
    id: string;
    status: TabbyPaymentStatus;
    amount: string;
    currency: TabbyCurrency;
    description: string;
    created: string;
    updated: string;
    expires: string;
  };
  webUrl: string;
  configuration: {
    availableProducts: Array<{
      type: "installments" | "pay_later";
      minAmount?: number;
      maxAmount?: number;
      plans?: Array<{
        tenure: number;
        label: string;
        description: string;
      }>;
    }>;
  };
}

export interface TabbyPayment {
  id: string;
  status: TabbyPaymentStatus;
  amount: string;
  currency: TabbyCurrency;
  description: string;
  created: string;
  updated: string;
  expires: string;
  order: {
    id: string;
    items: TabbyItem[];
    shippingAddress?: TabbyShippingAddress;
  };
  customer: TabbyBuyer;
  webhookEvents?: Array<{
    type: string;
    created: string;
  }>;
}

export interface TabbyWebhookPayload {
  event: {
    type: string;
    created: string;
  };
  payload: {
    id: string;
    status: TabbyPaymentStatus;
    amount: string;
    currency: TabbyCurrency;
    order_id?: string;
    payment_id?: string;
    type?: string;
  };
}

export interface TabbySessionRequest {
  amount: number;
  currency: TabbyCurrency;
  orderId: string;
  orderReferenceId: string;
  description?: string;
  buyer: TabbyBuyer;
  shippingAddress?: TabbyShippingAddress;
  items: TabbyItem[];
  metadata?: Record<string, string>;
}
