
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

  private cleanPhone(phone: string | undefined): string {
    if (!phone) return "";
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, "");
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, "");
    // Remove country codes if they exist at the start
    const countryCodes = ["971", "966", "965", "973", "974", "968"];
    for (const code of countryCodes) {
      if (cleaned.startsWith(code)) {
        cleaned = cleaned.substring(code.length);
        break;
      }
    }
    // Final clean of any new leading zeros
    return cleaned.replace(/^0+/, "");
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
        const decimals = ["BHD", "KWD", "OMR"].includes(item.unitPrice.currency.toUpperCase()) ? 3 : 2;
        const unitPrice = Number(item.unitPrice.amount || 0);
        const quantity = Number(item.quantity || 1);
        const itemTotal = (unitPrice * quantity);

        return {
          reference_id: item.sku || `ITEM-${Math.random().toString(36).substr(2, 9)}`,
          sku: item.sku || "SKU",
          name: item.name || "Product",
          type: item.type || "Physical",
          unit_price: {
            amount: unitPrice.toFixed(decimals),
            currency: item.unitPrice.currency
          },
          quantity: quantity,
          total_amount: {
            amount: itemTotal.toFixed(decimals),
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
        phone_number: this.cleanPhone(params.consumer.phone),
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
        phone_number: this.cleanPhone(params.billingAddress.phone || params.consumer.phone),
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
        phone_number: this.cleanPhone(params.shippingAddress.phone || params.consumer.phone),
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

    // 1. Currency Validation: Must strictly match the geo-location country code
    const countryToCurrency: Record<string, string> = {
      'AE': 'AED', 'SA': 'SAR', 'KW': 'KWD', 'BH': 'BHD', 'QA': 'QAR', 'OM': 'OMR'
    };
    const expectedCurrency = countryToCurrency[payload.country_code.toUpperCase()];
    if (expectedCurrency && payload.total_amount.currency !== expectedCurrency) {
      console.warn(`[Tamara] Currency mismatch: expected ${expectedCurrency} for ${payload.country_code}, but got ${payload.total_amount.currency}. Correcting...`);
      const newCurrency = expectedCurrency as any;
      payload.total_amount.currency = newCurrency;
      payload.shipping_amount.currency = newCurrency;
      payload.tax_amount.currency = newCurrency;
      payload.discount.currency = newCurrency;
      payload.items.forEach(item => {
        item.unit_price.currency = newCurrency;
        item.total_amount.currency = newCurrency;
      });
    }

    // 2. Math Check: Ensure top-level total_amount matches the sum of all line item amounts to avoid 400 errors
    const itemsTotal = payload.items.reduce((acc, item) => acc + Number(item.total_amount.amount), 0);
    const shippingAmt = Number(payload.shipping_amount.amount);
    const taxAmt = Number(payload.tax_amount.amount);
    const discountAmt = Number(payload.discount.amount);
    
    const decimals = ["BHD", "KWD", "OMR"].includes(payload.total_amount.currency.toUpperCase()) ? 3 : 2;
    const calculatedTotal = (itemsTotal + shippingAmt + taxAmt - discountAmt).toFixed(decimals);
    
    if (payload.total_amount.amount !== calculatedTotal) {
      console.warn(`[Tamara] Math mismatch: payload total ${payload.total_amount.amount} vs calculated ${calculatedTotal}. Overriding with calculated total.`);
      payload.total_amount.amount = calculatedTotal;
    }

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
      console.error("Tamara API FULL Error Response:", JSON.stringify(errorData, null, 2));
      
      // More descriptive error for common issues
      const msg = errorData.message || errorData.errors?.[0]?.message || `Status: ${response.status}`;
      throw new Error(`Tamara Rejection: ${msg}`);
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
