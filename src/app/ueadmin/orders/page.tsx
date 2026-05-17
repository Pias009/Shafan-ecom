import React from 'react';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { getAdminStoreAccess } from '@/lib/admin-session';
import OrdersTableClient from './_components/OrdersTableClient';

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
}

interface BillingAddress {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

interface User {
  name: string | null;
  email: string | null;
}

interface Store {
  code: string | null;
  name: string | null;
}

interface PrismaWhere {
  status?: OrderStatus;
  storeId?: { in: string[] };
}

interface Order {
  id: string;
  createdAt: Date;
  total: number;
  currency: string;
  paymentStatus: 'PAID' | 'PENDING' | 'CANCELLED';
  paymentMethod: string;
  paymentMethodTitle: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  billingAddress: BillingAddress | null;
  user: User | null;
  store: Store | null;
  items: OrderItem[];
  shipment: { courier: string; trackingCode: string; trackingUrl: string } | null;
}

export const dynamic = 'force-dynamic';

export default async function OrdersPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const status = params?.status || 'ALL';

  // Get admin store access to filter orders by store
  const storeAccess = await getAdminStoreAccess();
  if (!storeAccess) {
    return <div className="p-20 text-center font-black opacity-20 italic text-3xl">Unauthorized Access</div>;
  }

  // Build where clause - Show all orders for the admin to manage
  const where: any = {};

  // Filter by status if specified
  if (status !== 'ALL') {
    where.status = status as OrderStatus;
  }

  // Filter by store access
  if (storeAccess.storeIds.length > 0) {
    where.storeId = { in: storeAccess.storeIds };
  } else if (!storeAccess.isSuperAdmin) {
    // Regular admin with no store access - return empty
    return (
      <div className="space-y-6 px-2 md:px-0">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Orders</h1>
          <div className="text-[10px] md:text-sm text-black/40 font-medium uppercase tracking-widest bg-black/5 px-4 py-1.5 rounded-full inline-block">
            0 Orders
          </div>
        </div>
        <div className="glass-panel-heavy overflow-hidden rounded-3xl border border-black/5 shadow-sm bg-white p-20 text-center">
          <p className="text-black/40 font-medium">No store access. You cannot view any orders.</p>
        </div>
      </div>
    );
  }

  const dbOrders = await prisma.order.findMany({
    where,
    include: {
      user: true,
      store: { select: { code: true, name: true } },
      items: true,
      shipment: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  }) as unknown as Order[];

  return <OrdersTableClient dbOrders={dbOrders} status={status} storeAccess={storeAccess} />;
}
