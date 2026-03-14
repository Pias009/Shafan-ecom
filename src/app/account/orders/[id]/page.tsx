import { getServerAuthSession } from "@/lib/auth";
import { wooApi } from "@/lib/woocommerce";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, CreditCard, User, MapPin, CheckCircle2, ShoppingBag } from "lucide-react";
import { Price } from "@/components/Price";

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
    <div className="max-w-4xl mx-auto py-10 px-6 space-y-12">
      <Link href="/account/orders" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition">
        <ArrowLeft size={14} /> Back to My Orders
      </Link>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/5 pb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-5xl font-black tracking-tighter">Receipt #{order.id}</h1>
            <span className="bg-black text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              {order.status}
            </span>
          </div>
          <p className="text-sm font-bold text-black/30 uppercase tracking-widest">
            {new Date(order.date_created).toLocaleDateString()} at {new Date(order.date_created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-1">Total Paid</div>
          <Price amount={order.total} className="text-4xl font-black" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-black/5 pb-4">
             <div className="p-2 bg-black/5 rounded-xl"><User size={16} /></div>
             <h3 className="font-black uppercase tracking-widest text-xs">Customer Record</h3>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Name</div>
              <div className="font-bold">{order.billing?.first_name} {order.billing?.last_name}</div>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-black/20">Email Address</div>
              <div className="font-bold text-black/60">{order.billing?.email}</div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-black/5 pb-4">
             <div className="p-2 bg-black/5 rounded-xl"><MapPin size={16} /></div>
             <h3 className="font-black uppercase tracking-widest text-xs">Delivery Address</h3>
          </div>
          <div className="text-sm font-bold text-black/60 leading-relaxed uppercase tracking-widest text-[11px]">
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
        <div className="glass-panel-heavy rounded-[2.5rem] border border-black/5 overflow-hidden bg-white shadow-sm">
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
                    <div className="font-bold text-sm">{it.name}</div>
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

      <section className="bg-black rounded-[3rem] p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center border border-white/10">
              <CreditCard className="w-6 h-6 text-white" />
           </div>
           <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Payment Method</div>
              <div className="text-xl font-black">{order.payment_method_title || 'N/A'}</div>
           </div>
        </div>
        <div className="flex items-center gap-4 text-white/60">
           <CheckCircle2 size={24} className="text-green-400" />
           <p className="text-[10px] font-black uppercase tracking-[0.2em]">Transaction Verified and Secured</p>
        </div>
      </section>
    </div>
  );
}
