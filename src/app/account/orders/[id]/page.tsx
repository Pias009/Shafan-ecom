import { getServerAuthSession } from "@/lib/auth";
import { wooApi } from "@/lib/woocommerce";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, CreditCard, User, MapPin, CheckCircle2, ShoppingBag } from "lucide-react";
import { Price } from "@/components/Price";
import OrderActions from "./OrderActions";

export const dynamic = 'force-dynamic';

export default async function UserOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.email) return redirect("/auth/sign-in");

  const { id } = await params;
  let order;

  try {
    const { data } = await wooApi.get(`orders/${id}`);
    
    // Security check: Ensure this order belongs to the logged-in user
    if (data.billing?.email?.toLowerCase() !== session.user.email.toLowerCase()) {
      return (
        <div className="pt-20 text-center">
          <h2 className="text-xl font-bold">Unauthorized Access</h2>
          <p className="text-black/40 mt-2">You do not have permission to view this order.</p>
          <Link href="/account/orders" className="text-black underline mt-4 inline-block font-bold">Back to My Orders</Link>
        </div>
      );
    }
    order = data;
  } catch (error) {
    return (
      <div className="pt-20 text-center">
        <h2 className="text-xl font-bold">Order Not Found</h2>
        <Link href="/account/orders" className="text-black underline mt-4 inline-block font-bold">Back to My Orders</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 md:py-16 px-4 md:px-6 space-y-8 md:space-y-12">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition">
        <ArrowLeft size={14} /> Back to My Orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 border-b border-black/5 pb-8 md:pb-10">
        <div className="text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter">Receipt #{order.id}</h1>
            <span className="bg-black text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              {order.status}
            </span>
          </div>
          <p className="text-[10px] md:text-xs font-bold text-black/30 uppercase tracking-widest">
            {new Date(order.date_created).toLocaleDateString()} at {new Date(order.date_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-center md:text-right bg-black/5 p-6 rounded-3xl md:bg-transparent md:p-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-1">Total Paid</div>
          <Price amount={order.total} className="text-4xl md:text-5xl font-black" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 border-b border-black/5 pb-4">
             <div className="p-2 bg-black/5 rounded-xl"><User size={16} /></div>
             <h3 className="font-black uppercase tracking-widest text-xs">Customer Record</h3>
          </div>
          <div className="space-y-4 px-2">
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-black/20">Name</div>
              <div className="font-bold text-sm">{order.billing?.first_name} {order.billing?.last_name}</div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-widest text-black/20">Email Address</div>
              <div className="font-bold text-xs md:text-sm text-black/60 truncate">{order.billing?.email}</div>
            </div>
          </div>
        </section>

        <section className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-3 border-b border-black/5 pb-4">
             <div className="p-2 bg-black/5 rounded-xl"><MapPin size={16} /></div>
             <h3 className="font-black uppercase tracking-widest text-xs">Delivery Address</h3>
          </div>
          <div className="px-2 text-[10px] md:text-xs font-bold text-black/60 leading-relaxed uppercase tracking-widest">
            {order.shipping?.address_1}<br />
            {order.shipping?.address_2 && <>{order.shipping.address_2}<br /></>}
            {order.shipping?.city}, {order.shipping?.state} {order.shipping?.postcode}<br />
            {order.shipping?.country}
          </div>
        </section>
      </div>

      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-black/5 pb-4">
           <div className="p-2 bg-black/5 rounded-xl"><ShoppingBag size={16} /></div>
           <h3 className="font-black uppercase tracking-widest text-xs">Purchased Items</h3>
        </div>
        
        {/* Mobile List View */}
        <div className="md:hidden space-y-4">
          {order.line_items.map((it: any) => (
            <div key={it.id} className="glass-panel-heavy rounded-2xl p-4 border border-black/5 flex justify-between items-center gap-4">
              <div className="min-w-0">
                <Link href={`/products/${it.product_id}`} className="font-bold text-xs truncate leading-tight hover:underline">
                  {it.name}
                </Link>
                <div className="text-[8px] font-black text-black/20 uppercase tracking-widest mt-1">Ref: {it.sku || 'N/A'} • Qty: {it.quantity}</div>
              </div>
              <div className="text-right font-black text-xs shrink-0">
                <Price amount={it.total} />
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block glass-panel-heavy rounded-[2.5rem] border border-black/5 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/5 border-b border-black/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-black/30">Description</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-black/30 text-center">Qty</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-black/30 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {order.line_items.map((it: any) => (
                <tr key={it.id}>
                  <td className="px-8 py-6">
                    <Link href={`/products/${it.product_id}`} className="font-bold text-sm hover:underline">
                      {it.name}
                    </Link>
                    <div className="text-[9px] font-black text-black/20 uppercase tracking-widest mt-1">Ref: {it.sku || 'N/A'}</div>
                  </td>
                  <td className="px-8 py-6 text-center font-black text-black/40">{it.quantity}</td>
                  <td className="px-8 py-6 text-right font-black text-sm"><Price amount={it.total} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-black rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        <div className="flex items-center gap-6">
           <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl md:rounded-3xl flex items-center justify-center border border-white/10 shrink-0">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-white" />
           </div>
           <div className="text-center md:text-left">
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Payment Method</div>
              <div className="text-lg md:text-xl font-black">{order.payment_method_title || 'N/A'}</div>
           </div>
        </div>
        <div className="flex items-center gap-3 text-white/60">
           <CheckCircle2 size={20} className="text-green-400 shrink-0" />
           <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-center md:text-left">Transaction Verified and Secured</p>
        </div>
      </section>

      {/* Dynamic Actions: Cancel (30m) or Refund (Delivered) */}
      <OrderActions 
        orderId={order.id.toString()} 
        status={order.status} 
        createdAt={order.date_created} 
      />
    </div>
  );
}
