'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OrderFilter } from './OrderFilter';
import { Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

function formatPrice(amountCents: number, currency: string): string {
  const code = currency?.toUpperCase() || 'USD';
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  const amount = Number(amountCents);
  return `${code} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'ORDER_RECEIVED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'ORDER_CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PROCESSING': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    case 'READY_FOR_PICKUP': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ORDER_PICKED_UP': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'IN_TRANSIT': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'DELIVERED': return 'bg-green-200 text-green-900 border-green-300';
    case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
    case 'REFUNDED': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-gray-50 text-gray-600 border-gray-100';
  }
}

function getPaymentStatusColor(paymentStatus: string | null): string {
  switch (paymentStatus) {
    case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
    case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
    case 'UNPAID': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getPaymentStatusLabel(paymentStatus: string | null): string {
  switch (paymentStatus) {
    case 'PAID': return 'PAID';
    case 'PENDING': return 'PENDING';
    case 'CANCELLED': return 'CANCELLED';
    case 'UNPAID': return 'UNPAID';
    default: return 'UNKNOWN';
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

export default function OrdersTableClient({ dbOrders, status, storeAccess }: { dbOrders: any[], status: string, storeAccess: any }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const groupedOrders: Record<string, any[]> = {};
  dbOrders.forEach((order) => {
    const dateKey = new Date(order.createdAt).toISOString().split('T')[0];
    if (!groupedOrders[dateKey]) groupedOrders[dateKey] = [];
    groupedOrders[dateKey].push(order);
  });

  const sortedDateKeys = Object.keys(groupedOrders).sort((a, b) => b.localeCompare(a));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(dbOrders.map(o => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOrder = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} selected order(s)? This cannot be undone.`)) return;

    setIsDeleting(true);
    const tid = toast.loading('Deleting orders...');
    try {
      const res = await fetch('/api/admin/orders/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Deleted ${data.count} order(s)`, { id: tid });
        setSelectedIds(new Set());
        router.refresh();
      } else {
        throw new Error(data.error || 'Failed to delete orders');
      }
    } catch (e: any) {
      toast.error(e.message, { id: tid });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 px-2 md:px-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Orders</h1>
            <Link 
              href="/ueadmin/orders/create"
              className="bg-black text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-black/10 flex items-center gap-2"
            >
              <Plus size={14} /> Create Order
            </Link>
            {selectedIds.size > 0 && (
              <button 
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="bg-red-500 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete Selected ({selectedIds.size})
              </button>
            )}
          </div>
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
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px] md:min-w-0 relative">
            <thead className="bg-black text-white sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 w-10 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={dbOrders.length > 0 && selectedIds.size === dbOrders.length}
                    className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black"
                  />
                </th>
                <th className="px-2 md:px-4 py-4 text-[10px] md:text-xs font-black uppercase tracking-widest">Order #</th>
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
                      <td colSpan={10} className="px-4 md:px-6 py-3">
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
                          <td className="px-4 py-4 w-10 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(o.id)}
                              onChange={() => handleSelectOrder(o.id)}
                              className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black accent-black"
                            />
                          </td>
                          <td className="px-2 md:px-4 py-4 font-black">#{o.id.substring(0, 8)}</td>
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
                            <div className="flex flex-col items-start gap-2">
                              <span className={`px-2 md:px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border ${getStatusColor(o.status)}`}>
                                {o.status}
                              </span>
                              {o.shipment && (
                                <a 
                                  href={o.shipment.trackingUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-2 py-1 bg-black/5 rounded text-[9px] font-bold text-black hover:bg-black/10 transition-colors"
                                >
                                  {o.shipment.courier?.toLowerCase().includes('naqel') ? '📦' : o.shipment.courier?.toLowerCase().includes('aramex') ? '🚚' : '🛵'} 
                                  {o.shipment.trackingCode}
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-right flex items-center justify-end gap-2">
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
