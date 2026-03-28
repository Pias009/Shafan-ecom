import { TabbySession, TabbyPayment, TabbyWebhookPayload, TabbyRegion, TabbyCurrency } from "./types";

const TABBY_API_BASE_URLS: Record<TabbyRegion, string> = {
  UAE: "https://api.tabby.ai",
  KSA: "https://api.tabby.sa",
  Kuwait: "https://api.tabby.ai",
};

const TABBY_CHECKOUT_URLS: Record<TabbyRegion, string> = {
  UAE: "https://checkout.tabby.ai",
  KSA: "https://checkout.tabby.sa",
  Kuwait: "https://checkout.tabby.ai",
};

export class TabbyService {
  private apiKey: string;
  private merchantCode: string;
  private region: TabbyRegion;
  private baseUrl: string;

  constructor(region: TabbyRegion = "UAE") {
    this.apiKey = process.env.TABBY_API_KEY || "";
    this.merchantCode = process.env.TABBY_MERCHANT_CODE || "";
    this.region = region;
    this.baseUrl = TABBY_API_BASE_URLS[region];
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
  }

  async createSession(params: {
    amount: number;
    currency: TabbyCurrency;
    orderId: string;
    orderReferenceId: string;
    description?: string;
    buyer: {
      email: string;
      phone?: string;
      name?: string;
    };
    shippingAddress?: {
      address?: string;
      city?: string;
      zip?: string;
    };
    items: Array<{
      title: string;
      description?: string;
      quantity: number;
      unitPrice: string;
      imageUrl?: string;
      category?: string;
    }>;
    metadata?: Record<string, string>;
  }): Promise<TabbySession> {
    const response = await fetch(`${this.baseUrl}/api/v2/checkout`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        payment: {
          amount: params.amount.toString(),
          currency: params.currency,
          description: params.description || `Order ${params.orderId}`,
          buyer: params.buyer,
          shipping_address: params.shippingAddress,
          items: params.items,
          metadata: {
            order_id: params.orderId,
            ...params.metadata,
          },
        },
        merchant_code: this.merchantCode,
        merchant_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?order_id=${params.orderId}&payment=tabby`,
          cancel: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/payment/${params.orderId}?canceled=tabby`,
          rejection: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/payment/${params.orderId}?rejected=tabby`,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tabby session creation failed: ${response.status}`);
    }

    return response.json();
  }

  async getPayment(paymentId: string): Promise<TabbyPayment> {
    const response = await fetch(`${this.baseUrl}/api/v2/payments/${paymentId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tabby payment fetch failed: ${response.status}`);
    }

    return response.json();
  }

  async capturePayment(paymentId: string, amount: number, currency: TabbyCurrency): Promise<TabbyPayment> {
    const response = await fetch(`${this.baseUrl}/api/v2/payments/${paymentId}/captures`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        amount: amount.toString(),
        currency,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tabby capture failed: ${response.status}`);
    }

    return response.json();
  }

  async voidPayment(paymentId: string): Promise<TabbyPayment> {
    const response = await fetch(`${this.baseUrl}/api/v2/payments/${paymentId}/close`, {
      method: "POST",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tabby void failed: ${response.status}`);
    }

    return response.json();
  }

  verifyWebhook(payload: string, signature: string): TabbyWebhookPayload {
    const webhookSecret = process.env.TABBY_WEBHOOK_SECRET || "";
    
    if (webhookSecret && signature) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createHmac } = require("crypto");
      const expectedSignature = createHmac("sha256", webhookSecret)
        .update(payload)
        .digest("hex");
      
      if (signature !== expectedSignature) {
        throw new Error("Invalid Tabby webhook signature");
      }
    }

    return JSON.parse(payload);
  }

  getCheckoutUrl(): string {
    return TABBY_CHECKOUT_URLS[this.region];
  }

  static getSupportedRegions(): TabbyRegion[] {
    return ["UAE", "KSA", "Kuwait"];
  }

  static getSupportedCurrencies(): Record<TabbyRegion, TabbyCurrency> {
    return {
      UAE: "AED",
      KSA: "SAR",
      Kuwait: "KWD",
    };
  }
}

export const tabbyService = new TabbyService();
