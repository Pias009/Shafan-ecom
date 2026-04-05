import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { OrderFilter } from './_components/OrderFilter';
import { getAdminStoreAccess } from '@/lib/admin-session';

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

export default async function OrdersPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const status = params?.status || 'ALL';

  // Get admin store access to filter orders by store
  const storeAccess = await getAdminStoreAccess();
  if (!storeAccess) {
    return <div className="p-20 text-center font-black opacity-20 italic text-3xl">Unauthorized Access</div>;
  }

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

  const dbOrders = await (prisma as any).order.findMany({
    where,
    include: {
      user: true,
      store: { select: { code: true, name: true } }
    },
    orderBy: {
      createdAt: 'desc'
    }
  }) as any[];

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
          <table className="w-full text-left min-w-[800px] md:min-w-0">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Order #</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Store</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Date</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Customer</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Payment</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Total</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Status</th>
                <th className="px-4 md:px-6 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 overflow-x-auto">
              {dbOrders.map((o) => {
                const billing = o.billingAddress as any;
                const customer = o.user?.name || (billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : 'Guest');
                const email = o.user?.email || billing?.email || 'No email';
                const date = new Date(o.createdAt).toLocaleDateString();
                const paid = o.paymentMethodTitle || o.paymentMethod || 'Unknown';
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
                    <td className="px-4 md:px-6 py-4 font-black text-xs md:text-sm">{paid}</td>
                    <td className="px-4 md:px-6 py-4 font-black text-xs md:text-sm">{formatPrice(o.totalCents, o.currency)}</td>
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
