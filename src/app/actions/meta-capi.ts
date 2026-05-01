'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { generateEventId, hashData } from '@/lib/meta-utils';

const MetaCAPIError = z.object({
  error: z.object({
    message: z.string(),
    type: z.string(),
    code: z.number(),
    fbtrace_id: z.string().optional(),
  }),
});

const PurchaseEventSchema = z.object({
  eventName: z.literal('Purchase'),
  eventTime: z.number(),
  eventId: z.string(),
  userData: z.object({
    em: z.string().optional(),
    ph: z.string().optional(),
    fn: z.string().optional(),
    ln: z.string().optional(),
    ct: z.string().optional(),
    st: z.string().optional(),
    country: z.string().optional(),
    external_id: z.string().optional(),
    client_ip_address: z.string().optional(),
    client_user_agent: z.string().optional(),
  }),
  customData: z.object({
    currency: z.string(),
    value: z.number(),
    content_ids: z.array(z.string()).optional(),
    contents: z
      .array(
        z.object({
          id: z.string(),
          quantity: z.number(),
          item_price: z.number(),
        })
      )
      .optional(),
    num_items: z.number().optional(),
  }),
});

export type PurchaseEvent = z.infer<typeof PurchaseEventSchema>;

interface MetaCAPIRResponse {
  events_received: number;
  fbtrace_id: string;
  error?: unknown;
}

export async function sendPurchaseToMetaCAPI(
  data: PurchaseEvent
): Promise<{ success: boolean; fbtrace_id?: string; error?: string }> {
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const accessToken = process.env.FB_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    const missing: string[] = [];
    if (!pixelId) missing.push('NEXT_PUBLIC_FB_PIXEL_ID');
    if (!accessToken) missing.push('FB_ACCESS_TOKEN');

    return {
      success: false,
      error: `Missing env vars: ${missing.join(', ')}`,
    };
  }

  const parsed = PurchaseEventSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: `Validation failed: ${parsed.error.issues.map((e) => e.message).join(', ')}`,
    };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [
            {
              event_name: parsed.data.eventName,
              event_time: parsed.data.eventTime,
              event_id: parsed.data.eventId,
              user_data: {
                em: parsed.data.userData.em,
                ph: parsed.data.userData.ph,
                fn: parsed.data.userData.fn,
                ln: parsed.data.userData.ln,
                ct: parsed.data.userData.ct,
                st: parsed.data.userData.st,
                country: parsed.data.userData.country,
                external_id: parsed.data.userData.external_id,
                client_ip_address: parsed.data.userData.client_ip_address,
                client_user_agent: parsed.data.userData.client_user_agent,
              },
              custom_data: {
                currency: parsed.data.customData.currency,
                value: parsed.data.customData.value,
                content_ids: parsed.data.customData.content_ids,
                contents: parsed.data.customData.contents,
                num_items: parsed.data.customData.num_items,
              },
            },
          ],
          access_token: accessToken,
        }),
      }
    );

    const result: MetaCAPIRResponse = await response.json();

    if (!response.ok) {
      const parsedError = MetaCAPIError.safeParse(result);
      if (parsedError.success) {
        return {
          success: false,
          error: parsedError.data.error.message,
        };
      }
      return {
        success: false,
        error: 'Failed to send to Meta CAPI',
      };
    }

    return {
      success: true,
      fbtrace_id: result.fbtrace_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function firePurchaseCAPI(orderId: string, clientEventId?: string): Promise<{ success: boolean; fbtrace_id?: string; error?: string }> {
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const accessToken = process.env.FB_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return { success: false, error: 'CAPI not configured' };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });

  if (!order || !order.total) {
    return { success: false, error: 'Order not found or has no total' };
  }

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') ?? headersList.get('x-real-ip') ?? undefined;
  const ua = headersList.get('user-agent') ?? undefined;

  const names = order.user?.name?.split(' ') ?? [];
  const timestamp = Math.floor(order.createdAt.getTime() / 1000);
  const eventId = clientEventId || generateEventId(orderId, timestamp);

  return sendPurchaseToMetaCAPI({
    eventName: 'Purchase',
    eventTime: timestamp,
    eventId,
    userData: {
      em: order.email ? hashData(order.email) : undefined,
      ph: order.user?.phone ? hashData(order.user.phone) : undefined,
      fn: names[0] ? hashData(names[0]) : undefined,
      ln: names[1] ? hashData(names[1]) : undefined,
      ct: order.shippingAddress ? hashData(String((order.shippingAddress as Record<string, unknown>)?.city ?? '')) : undefined,
      st: order.shippingAddress ? hashData(String((order.shippingAddress as Record<string, unknown>)?.state ?? '')) : undefined,
      country: order.user?.country ?? undefined,
      external_id: order.userId ? hashData(order.userId) : undefined,
      client_ip_address: ip,
      client_user_agent: ua,
    },
    customData: {
      currency: order.currency.toLowerCase(),
      value: order.total,
      content_ids: order.items.map((item) => item.productId),
      contents: order.items.map((item) => ({
        id: item.productId,
        quantity: item.quantity,
        item_price: item.unitPrice ?? 0,
      })),
      num_items: order.items.reduce((sum, item) => sum + item.quantity, 0),
    },
  });
}