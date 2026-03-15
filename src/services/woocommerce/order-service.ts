import { wooApi } from "@/lib/woocommerce";

export async function createWooCommerceOrder(orderData: any) {
  try {
    const { data } = await wooApi.post("orders", {
      ...orderData,
      status: "pending",
    });
    return data;
  } catch (error: any) {
    console.error("WooCommerce Order Creation Error:", error?.response?.data || error.message);
    throw new Error("Failed to create WooCommerce order");
  }
}

export async function updateWooCommerceOrderStatus(orderId: number, status: string) {
  try {
    const { data } = await wooApi.put(`orders/${orderId}`, {
      status,
    });
    return data;
  } catch (error: any) {
    console.error(`WooCommerce Order Update Error (${orderId}):`, error?.response?.data || error.message);
    throw new Error("Failed to update WooCommerce order status");
  }
}

export async function getWooCommerceOrder(orderId: number) {
  try {
    const { data } = await wooApi.get(`orders/${orderId}`);
    return data;
  } catch (error: any) {
    console.error(`WooCommerce Get Order Error (${orderId}):`, error?.response?.data || error.message);
    throw new Error("Failed to fetch WooCommerce order");
  }
}
