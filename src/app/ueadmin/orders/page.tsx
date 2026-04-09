import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { OrderFilter } from './_components/OrderFilter';
import { getAdminStoreAccess } from '@/lib/admin-session';

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
}

function formatPrice(amountCents: number, currency: string): string {
  const code = currency?.toUpperCase() || 'USD';
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  const amount = Number(amountCents);
  return `${code} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export const dynamic = 'force-dynamic';

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.ORDER_RECEIVED:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case OrderStatus.ORDER_CONFIRMED:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case OrderStatus.PROCESSING:
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case OrderStatus.READY_FOR_PICKUP:
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case OrderStatus.ORDER_PICKED_UP:
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case OrderStatus.IN_TRANSIT:
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case OrderStatus.DELIVERED:
      return 'bg-green-200 text-green-900 border-green-300';
    case OrderStatus.CANCELLED:
      return 'bg-red-100 text-red-800 border-red-200';
    case OrderStatus.REFUNDED:
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

function getPaymentStatusColor(paymentStatus: string | null): string {
  switch (paymentStatus) {
    case 'PAID':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'UNPAID':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getPaymentStatusLabel(paymentStatus: string | null): string {
  switch (paymentStatus) {
    case 'PAID':
      return 'PAID';
    case 'PENDING':
      return 'PENDING';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'UNPAID':
      return 'UNPAID';
    default:
      return 'UNKNOWN';
  }
}

function getPaymentMethodDisplay(method: string | null): string {
  if (!method) return 'N/A';
  const m = method.toLowerCase();
  if (m === 'cod' || m === 'cash on delivery') return 'COD';
  if (m === 'card' || m === 'stripe' || m === 'online') return 'Stripe';
  return method;
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const orderDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today.getTime() - orderDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function OrdersPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const status = params?.status || 'ALL';

  // Get admin store access to filter orders by store
  const storeAccess = await getAdminStoreAccess();
  if (!storeAccess) {
    return <div className="p-20 text-center font-black opacity-20 italic text-3xl">Unauthorized Access</div>;
  }

  const where: PrismaWhere = {};
  
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
      items: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  }) as unknown as Order[];

  // Group orders by date
  const groupedOrders: Record<string, Order[]> = {};
  dbOrders.forEach((order) => {
    const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
    if (!groupedOrders[dateKey]) {
      groupedOrders[dateKey] = [];
    }
    groupedOrders[dateKey].push(order);
  });

  // Sort date keys in descending order
  const sortedDateKeys = Object.keys(groupedOrders).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 px-2 md:px-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Orders</h1>
          {storeAccess.userCountry && (
            <p className="text-sm text-black/70 mt-1">
              Viewing orders for {storeAccess.userCountry} store{storeAccess.allowedStores.length > 1 ? 's' : ''}: {storeAccess.allowedStores.join(', ')}
            </p>
          )}
        </div>
          <div className="text-[10px] md:text-sm text-black font-medium uppercase tracking-widest bg-black/5 px-4 py-1.5 rounded-full inline-block">
            {dbOrders.length} Order{dbOrders.length !== 1 ? 's' : ''}
          </div>
      </div>

      <div className="glass-panel-heavy overflow-hidden rounded-3xl border border-black/5 shadow-sm bg-white">
        <div className="mb-2 p-6 flex items-center justify-between border-b border-black/5">
           <OrderFilter currentStatus={status} />
           <div className="text-[10px] font-black uppercase tracking-widest text-black italic">Global Fulfilment Flow</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px] md:min-w-0">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Order #</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Store</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Date</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Customer</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Payment Method</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Total</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Payment Status</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Status</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 overflow-x-auto">
              {sortedDateKeys.map((dateKey) => {
                const ordersInGroup = groupedOrders[dateKey];
                const groupLabel = getDateGroup(dateKey);
                
                return (
                  <React.Fragment key={dateKey}>
                    <tr className="bg-black/5">
                      <td colSpan={9} className="px-4 md:px-6 py-3">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-black/70">{groupLabel}</span>
                      </td>
                    </tr>
                    {ordersInGroup.map((o) => {
                      const billing = o.billingAddress;
                      const customer = o.user?.name || (billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : 'Guest');
                      const email = o.user?.email || billing?.email || 'No email';
                      const date = new Date(o.createdAt).toLocaleDateString();
                      const paymentMethodDisplay = getPaymentMethodDisplay(o.paymentMethod);
                      const storeCode = o.store?.code || 'N/A';
                      const storeName = o.store?.name || 'Unknown Store';
                      
                      return (
                        <tr key={o.id} className="hover:bg-black/[0.02] transition-colors group">
                          <td className="px-4 md:px-6 py-4 font-black">#{o.id.substring(0, 8)}</td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="font-black text-[10px] md:text-xs uppercase tracking-widest">{storeCode}</div>
                            <div className="text-[9px] text-black/70 truncate max-w-[80px]">{storeName}</div>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-[10px] md:text-sm font-medium text-black">{date}</td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="font-bold text-[11px] md:text-sm">{customer}</div>
                            <div className="text-[9px] md:text-[10px] font-bold text-black/70 truncate max-w-[120px] md:max-w-[150px] uppercase tracking-tighter">{email}</div>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${o.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                              {paymentMethodDisplay}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 font-black text-xs md:text-sm">{formatPrice(o.total, o.currency)}</td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${getPaymentStatusColor(o.paymentStatus)}`}>
                              {getPaymentStatusLabel(o.paymentStatus)}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${getStatusColor(o.status)}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-right">
                            <Link href={`/ueadmin/orders/${o.id}`} className="bg-black text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-2 rounded-full hover:scale-105 transition">View</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
