import { TabbySession, TabbyPayment, TabbyWebhookPayload, TabbyRegion, TabbyCurrency, TabbySessionRequest } from "./types";

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
    this.apiKey = (process.env.TABBY_API_KEY || "").trim();
    this.merchantCode = (process.env.TABBY_MERCHANT_CODE || "").trim();
    this.region = region;
    this.baseUrl = TABBY_API_BASE_URLS[region];
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
  }

  async createSession(params: TabbySessionRequest): Promise<TabbySession> {
    const response = await fetch(`${this.baseUrl}/api/v2/checkout`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        payment: {
          amount: params.amount.toFixed(["BHD", "KWD", "OMR"].includes(params.currency.toUpperCase()) ? 3 : 2),
          currency: params.currency,
          description: params.description || `Order ${params.orderId}`,
          buyer: params.buyer,
          shipping_address: params.shippingAddress,
          order: {
            tax_amount: params.taxAmount ? params.taxAmount.toFixed(["BHD", "KWD", "OMR"].includes(params.currency.toUpperCase()) ? 3 : 2) : "0.00",
            shipping_amount: params.shippingAmount ? params.shippingAmount.toFixed(["BHD", "KWD", "OMR"].includes(params.currency.toUpperCase()) ? 3 : 2) : "0.00",
            discount_amount: params.discountAmount ? params.discountAmount.toFixed(["BHD", "KWD", "OMR"].includes(params.currency.toUpperCase()) ? 3 : 2) : "0.00",
            reference_id: params.orderReferenceId,
            items: params.items.map(item => ({
              title: item.title,
              quantity: item.quantity,
              unit_price: item.unitPrice,
              image_url: item.imageUrl,
              category: item.category || "General",
            })),
          },
          metadata: {
            order_id: params.orderId,
            ...params.metadata,
          },
        },
        lang: "en",
        merchant_code: this.merchantCode,
        merchant_urls: params.merchant_urls || {
          success: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.shanfaglobal.com"}/checkout/success?order_id=${params.orderId}&payment=tabby`,
          cancel: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.shanfaglobal.com"}/checkout/payment/${params.orderId}?canceled=tabby`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.shanfaglobal.com"}/checkout/payment/${params.orderId}?rejected=tabby`,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      console.error("Tabby API FULL Error Response:", JSON.stringify(errorData, null, 2));
      
      const msg = errorData.message || errorData.error || (errorData.errors && JSON.stringify(errorData.errors)) || `Status: ${response.status}`;
      throw new Error(`Tabby Rejection: ${msg}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error("Tabby API returned an invalid response structure.");
    }
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
