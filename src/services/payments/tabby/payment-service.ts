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

  private cleanPhone(phone: string | undefined): string {
    if (!phone) return "";
    // Tabby requires the country code for Kuwait/KSA, so we must not strip it.
    // The route.ts already formats it with the correct prefix (e.g. +965...)
    return phone;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };
  }

  async createSession(params: TabbySessionRequest): Promise<TabbySession> {
    const decimals = ["BHD", "KWD", "OMR"].includes(params.currency.toUpperCase()) ? 3 : 2;
    
    // 1. Phone Cleaning
    if (params.buyer) {
      params.buyer.phone = this.cleanPhone(params.buyer.phone);
    }
    if (params.shippingAddress) {
      // TabbyShippingAddress doesn't support phone field in its schema
    }

    // 2. Currency Validation
    const regionToCurrency: Record<TabbyRegion, string> = {
      UAE: "AED",
      KSA: "SAR",
      Kuwait: "KWD",
    };
    const expectedCurrency = regionToCurrency[this.region];
    if (expectedCurrency && params.currency !== expectedCurrency) {
        console.warn(`[Tabby] Currency mismatch: expected ${expectedCurrency} for region ${this.region}, but got ${params.currency}. Correcting...`);
        params.currency = expectedCurrency as any;
    }

    // 3. Math Check: Ensure top-level amount matches sum of items + shipping + tax - discount
    const itemsTotal = params.items.reduce((acc, item) => acc + (Number(item.unitPrice) * item.quantity), 0);
    const shippingAmt = params.shippingAmount || 0;
    const taxAmt = params.taxAmount || 0;
    const discountAmt = params.discountAmount || 0;
    const calculatedAmount = Number((itemsTotal + shippingAmt + taxAmt - discountAmt).toFixed(decimals));

    // For 3-decimal currencies like KWD, even 0.005 difference causes Tabby API rejection.
    // We strictly enforce the calculated amount.
    if (params.amount !== calculatedAmount) {
      console.warn(`[Tabby] Math mismatch: amount ${params.amount} vs calculated ${calculatedAmount}. Using calculated.`);
      params.amount = calculatedAmount;
    }

    const buyerPayload: Record<string, any> = { ...params.buyer };
    if (params.buyer?.registered_since) buyerPayload.registered_since = params.buyer.registered_since;
    if (typeof params.buyer?.loyalty_level === "number") buyerPayload.loyalty_level = params.buyer.loyalty_level;

    const response = await fetch(`${this.baseUrl}/api/v2/checkout`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        payment: {
          amount: params.amount.toFixed(decimals),
          currency: params.currency,
          description: params.description || `Order ${params.orderId}`,
          buyer: buyerPayload,
          buyer_history: params.order_history && params.order_history.length > 0
            ? { registered_since: params.buyer?.registered_since, loyalty_level: params.buyer?.loyalty_level ?? 0, orders_count: params.order_history.length }
            : undefined,
          order_history: params.order_history ?? [],
          shipping_address: params.shippingAddress,
          order: {
            tax_amount: taxAmt.toFixed(decimals),
            shipping_amount: shippingAmt.toFixed(decimals),
            discount_amount: discountAmt.toFixed(decimals),
            reference_id: params.orderReferenceId,
            items: params.items.map(item => ({
              title: item.title,
              quantity: item.quantity,
              unit_price: Number(item.unitPrice).toFixed(decimals),
              image_url: item.imageUrl,
              category: item.category && item.category !== "General" ? item.category : "Unclassified",
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
          success: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?order_id=${params.orderId}&payment=tabby`,
          cancel: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL}/checkout/payment/${params.orderId}?status=cancel&orderId=${params.orderId}&canceled=tabby`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL}/checkout/payment/${params.orderId}?status=reject&orderId=${params.orderId}&rejected=tabby`,
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

  async refundPayment(paymentId: string, amount: number, currency: TabbyCurrency): Promise<any> {
    const decimals = ["BHD", "KWD", "OMR"].includes(currency.toUpperCase()) ? 3 : 2;
    const response = await fetch(`${this.baseUrl}/api/v2/payments/${paymentId}/refunds`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        amount: amount.toFixed(decimals),
        currency,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: `Status ${response.status}` }));
      throw new Error(err.message || `Tabby refund failed: ${response.status}`);
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
