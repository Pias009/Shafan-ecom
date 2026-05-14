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
  /** ISO 8601 date string for account registration (Tabby pre-scoring) */
  registered_since?: string;
  /** Number of completed orders (Tabby pre-scoring) */
  loyalty_level?: number;
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

export interface TabbyOrderHistoryEntry {
  purchased_at: string;
  amount: string;
  currency: string;
  payment_method: string;
  status: string;
  buyer: {
    email: string;
    phone: string;
    name: string;
  };
  order: {
    reference_id: string;
    items: { title: string; quantity: number; unit_price: string }[];
  };
  shipping_address: {
    city: string;
    address: string;
    zip: string;
  };
}

export interface TabbySession {
  id: string;
  status: TabbySessionStatus;
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
  web_url: string;
  configuration: {
    available_products: Record<string, any>;
  };
  rejection_reason_code?: string;
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
    order?: {
      reference_id?: string;
    };
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
  /** Up to 10 past orders for Tabby pre-scoring */
  order_history?: TabbyOrderHistoryEntry[];
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  metadata?: Record<string, string>;
  merchant_urls?: {
    success: string;
    cancel: string;
    failure: string;
  };
}
