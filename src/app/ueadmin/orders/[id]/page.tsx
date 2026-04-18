import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Package, User, MapPin, CreditCard, Clock, Truck, ShieldCheck, Info, DollarSign, ShoppingCart, Globe, Store } from 'lucide-react';
import OrderStatusActions from './OrderStatusActions';
import InvoiceDownload from './_components/InvoiceDownload';
import ShippingPanel from './_components/ShippingPanel';
import PaymentActions from './_components/PaymentActions';
import PaymentStatusEditor from './_components/PaymentStatusEditor';
import { OrderStatus } from '@prisma/client';
import RequestAlerts from './RequestAlerts';

function formatPrice(amount: number, currency: string): string {
  const code = currency?.toUpperCase() || 'USD';
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  return `${code} ${(amount || 0).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let order;
  try {
    order = await (prisma as any).order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, images: true, sku: true }
            }
          }
        },
        user: true,
        shipment: true,
        store: true,
        appliedDiscount: true,
      }
    }) as any;

    if (!order) throw new Error("Not found");
  } catch (err: any) {
    return (
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-center">
        <div className="glass-panel-heavy rounded-[3rem] p-12 border border-black/5 bg-white shadow-2xl">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-3xl font-black text-black mb-4">Order Not Found</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-8">
            The order ID #{id} does not exist in MongoDB.
          </p>
          <Link href="/ueadmin/orders" className="inline-flex items-center gap-2 bg-black text-white rounded-full px-8 py-4 text-sm font-bold shadow-xl shadow-black/20 transition hover:scale-105">
            <ArrowLeft size={16} /> BACK TO ORDERS
          </Link>
        </div>
      </div>
    );
  }

  const billing = order.billingAddress as Record<string, unknown> | null;
  const shipping = order.shippingAddress as Record<string, unknown> | null;
  const customerName = order.user?.name || (billing?.first_name ? `${billing.first_name} ${billing.last_name || ''}`.trim() : 'Guest') || 'Guest';
  const customerEmail = order.user?.email || (billing?.email as string) || 'No email';
  const customerPhone = (billing?.phone as string) || (shipping?.phone as string) || 'No phone';

  const itemCount = order.items?.length || 0;
  const totalItems = order.items?.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.quantity as number) || 0), 0) || 0;

  return (
    <div className="pb-20 px-4 md:px-0 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/ueadmin/orders" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-black transition mb-4">
          <ArrowLeft size={14} /> Back to Orders
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-4 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900">Order #{order.id?.slice(-8)?.toUpperCase() || 'N/A'}</h1>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                order.status === OrderStatus.DELIVERED ? 'bg-green-500 text-white border-green-600' :
                order.status === OrderStatus.PROCESSING ? 'bg-blue-500 text-white border-blue-600' :
                order.status === OrderStatus.CANCELLED ? 'bg-red-500 text-white border-red-600' :
                'bg-black/10 text-slate-700 border-black/10'
              }`}>
                {order.status?.replace(/_/g, ' ') || 'UNKNOWN'}
              </span>
            </div>
            <p className="text-slate-500 text-xs font-medium mt-2 flex items-center gap-2">
              <Clock size={14} /> Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          
          {/* Quick Stats & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <InvoiceDownload orderId={order.id} />
          </div>
        </div>
      </div>

      {/* Main Content - Single Column with Sections */}
      <div className="space-y-6">
        
        {/* Cancellation/Return Requests */}
        <RequestAlerts 
          orderId={order.id}
          cancelRequest={order.cancelRequest}
          cancelReason={order.cancelReason}
          returnRequest={order.returnRequest}
          returnReason={order.returnReason}
          returnStatus={order.returnStatus}
        />

        {/* Order Status & Actions */}
        <section className="glass-panel-heavy p-6 rounded-2xl border border-black/5 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black/5 rounded-xl text-slate-700"><Truck size={20} /></div>
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Fulfillment Status</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-lg border border-black/5">
                <ShoppingCart size={14} className="text-slate-400" />
                <span className="text-xs font-black text-slate-700">{totalItems} Items</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 glass-panel rounded-lg border border-black/5">
                <DollarSign size={14} className="text-slate-400" />
                <span className="text-xs font-black text-slate-700">{formatPrice(order.total, order.currency)}</span>
              </div>
            </div>
          </div>
          <OrderStatusActions orderId={order.id} currentStatus={order.status} />
        </section>

        {/* Payment Actions - for COD orders */}
        <PaymentActions 
          orderId={order.id} 
          currentPaymentStatus={order.paymentStatus} 
          paymentMethod={order.paymentMethod}
        />

        {/* Items Section */}
        <section className="glass-panel-heavy rounded-2xl border border-black/5 shadow-sm overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-black/5">
            <div className="flex items-center gap-3">
              <Package size={18} className="text-slate-600" />
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Order Items ({itemCount})</h3>
            </div>
            <div className="text-xs font-bold text-slate-500">{totalItems} total units</div>
          </div>
          
          <div className="divide-y divide-black/5">
            {order.items?.map((item: Record<string, unknown>) => (
              <div key={item.id as string} className="p-4 md:p-6 flex items-center gap-4 hover:bg-black/[0.01] transition">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl bg-black/5 overflow-hidden flex-shrink-0 border border-black/5">
                  {((item.imageSnapshot as string) || ((item.product as Record<string, unknown>)?.images as string[])?.[0]) ? (
                    <img
                      src={(item.imageSnapshot as string) || ((item.product as Record<string, unknown>)?.images as string[])?.[0] || ''}
                      alt={(item.nameSnapshot as string) || ((item.product as Record<string, unknown>)?.name as string) || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">No Image</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate">
                    {(item.nameSnapshot as string) || ((item.product as Record<string, unknown>)?.name as string) || 'Unknown Product'}
                  </div>
                  <div className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-3">
                    <span>Qty: {item.quantity as number}</span>
                    <span>×</span>
                    <span>{formatPrice(item.unitPrice as number, order.currency)}</span>
                    {(item.sku as string) && <span className="text-slate-400">SKU: {item.sku as string}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-slate-900 text-sm">
                    {formatPrice(((item.unitPrice as number) || 0) * ((item.quantity as number) || 0), order.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Customer & Shipping Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Customer Info */}
          <section className="glass-panel-heavy p-6 rounded-2xl border border-black/5 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black/5 rounded-xl text-slate-700"><User size={18} /></div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Customer</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Name</div>
                <div className="font-bold text-slate-900 text-sm">{customerName}</div>
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Email</div>
                <div className="font-semibold text-slate-700 text-xs truncate">{customerEmail}</div>
              </div>
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone</div>
                <div className="font-semibold text-slate-700 text-xs">{customerPhone}</div>
              </div>
              {order.user?.id && (
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">User ID</div>
                  <div className="font-mono text-[10px] text-slate-600 truncate">{order.user.id}</div>
                </div>
              )}
            </div>
          </section>

          {/* Shipping Address */}
          <section className="glass-panel-heavy p-6 rounded-2xl border border-black/5 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black/5 rounded-xl text-slate-700"><MapPin size={18} /></div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Shipping Address</h3>
            </div>
            <div className="text-xs font-semibold text-slate-600 leading-relaxed uppercase tracking-wider">
              {(shipping as Record<string, string | undefined>) ? (
                <div className="space-y-2">
                  <div className="font-bold text-slate-900">{String((shipping as Record<string, string>).first_name || '')} {String((shipping as Record<string, string>).last_name || '')}</div>
                  <div>{String((shipping as Record<string, string>).address_1 || '')}</div>
                  {(shipping as Record<string, string>).address_2 && <div>{String((shipping as Record<string, string>).address_2)}</div>}
                  <div>{String((shipping as Record<string, string>).city || '')}, {String((shipping as Record<string, string>).state || '')} {String((shipping as Record<string, string>).postcode || '')}</div>
                  <div className="font-bold text-slate-800">{String((shipping as Record<string, string>).country || '')}</div>
                  {(shipping as Record<string, string>).phone && <div className="text-slate-500">Phone: {String((shipping as Record<string, string>).phone)}</div>}
                </div>
              ) : (
                <div className="italic text-slate-400">No shipping address</div>
              )}
            </div>
          </section>

          {/* Billing Address */}
          <section className="glass-panel-heavy p-6 rounded-2xl border border-black/5 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black/5 rounded-xl text-slate-700"><CreditCard size={18} /></div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Billing Address</h3>
            </div>
            <div className="text-xs font-semibold text-slate-600 leading-relaxed uppercase tracking-wider">
              {(billing as Record<string, string | undefined>) ? (
                <div className="space-y-2">
                  <div className="font-bold text-slate-900">{String((billing as Record<string, string>).first_name || '')} {String((billing as Record<string, string>).last_name || '')}</div>
                  <div>{String((billing as Record<string, string>).address_1 || '')}</div>
                  {(billing as Record<string, string>).address_2 && <div>{String((billing as Record<string, string>).address_2)}</div>}
                  <div>{String((billing as Record<string, string>).city || '')}, {String((billing as Record<string, string>).state || '')} {String((billing as Record<string, string>).postcode || '')}</div>
                  <div className="font-bold text-slate-800">{String((billing as Record<string, string>).country || '')}</div>
                  {(billing as Record<string, string>).email && <div className="text-slate-500">Email: {String((billing as Record<string, string>).email)}</div>}
                </div>
              ) : (
                <div className="italic text-slate-400">Same as shipping</div>
              )}
            </div>
          </section>
        </div>

        {/* Financial Summary */}
        <section className="glass-panel-heavy p-6 rounded-2xl border border-black/5 shadow-xl bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-black/5 rounded-xl text-slate-700"><DollarSign size={18} /></div>
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Financial Summary</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-black/5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Subtotal</span>
              <span className="font-black text-slate-900">{formatPrice(order.subtotal || 0, order.currency)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-black/5">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Shipping</span>
              <span className="font-black text-slate-900">{formatPrice(order.shipping || 0, order.currency)}</span>
            </div>
            {(order.discountAmount || 0) > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-black/5">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Discount</span>
                <span className="font-black text-green-600">-{formatPrice(order.discountAmount || 0, order.currency)}</span>
              </div>
            )}
            {order.appliedDiscount && (
              <div className="flex justify-between items-center py-2 bg-green-50 px-3 rounded-lg -mx-3">
                <span className="text-xs font-bold uppercase tracking-widest text-green-700">Applied Coupon</span>
                <span className="font-black text-green-700 text-sm">{order.appliedDiscount.code}</span>
              </div>
            )}
            <div className="pt-4 flex justify-between items-end">
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">Total</span>
              <span className="text-2xl font-black text-slate-900">{formatPrice(order.total || 0, order.currency)}</span>
            </div>
          </div>
        </section>

        {/* Payment & Store Info */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Payment Details */}
          <section className="glass-panel-heavy p-6 rounded-2xl border border-black/5 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black/5 rounded-xl text-slate-700"><CreditCard size={18} /></div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Payment Details</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Method</span>
                <span className="font-bold text-sm text-slate-900">{order.paymentMethodTitle || order.paymentMethod || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</span>
                <PaymentStatusEditor orderId={order.id} currentPaymentStatus={order.paymentStatus || 'PENDING'} />
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Currency</span>
                <span className="font-bold text-sm text-slate-900">{order.currency?.toUpperCase() || 'USD'}</span>
              </div>
              {order.stripePaymentIntentId && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Transaction ID</div>
                  <div className="font-mono text-[10px] break-all bg-black/5 p-3 rounded-lg text-slate-700">{order.stripePaymentIntentId}</div>
                </div>
              )}
              {order.tabbyPaymentId && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Tabby ID</div>
                  <div className="font-mono text-[10px] break-all bg-black/5 p-3 rounded-lg text-slate-700">{order.tabbyPaymentId}</div>
                </div>
              )}
              {order.tamaraCheckoutId && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Tamara ID</div>
                  <div className="font-mono text-[10px] break-all bg-black/5 p-3 rounded-lg text-slate-700">{order.tamaraCheckoutId}</div>
                </div>
              )}
            </div>
          </section>

          {/* Store Info */}
          <section className="glass-panel-heavy p-6 rounded-2xl border border-black/5 shadow-sm bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-black/5 rounded-xl text-slate-700"><Store size={18} /></div>
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Store & Order Info</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Store</span>
                <span className="font-bold text-sm text-slate-900">{order.store?.name || 'Online Store'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Last Updated</span>
                <span className="font-bold text-xs text-slate-700">{new Date(order.updatedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Order ID</span>
                <span className="font-mono text-[10px] text-slate-600">{order.id}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Shipping Management - End of Page */}
        <section className="glass-panel-heavy p-6 rounded-2xl border border-black/5 shadow-sm bg-white">
          <ShippingPanel 
            orderId={order.id} 
            shippingAddress={shipping}
            existingShipment={order.shipment}
          />
        </section>

      </div>
    </div>
  );
}