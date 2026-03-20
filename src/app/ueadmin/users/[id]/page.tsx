import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowLeft, Mail, User, ShoppingBag, History, Calendar, DollarSign, Package, Lock, ShieldCheck } from 'lucide-react';

export default async function UserDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;

  // Fetch user and their orders
  const userData = await (prisma as any).user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!userData) {
    return (
      <div className="pt-32 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-black/5 text-black/20 text-4xl mb-6">?</div>
        <h1 className="text-2xl font-black text-black mb-2">User Not Found</h1>
        <Link href="/ueadmin/users" className="text-sm font-bold text-black/40 hover:text-black transition-colors underline decoration-black/10 underline-offset-4">Back to Users</Link>
      </div>
    );
  }

  const totalSpent = userData.orders.reduce((acc: number, order: any) => acc + (order.totalCents || 0), 0);
  const totalOrders = userData.orders.length;

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href="/ueadmin/users" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition mb-4">
            <ArrowLeft size={14} /> Back to Users
          </Link>
          <h1 className="text-4xl font-black text-black flex items-center gap-4">
            {userData.name || 'Anonymous User'}
            <span className="px-3 py-1 rounded-full bg-black/5 text-[10px] font-black uppercase tracking-widest border border-black/5 text-black/40">
                User Profile
            </span>
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: User Info */}
        <div className="space-y-6">
            <section className="glass-panel p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-xl shadow-black/5">
                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-black/5">
                    <div className="h-12 w-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/20">
                        <User size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-black leading-tight">Identity Details</h3>
                        <p className="text-[10px] uppercase font-black tracking-widest text-black/20">Personal Information</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 block mb-1">Full Name</label>
                        <p className="font-bold text-black">{userData.name || 'Not Provided'}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 block mb-1">Email Address</label>
                        <div className="flex items-center gap-2 text-black font-bold">
                            <Mail size={14} className="text-black/20" />
                            {userData.email}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 block mb-1">Origin / Country (IP Based)</label>
                        <div className="flex items-center gap-2 text-black font-bold">
                            <div className="h-5 w-8 bg-black/5 rounded-sm flex items-center justify-center text-[10px] text-black/40">
                                {userData.country || '??'}
                            </div>
                            {userData.country || 'Unknown Location'}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 block mb-1">Verification Status</label>
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            userData.isVerified ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
                        }`}>
                            <ShieldCheck size={10} />
                            {userData.isVerified ? 'Verified Account' : 'Unverified Email'}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 block mb-1">User ID</label>
                        <p className="font-mono text-[10px] text-black/40 break-all">{userData.id}</p>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/30 block mb-1">Joined Date</label>
                        <div className="flex items-center gap-2 text-black/60 font-semibold text-sm">
                            <Calendar size={14} className="text-black/20" />
                            {new Date(userData.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Card */}
            <section className="bg-black p-8 rounded-[2.5rem] border border-white/5 text-white shadow-2xl shadow-black/20 overflow-hidden relative">
                <div className="relative z-10 flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                         <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center"><ShoppingBag size={18} /></div>
                         <div className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Value</div>
                    </div>
                    <div>
                        <h2 className="text-5xl font-black mb-1">${(totalSpent / 100).toFixed(2)}</h2>
                        <p className="text-[10px] uppercase font-black tracking-widest text-white/30">LTV (Life Time Value)</p>
                    </div>
                    <div className="grid grid-cols-2 pt-6 border-t border-white/10">
                        <div>
                             <p className="text-2xl font-black leading-none">{totalOrders}</p>
                             <p className="text-[8px] uppercase font-black tracking-widest text-white/20 mt-1">Total Orders</p>
                        </div>
                        <div className="text-right">
                             <p className="text-2xl font-black leading-none">${totalOrders > 0 ? (totalSpent / 100 / totalOrders).toFixed(2) : '0.00'}</p>
                             <p className="text-[8px] uppercase font-black tracking-widest text-white/20 mt-1">Avg Ticket</p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 bg-white/5 rounded-full blur-3xl"></div>
            </section>

            {/* Password Change Card */}
            <section className="glass-panel p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-xl shadow-black/5">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center">
                        <Lock size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-black leading-tight">Security</h3>
                        <p className="text-[10px] uppercase font-black tracking-widest text-black/20">Update Password</p>
                    </div>
                </div>

                <form action={`/api/admin/users/${userData.id}`} method="POST" className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-black/40">New Secret Password</label>
                        <input 
                            name="password"
                            type="password" 
                            placeholder="••••••••••••"
                            className="h-12 w-full rounded-2xl bg-black/5 px-4 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full h-12 rounded-full bg-black text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10">
                        Update Security Key
                    </button>
                </form>
            </section>
        </div>

        {/* Right Column: Order History */}
        <div className="lg:col-span-2 space-y-6">
            <section className="glass-panel rounded-[2.5rem] border border-black/5 bg-white shadow-xl shadow-black/5 overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-8 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
                    <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-black/5 text-black/40 flex items-center justify-center"><History size={18} /></div>
                         <h3 className="font-black text-xl text-black">Order History</h3>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/20">Recent Transactions</span>
                </div>

                <div className="flex-1">
                    {userData.orders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-black/5 text-[10px] font-black uppercase tracking-widest text-black/30">
                                        <th className="px-8 py-4">Order ID</th>
                                        <th className="px-8 py-4">Date</th>
                                        <th className="px-8 py-4">Status</th>
                                        <th className="px-8 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5">
                                    {userData.orders.map((order: any) => (
                                        <tr key={order.id} className="hover:bg-black/[0.01] transition-colors group">
                                            <td className="px-8 py-6">
                                                <Link href={`/ueadmin/orders/${order.id}`} className="font-bold text-black flex items-center gap-2 hover:underline">
                                                    <span className="text-[10px] text-black/20 font-mono">#</span>
                                                    {order.id.slice(-8)}
                                                </Link>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-semibold text-black/60">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                                    order.status === 'DELIVERED' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 
                                                    order.status === 'PAID' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                    'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="font-black text-black">
                                                    ${(order.totalCents / 100).toFixed(2)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-20 opacity-20">
                            <Package size={60} strokeWidth={1} />
                            <p className="mt-4 font-black uppercase tracking-widest text-xs">No orders yet</p>
                        </div>
                    )}
                </div>

                {userData.orders.length >= 10 && (
                    <div className="p-6 border-t border-black/5 bg-black/[0.01] text-center">
                         <Link href={`/ueadmin/orders?userId=${userData.id}`} className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors">
                             View Complete History
                         </Link>
                    </div>
                )}
            </section>
        </div>
      </div>
    </div>
  );
}
