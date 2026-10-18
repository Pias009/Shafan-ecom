import React from 'react';
import { prisma } from '@/lib/prisma';
import { OrderStatus, Prisma } from '@prisma/client';
import { getAdminStoreAccess } from '@/lib/admin-session';
import OrdersTableClient from './_components/OrdersTableClient';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;
const SEARCH_LIMIT = 500;

const orderListSelect = {
  id: true,
  createdAt: true,
  total: true,
  currency: true,
  email: true,
  status: true,
  paymentStatus: true,
  paymentMethod: true,
  billingAddress: true,
  referralSource: true,
  user: {
    select: {
      name: true,
      email: true,
      signupProvider: true,
      accounts: { select: { provider: true } },
    },
  },
  store: { select: { code: true, name: true } },
  shipment: { select: { courier: true, trackingCode: true, trackingUrl: true } },
} satisfies Prisma.OrderSelect;

export type OrderListRow = Prisma.OrderGetPayload<{ select: typeof orderListSelect }>;

/**
 * Order numbers are the last 8 chars of the ObjectId, which Prisma cannot
 * substring-match, so resolve ids with an aggregation. Also matches the
 * customer's email, name and phone.
 */
async function searchOrderIds(q: string, storeIds: string[]): Promise<string[]> {
  const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  const pipeline: Record<string, unknown>[] = [];
  if (storeIds.length > 0) {
    pipeline.push({ $match: { storeId: { $in: storeIds.map((id) => ({ $oid: id })) } } });
  }
  pipeline.push(
    { $addFields: { _idStr: { $toString: '$_id' } } },
    {
      $match: {
        $or: [
          { _idStr: rx },
          { email: rx },
          { 'billingAddress.email': rx },
          { 'billingAddress.first_name': rx },
          { 'billingAddress.last_name': rx },
          { 'billingAddress.phone': rx },
          { 'shippingAddress.phone': rx },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: SEARCH_LIMIT },
    { $project: { _id: 0, id: '$_idStr' } },
  );

  const res = (await prisma.$runCommandRaw({
    aggregate: 'Order',
    pipeline,
    cursor: { batchSize: SEARCH_LIMIT },
  } as unknown as Prisma.InputJsonObject)) as { cursor?: { firstBatch?: { id: string }[] } };
  return (res?.cursor?.firstBatch || []).map((r) => r.id);
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const rawStatus = params?.status || 'ALL';
  const status = rawStatus in OrderStatus ? rawStatus : 'ALL';
  const q = (params?.q || '').trim().replace(/^#+/, '');
  const page = Math.max(1, Number.parseInt(params?.page || '1', 10) || 1);

  const storeAccess = await getAdminStoreAccess();
  if (!storeAccess) {
    return <div className="p-20 text-center font-semibold text-slate-400">Unauthorized</div>;
  }

  const baseWhere: Prisma.OrderWhereInput =
    storeAccess.storeIds.length > 0 ? { storeId: { in: storeAccess.storeIds } } : {};

  let searchCapped = false;
  if (q) {
    const ids = await searchOrderIds(q, storeAccess.storeIds);
    searchCapped = ids.length >= SEARCH_LIMIT;
    baseWhere.id = { in: ids };
  }

  const where: Prisma.OrderWhereInput =
    status !== 'ALL' ? { ...baseWhere, status: status as OrderStatus } : baseWhere;

  const [orders, filteredTotal, statusGroups] = await Promise.all([
    prisma.order.findMany({
      where,
      select: orderListSelect,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: { _all: true },
    }),
  ]);

  const statusCounts: Record<string, number> = { ALL: 0 };
  for (const g of statusGroups) {
    statusCounts[g.status] = g._count._all;
    statusCounts.ALL += g._count._all;
  }

  return (
    <OrdersTableClient
      dbOrders={orders}
      status={status}
      query={q}
      page={page}
      pageSize={PAGE_SIZE}
      total={filteredTotal}
      statusCounts={statusCounts}
      searchCapped={searchCapped}
    />
  );
}
