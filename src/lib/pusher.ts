import Pusher from "pusher";

if (!process.env.PUSHER_APP_ID || !process.env.PUSHER_KEY || !process.env.PUSHER_SECRET || !process.env.PUSHER_CLUSTER) {
  console.warn("Pusher environment variables not set - notifications will be disabled");
}

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "",
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
  total: number;
  currency: string;
  userName?: string;
  email?: string;
}) {
  return triggerNotification("admin-notifications", "new-order", {
    id: order.id,
    total: order.total,
    currency: order.currency,
    userName: order.userName,
    email: order.email,
    timestamp: new Date().toISOString(),
  });
}