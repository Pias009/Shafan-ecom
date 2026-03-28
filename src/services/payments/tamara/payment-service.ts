import { TamaraSessionRequest, TamaraSessionResponse, TamaraWebhookPayload, TamaraCaptureRequest, TamaraRefundRequest, TamaraRegion } from "./types";

const TAMARA_API_URLS: Record<TamaraRegion, string> = {
  UAE: "https://api.tamara.co",
  SAU: "https://api.tamara.co",
};

const TAMARA_CHECKOUT_URL = "https://checkout.tamara.co";

export class TamaraService {
  private accessToken: string;
  private region: TamaraRegion;
  private baseUrl: string;

  constructor(region: TamaraRegion = "UAE") {
    this.accessToken = process.env.TAMARA_ACCESS_TOKEN || "";
    this.region = region;
    this.baseUrl = TAMARA_API_URLS[region];
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.accessToken}`,
      " Tamara-Version": "2024-01-01",
    };
  }

  async createSession(params: TamaraSessionRequest): Promise<TamaraSessionResponse> {
    const response = await fetch(`${this.baseUrl}/v2.0/checkouts`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        order_reference_id: params.orderReferenceId,
        description: params.description,
        country: params.billingAddress.country,
        locale: params.locale || "en-US",
        payment_type: params.paymentType || "pay_later",
        is_mobile: params.isMobile || false,
        products: params.items.map(item => ({
          sku: item.sku,
          name: item.name,
          type: item.type,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          description: item.description,
          image_url: item.imageUrl,
          product_url: item.productUrl,
        })),
        consumer: {
          first_name: params.consumer.firstName,
          last_name: params.consumer.lastName,
          email: params.consumer.email,
          phone_number: params.consumer.phone,
          ...(params.consumer.country && { country_code: params.consumer.country }),
        },
        billing_address: {
          first_name: params.billingAddress.firstName,
          last_name: params.billingAddress.lastName,
          address_line1: params.billingAddress.line1,
          address_line2: params.billingAddress.line2,
          city: params.billingAddress.city,
          region: params.billingAddress.region,
          postal_code: params.billingAddress.postcode,
          country_code: params.billingAddress.country,
          phone_number: params.billingAddress.phone,
        },
        shipping_address: {
          first_name: params.shippingAddress.firstName,
          last_name: params.shippingAddress.lastName,
          address_line1: params.shippingAddress.line1,
          address_line2: params.shippingAddress.line2,
          city: params.shippingAddress.city,
          region: params.shippingAddress.region,
          postal_code: params.shippingAddress.postcode,
          country_code: params.shippingAddress.country,
          phone_number: params.shippingAddress.phone,
        },
        ...(params.discount && { discount: params.discount }),
        ...(params.taxAmount && { tax_amount: params.taxAmount }),
        ...(params.shippingAmount && { shipping_amount: params.shippingAmount }),
        total_amount: params.totalAmount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.errors?.[0]?.message || `Tamara session creation failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.checkout_id,
      status: data.status,
      orderReferenceId: data.order_reference_id,
      checkoutUrl: data.checkout_url,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      amount: data.total_amount,
      consumer: {
        firstName: params.consumer.firstName,
        lastName: params.consumer.lastName,
        email: params.consumer.email,
        phone: params.consumer.phone,
        country: params.consumer.country,
      },
      billingAddress: params.billingAddress,
      shippingAddress: params.shippingAddress,
      items: params.items,
    };
  }

  async getSession(checkoutId: string): Promise<TamaraSessionResponse> {
    const response = await fetch(`${this.baseUrl}/v2.0/checkouts/${checkoutId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tamara session fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      id: data.checkout_id,
      status: data.status,
      orderReferenceId: data.order_reference_id,
      checkoutUrl: data.checkout_url,
      createdAt: data.created_at,
      expiresAt: data.expires_at,
      amount: data.total_amount,
      consumer: data.consumer,
      billingAddress: data.billing_address,
      shippingAddress: data.shipping_address,
      items: data.products,
    };
  }

  async capturePayment(params: TamaraCaptureRequest): Promise<TamaraWebhookPayload> {
    const response = await fetch(`${this.baseUrl}/v2.0/orders/${params.orderId}/captures`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        capture_amount: params.amount,
        tax_amount: params.taxAmount,
        shipping_amount: params.shippingAmount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tamara capture failed: ${response.status}`);
    }

    return response.json();
  }

  async refundPayment(params: TamaraRefundRequest): Promise<TamaraWebhookPayload> {
    const response = await fetch(`${this.baseUrl}/v2.0/orders/${params.orderId}/refunds`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        refund_amount: params.amount,
        comment: params.comment,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tamara refund failed: ${response.status}`);
    }

    return response.json();
  }

  async getOrder(orderId: string): Promise<TamaraWebhookPayload> {
    const response = await fetch(`${this.baseUrl}/v2.0/orders/${orderId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tamara order fetch failed: ${response.status}`);
    }

    return response.json();
  }

  verifyWebhook(payload: string, signature: string): TamaraWebhookPayload {
    const webhookToken = process.env.TAMARA_WEBHOOK_SECRET || "";
    
    if (webhookToken && signature) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createHmac } = require("crypto");
      const expectedSignature = createHmac("sha256", webhookToken)
        .update(payload)
        .digest("base64");
      
      if (signature !== expectedSignature) {
        throw new Error("Invalid Tamara webhook signature");
      }
    }

    return JSON.parse(payload);
  }

  getCheckoutUrl(): string {
    return TAMARA_CHECKOUT_URL;
  }

  static getSupportedRegions(): TamaraRegion[] {
    return ["UAE", "SAU"];
  }

  static getSupportedCurrencies(): Record<TamaraRegion, "AED" | "SAR"> {
    return {
      UAE: "AED",
      SAU: "SAR",
    };
  }
}

export const tamaraService = new TamaraService();
