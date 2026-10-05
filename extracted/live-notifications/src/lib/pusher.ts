import Pusher from "pusher";
import { getOrderNumber } from "@/lib/order-number";

const PUSHER_APP_ID = process.env.PUSHER_APP_ID || "2145513";
const PUSHER_KEY = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY || "1f774a5bbab3fae7abac";
const PUSHER_SECRET = process.env.PUSHER_SECRET || "20f78fcba81376802077";
const PUSHER_CLUSTER = process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap2";

export const pusherServer = new Pusher({
  appId: PUSHER_APP_ID,
  key: PUSHER_KEY,
  secret: PUSHER_SECRET,
  cluster: PUSHER_CLUSTER,
  useTLS: true,
});

export async function triggerNotification(channel: string, event: string, data: any) {
  try {
    await pusherServer.trigger(channel, event, data);
    return true;
  } catch (error) {
    console.error("Pusher trigger error:", error);
    return false;
  }
}

export async function notifyNewOrder(order: {
  id: string;
  orderNumber?: number | string;
  total: number;
  amount?: number;
  currency: string;
  userName?: string;
  customerName?: string;
  email?: string;
  paymentMethod?: string;
}) {
  return triggerNotification("admin-notifications", "new-order", {
    id: order.id,
    orderNumber: order.orderNumber !== undefined && order.orderNumber !== null && order.orderNumber !== "" ? order.orderNumber : getOrderNumber(order.id),
    total: order.total,
    amount: order.amount ?? order.total,
    currency: order.currency,
    userName: order.userName || order.customerName || "Customer",
    customerName: order.customerName || order.userName || "Customer",
    email: order.email,
    paymentMethod: order.paymentMethod || "Confirmed",
    timestamp: new Date().toISOString(),
  });
}