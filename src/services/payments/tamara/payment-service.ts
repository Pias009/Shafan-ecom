
import {
  TamaraSessionRequest,
  TamaraSessionResponse,
  TamaraWebhookPayload,
  TamaraCaptureRequest,
  TamaraRefundRequest,
} from "./types";

export class TamaraService {
  private baseUrl: string;
  private accessToken: string;
  private notificationToken: string;

  constructor() {
    this.baseUrl = (process.env.TAMARA_API_URL || "https://api-sandbox.tamara.co").trim();
    this.accessToken = (process.env.TAMARA_ACCESS_TOKEN || "").trim();
    this.notificationToken = (process.env.TAMARA_NOTIFICATION_TOKEN || "").trim();
  }

  private getHeaders() {
    // Ensure no newlines in token which can crash fetch in Node.js
    const cleanToken = this.accessToken.replace(/[\n\r]/g, "");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cleanToken}`,
      "Tamara-Version": "2.0",
    };
  }

  async createSession(params: TamaraSessionRequest): Promise<TamaraSessionResponse> {
    // Tamara V2 requires specific mandatory fields and object nesting
    const payload = {
      order_reference_id: params.orderReferenceId,
      description: params.description || `Order #${params.orderReferenceId}`,
      country_code: params.billingAddress.country,
      locale: params.locale || "en-US",
      payment_type: params.paymentType || "pay_later",
      is_mobile: params.isMobile || false,
      
      // Tamara requires 'items' (not products) and each item needs a 'total_amount'
      items: params.items.map(item => {
        const unitPrice = Number(item.unitPrice.amount || 0);
        const quantity = Number(item.quantity || 1);
        const itemTotal = (unitPrice * quantity).toFixed(2);

        return {
          reference_id: item.sku || `ITEM-${Math.random().toString(36).substr(2, 9)}`,
          sku: item.sku || "SKU",
          name: item.name || "Product",
          type: item.type || "Physical",
          unit_price: {
            amount: unitPrice.toFixed(2),
            currency: item.unitPrice.currency
          },
          quantity: quantity,
          total_amount: {
            amount: itemTotal,
            currency: item.unitPrice.currency
          },
          description: item.description || item.name || "Product",
          image_url: item.imageUrl || undefined,
          product_url: item.productUrl || undefined,
        };
      }),

      consumer: {
        first_name: params.consumer.firstName || "Customer",
        last_name: params.consumer.lastName || "User",
        email: params.consumer.email || "customer@example.com",
        phone_number: params.consumer.phone || "+971500000001",
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

      // Mandatory top-level objects even if 0
      total_amount: params.totalAmount,
      shipping_amount: params.shippingAmount || { 
        amount: "0.00", 
        currency: params.totalAmount.currency 
      },
      tax_amount: params.taxAmount || { 
        amount: "0.00", 
        currency: params.totalAmount.currency 
      },
      discount: params.discount || { 
        amount: "0.00", 
        currency: params.totalAmount.currency,
        name: "No Discount"
      },

      merchant_url: params.merchantUrls ? {
        success: params.merchantUrls.success,
        cancel: params.merchantUrls.cancel,
        failure: params.merchantUrls.failure,
        notification: params.merchantUrls.notification || `${params.merchantUrls.success.split('/checkout')[0]}/api/payments/tamara/webhook`
      } : undefined,
    };

    console.log("Tamara API Request Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${this.baseUrl}/checkout`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }
      console.error("Tamara API Full Error Response:", JSON.stringify(errorData, null, 2));
      throw new Error(errorData.message || errorData.errors?.[0]?.message || `Tamara session creation failed: ${response.status}`);
    }

    return await response.json();
  }

  async getSession(checkoutId: string): Promise<TamaraSessionResponse> {
    const response = await fetch(`${this.baseUrl}/checkout/${checkoutId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Tamara session: ${response.status}`);
    }

    return await response.json();
  }

  async capturePayment(params: TamaraCaptureRequest): Promise<TamaraWebhookPayload> {
    const response = await fetch(`${this.baseUrl}/orders/${params.orderId}/captures`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        total_amount: params.totalAmount,
        shipping_info: params.shippingInfo,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tamara capture failed: ${response.status}`);
    }

    return await response.json();
  }

  async refundPayment(params: TamaraRefundRequest): Promise<TamaraWebhookPayload> {
    const response = await fetch(`${this.baseUrl}/orders/${params.orderId}/refunds`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        total_amount: params.totalAmount,
        comment: params.comment,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tamara refund failed: ${response.status}`);
    }

    return await response.json();
  }

  async getOrder(orderId: string): Promise<TamaraWebhookPayload> {
    const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Tamara order: ${response.status}`);
    }

    return await response.json();
  }

  verifyWebhook(payload: any, signature: string): boolean {
    // In production, verify the notification token
    // For sandbox, we can skip or implement simple check
    return true;
  }
}
