import { prisma } from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { getAdminApiSession } from '@/lib/admin-session';
import { getOrderNumber } from '@/lib/order-number';

export const dynamic = 'force-dynamic';

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = v instanceof Date ? v.toISOString() : String(v);
  // Quote everything; neutralise spreadsheet formula injection.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const session = await getAdminApiSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const status = new URL(req.url).searchParams.get('status');
  const where: Prisma.OrderWhereInput = status && status in OrderStatus ? { status: status as OrderStatus } : {};

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      currency: true,
      subtotal: true,
      shipping: true,
      discount: true,
      total: true,
      email: true,
      couponCode: true,
      billingAddress: true,
      shippingAddress: true,
      user: { select: { email: true, name: true } },
      store: { select: { code: true } },
    },
  });

  const header = [
    'order_number', 'order_id', 'created_at', 'status', 'payment_status', 'payment_method', 'store',
    'customer', 'email', 'phone', 'country', 'city', 'currency', 'subtotal', 'shipping', 'discount', 'total', 'coupon',
  ];
  const lines = [header.join(',')];
  for (const o of orders) {
    const bill = (o.billingAddress as Record<string, string> | null) || {};
    const ship = (o.shippingAddress as Record<string, string> | null) || {};
    const name = o.user?.name || `${bill.first_name || ''} ${bill.last_name || ''}`.trim();
    lines.push([
      getOrderNumber(o.id), o.id, o.createdAt, o.status, o.paymentStatus, o.paymentMethod, o.store?.code,
      name, o.user?.email || o.email || bill.email, bill.phone || ship.phone, ship.country || bill.country,
      ship.city || bill.city, o.currency, o.subtotal, o.shipping, o.discount, o.total ?? 0, o.couponCode,
    ].map(csvCell).join(','));
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response('﻿' + lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="orders-${status ? status.toLowerCase() + '-' : ''}${stamp}.csv"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
