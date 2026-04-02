import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Package, User, MapPin, CreditCard, Clock, Truck, ShieldCheck, Info, Download } from 'lucide-react';
import OrderStatusActions from './OrderStatusActions';
import { OrderStatus } from '@prisma/client';

function formatPrice(amountCents: number, currency: string): string {
  const code = currency?.toUpperCase() || 'USD';
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  const amount = amountCents / 100;
  return `${code} ${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
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
              select: {
                id: true,
                name: true,
                images: true
              }
            }
          }
        },
        user: true,
      }
    }) as any;

    if (!order) throw new Error("Not found");
  } catch (err: any) {
    console.error(`Admin Order Detail Fetch Error (ID: ${id}):`, err.message);
    return (
      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto text-center">
        <div className="glass-panel-heavy rounded-[3rem] p-12 border border-black/5 bg-white shadow-2xl">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-3xl font-black text-black mb-4">Order Not Found</h1>
          <p className="text-black/40 font-bold uppercase tracking-widest text-xs mb-8">
            The order ID #{id} does not exist in MongoDB.
          </p>
          <Link href="/ueadmin/orders" className="inline-flex items-center gap-2 bg-black text-white rounded-full px-8 py-4 text-sm font-bold shadow-xl shadow-black/20 transition hover:scale-105">
            <ArrowLeft size={16} /> BACK TO ORDERS
          </Link>
        </div>
      </div>
    );
  }

  const billing = order.billingAddress as any;
  const shipping = order.shippingAddress as any;
  const customerName = order.user?.name || (billing ? `${billing.first_name || ''} ${billing.last_name || ''}`.trim() : 'Guest');
  const customerEmail = order.user?.email || billing?.email || 'No email';
  const customerPhone = billing?.phone || 'No phone';

  return (
    <div className="space-y-6 md:space-y-8 pb-20 px-4 md:px-0">
      <Link
        href="/ueadmin/orders"
        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition"
      >
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2 flex-wrap justify-center md:justify-start">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black">Order #{order.id.substring(0, 8)}</h1>
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-black/10 transition-all ${
              order.status === OrderStatus.DELIVERED ? 'bg-green-500 text-white border-green-600' : 'bg-black/5 text-black/60'
            }`}>
              {order.status}
            </span>
          </div>
          <p className="text-[11px] md:text-sm font-medium text-black/40 flex items-center gap-2 justify-center md:justify-start">
            <Clock size={14} /> Received {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Detailed Status & Fulfilment */}
          <section className="glass-panel-heavy p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-black/5 shadow-sm bg-white space-y-6">
             <div className="flex items-center justify-between border-b border-black/5 pb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-black/5 rounded-xl text-black/40"><Truck size={20} /></div>
                   <h3 className="font-bold text-base md:text-lg text-black">Fulfilment</h3>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                   Status: {order.status}
                </div>
             </div>
             <OrderStatusActions orderId={order.id} currentStatus={order.status} />
          </section>

          {/* Items Table */}
          <section className="glass-panel-heavy rounded-[2rem] md:rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden bg-white">
            <div className="px-6 md:px-8 py-5 md:py-6 border-b border-black/5 flex items-center gap-3 bg-black/5">
              <Package size={18} className="text-black/40" />
              <h3 className="font-bold text-base md:text-lg">Item List</h3>
            </div>
            
            <div className="divide-y divide-black/5">
              {order.items.map((it: any) => (
                <div key={it.id} className="p-4 md:p-8 flex items-center gap-4 hover:bg-black/[0.01] transition-colors">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-black/5 overflow-hidden flex-shrink-0 border border-black/5">
                    {it.imageSnapshot || it.product?.images?.[0] ? (
                      <img
                        src={it.imageSnapshot || it.product?.images?.[0]}
                        alt={it.nameSnapshot || it.product?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-black/10 uppercase">No Img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm md:text-base text-black truncate">
                      {it.nameSnapshot || it.product?.name}
                    </div>
                    <div className="text-[10px] md:text-xs font-bold text-black/40 mt-1 uppercase tracking-widest">
                      Qty: {it.quantity} × {formatPrice(it.unitPriceCents, order.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-black text-sm md:text-lg">
                      {formatPrice(it.unitPriceCents * it.quantity, order.currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* User Details */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <section className="glass-panel-heavy p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-black/5 shadow-sm bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-black/5 rounded-xl text-black/40"><User size={18} /></div>
                <h3 className="font-bold text-black">Customer</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-black/20 mb-1">Full Name</div>
                  <div className="font-bold text-base md:text-lg text-black">{customerName}</div>
                </div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-black/20 mb-1">Contact Details</div>
                  <div className="font-semibold text-black/60 text-xs md:text-sm truncate">{customerEmail}</div>
                  <div className="font-semibold text-black/60 text-xs md:text-sm mt-0.5">{customerPhone}</div>
                </div>
              </div>
            </section>

            <section className="glass-panel-heavy p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-black/5 shadow-sm bg-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-black/5 rounded-xl text-black/40"><MapPin size={18} /></div>
                <h3 className="font-bold text-black">Shipping</h3>
              </div>
              <div className="text-[11px] md:text-xs font-semibold text-black/60 leading-relaxed uppercase tracking-widest">
                {shipping ? (
                  <>
                    <div className="font-bold text-black mb-2 text-sm">{shipping.first_name} {shipping.last_name}</div>
                    {shipping.address_1}<br />
                    {shipping.address_2 && <>{shipping.address_2}<br /></>}
                    {shipping.city}, {shipping.state || ''} {shipping.postcode}<br />
                    {shipping.country}
                  </>
                ) : (
                  <div className="italic text-black/30">No shipping address provided</div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Sidebar: Payment & Financials */}
        <div className="space-y-6 md:space-y-8">
          <section className="glass-panel-heavy p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-black/5 shadow-2xl bg-white lg:sticky lg:top-24">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-black/5 rounded-xl text-black/40"><CreditCard size={18} /></div>
              <h3 className="font-black uppercase tracking-widest text-xs text-black">Financials</h3>
            </div>
            
            <div className="space-y-4 md:space-y-5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black/40">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotalCents, order.currency)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black/40">
                <span>Shipping</span>
                <span>{formatPrice(order.shippingCents || 0, order.currency)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-black/40">
                <span>Discount</span>
                <span>-{formatPrice(order.discountCents || 0, order.currency)}</span>
              </div>
              <div className="pt-6 md:pt-8 border-t border-black/5 flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-black/40 mb-1">Grand Total</span>
                <span className="text-3xl md:text-4xl font-black text-black">{formatPrice(order.totalCents, order.currency)}</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-black/5 space-y-6">
               <div className="flex items-center gap-4 bg-black/5 p-4 rounded-2xl border border-black/5">
                 <div className="p-3 bg-black/10 rounded-xl text-black/40"><ShieldCheck size={18} /></div>
                 <div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-black/30">Integrity</div>
                     <div className="font-bold text-[9px] uppercase tracking-widest bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full inline-block mt-1">
                      {['ORDER_CONFIRMED', 'PROCESSING', 'DELIVERED'].includes(order.status) ? 'Verified' : 'Review'}
                     </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <div className="text-[8px] font-black uppercase tracking-widest text-black/20">Method</div>
                   <div className="font-bold text-[10px] uppercase tracking-widest mt-1 truncate text-black">{order.paymentMethodTitle || 'N/A'}</div>
                 </div>
                 <div>
                   <div className="text-[8px] font-black uppercase tracking-widest text-black/20">Slug</div>
                   <div className="font-bold text-[10px] uppercase tracking-widest mt-1 text-black/60 truncate">{order.paymentMethod}</div>
                 </div>
               </div>

               {order.stripePaymentIntentId && (
                 <div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-black/20 mb-2">Transaction ID</div>
                    <div className="font-mono text-[9px] break-all bg-black/5 p-3 rounded-xl border border-black/5 text-black/60">
                      {order.stripePaymentIntentId}
                    </div>
                 </div>
               )}
            </div>
          </section>

<section className="glass-panel-heavy p-6 md:p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-start gap-3">
              <div className="p-2 bg-black/5 rounded-xl text-black/20 shrink-0"><Info size={16} /></div>
              <div className="flex-1">
                <p className="text-[9px] font-bold text-black/30 leading-relaxed uppercase tracking-widest">
                   Order Details
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-black/20">Order ID</div>
                    <div className="font-bold text-xs text-black mt-1">{order.id}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-black/20">Created</div>
                    <div className="font-bold text-xs text-black mt-1">{new Date(order.createdAt).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-black/20">Payment</div>
                    <div className="font-bold text-xs text-black mt-1">{order.paymentMethodTitle || order.paymentMethod}</div>
                  </div>
                  <div>
                    <div className="text-[8px] font-black uppercase tracking-widest text-black/20">Currency</div>
                    <div className="font-bold text-xs text-black mt-1">{order.currency}</div>
                  </div>
                </div>
              </div>
           </section>

           {/* Invoice Download */}
           <a
             href={`/api/admin/orders/${order.id}/invoice`}
             target="_blank"
             rel="noopener noreferrer"
             className="glass-panel-heavy p-6 md:p-8 rounded-[2rem] border border-black/5 bg-white shadow-sm flex items-center gap-4 hover:bg-black/5 transition-colors cursor-pointer"
           >
              <div className="p-3 bg-black rounded-xl text-white"><Download size={18} /></div>
              <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-black">Download Invoice</p>
                  <p className="text-[9px] font-bold text-black/40 uppercase tracking-widest">PDF format</p>
              </div>
           </a>
        </div>
      </div>
    </div>
  );
}
