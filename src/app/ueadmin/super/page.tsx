
import { prisma } from "@/lib/prisma";
import SuperGuard from "../_components/SuperGuard";
import { Users, Truck, Package, ShieldCheck, Mail, ArrowRight, UserPlus, Info, AlertCircle, Clock, UserCog, ScanFace } from "lucide-react";
import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import { inviteAdmin } from "./actions";

export const dynamic = 'force-dynamic';

export default async function SuperAdminConsole() {
  const [
    admins,
    ordersCount,
    inventoryCount,
    recentInvites,
    pendingApprovals
  ] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } }
    }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.user.findMany({
      where: { role: 'ADMIN', passwordHash: null }, // Simple invite flag
      take: 5,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.loginApproval.count({
      where: { status: "PENDING" }
    })
  ]);

  return (
    <SuperGuard>
      <div className="space-y-12 pb-20 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
             <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-black rounded-xl text-white"><ShieldCheck size={20} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Super Admin Context</span>
             </div>
             <h1 className="text-5xl font-black tracking-tight text-black">System Authority</h1>
             <p className="text-sm font-medium text-black/30 mt-2 max-w-md">Complete global control: Manage all store instances, administrative roles, and system logs from one unified panel.</p>
          </div>
          
<div className="flex gap-4">
              <Link href="/ueadmin/admin-face" className="px-6 py-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <ScanFace size={16} /> Face Login
              </Link>
              <Link href="/ueadmin" className="px-6 py-4 rounded-full bg-black/5 text-black hover:bg-black hover:text-white transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-black/5">
                 Switch to Standard Admin
              </Link>
           </div>
        </div>

        {/* Global Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100/50 shadow-sm relative overflow-hidden group">
              <Users className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-100 group-hover:scale-110 transition-transform opacity-50" />
              <div className="relative">
                 <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Total Staff</div>
                 <div className="text-4xl font-black text-indigo-900">{admins.length}</div>
                 <div className="mt-4 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-indigo-800/40 uppercase">Global Access Enabled</span>
                 </div>
              </div>
           </div>
           <div className="p-8 rounded-[2.5rem] bg-emerald-50 border border-emerald-100/50 shadow-sm relative overflow-hidden group">
              <Package className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-100 group-hover:scale-110 transition-transform opacity-50" />
              <div className="relative">
                 <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Store Inventory</div>
                 <div className="text-4xl font-black text-emerald-900">{inventoryCount}</div>
                 <div className="mt-4 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-emerald-800/40 uppercase">Stock sync across regions</span>
                 </div>
              </div>
           </div>
           <div className="p-8 rounded-[2.5rem] bg-orange-50 border border-orange-100/50 shadow-sm relative overflow-hidden group">
              <Truck className="absolute -right-4 -bottom-4 w-32 h-32 text-orange-100 group-hover:scale-110 transition-transform opacity-50" />
              <div className="relative">
                 <div className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">Marketplace Orders</div>
                 <div className="text-4xl font-black text-orange-900">{ordersCount}</div>
                 <div className="mt-4 flex items-center gap-2">
                    <span className="text-[9px] font-bold text-orange-800/40 uppercase">Pending review required</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Pending Approvals Alert */}
        {pendingApprovals > 0 && (
          <div className="glass-panel-heavy p-8 rounded-[2.5rem] border border-orange-200 bg-orange-50 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-500 rounded-2xl text-white">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-orange-900">Pending Login Approvals</h3>
                  <p className="text-sm text-orange-700/70">
                    {pendingApprovals} admin login request{pendingApprovals !== 1 ? 's' : ''} waiting for your review
                  </p>
                </div>
              </div>
              <Link
                href="/ueadmin/super/approvals"
                className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm hover:bg-orange-600 transition-all flex items-center gap-2"
              >
                <Clock size={16} />
                Review Now
              </Link>
            </div>
          </div>
        )}

<div className="grid lg:grid-cols-12 gap-10">
            {/* Section 1: Admin Controls */}
            <section className="lg:col-span-12 space-y-6">
               <div className="flex items-center justify-between px-4">
                  <h3 className="text-xl font-bold flex items-center gap-3">
                     <Users size={20} className="text-black/30" /> Admin Controls
                  </h3>
                  <div className="flex gap-4">
                    <Link href="/ueadmin/super/face" className="text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition">Face Enrollment</Link>
                    <Link href="/ueadmin/super/admins" className="text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition">Manage Permissions</Link>
                   {pendingApprovals > 0 && (
                     <Link href="/ueadmin/super/approvals" className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600 transition flex items-center gap-1">
                       <AlertCircle size={12} />
                       {pendingApprovals} Pending
                     </Link>
                   )}
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Invite Form / Tool */}
                <div className="glass-panel-heavy p-8 rounded-[2.5rem] bg-white border border-black/5 shadow-xl space-y-8">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-black rounded-2xl text-white shadow-xl shadow-black/20"><UserPlus size={20} /></div>
                      <div>
                        <h4 className="font-black text-base uppercase tracking-tight">Invite System Admin</h4>
                        <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Global access grant</p>
                      </div>
                   </div>
                   
                   <p className="text-[11px] font-medium text-black/50 leading-relaxed italic border-l-2 border-black/10 pl-4">
                      Invited admins will receive an initialization link where they setup their official password. Until then, their access remains restricted.
                   </p>

                   <form action={inviteAdmin} className="space-y-4">
                      <div className="relative">
                         <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-black/20" size={18} />
                         <input 
                           type="email" 
                           name="email"
                           required
                           placeholder="admin@shanfa.com"
                           className="w-full h-16 pl-14 pr-6 rounded-full bg-black/5 border-none font-bold text-sm focus:ring-2 focus:ring-black transition-all"
                         />
                      </div>
                      <button type="submit" className="w-full h-16 rounded-full bg-black text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all">
                        Dispatch Invite
                      </button>
                   </form>
                </div>

                {/* Staff List */}
                <div className="glass-panel-heavy p-8 rounded-[2.5rem] bg-white border border-black/5 shadow-xl space-y-6">
                   <h4 className="font-bold text-sm uppercase tracking-widest text-black/20 px-2">Active Administrative Staff</h4>
                   <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {admins.map((a) => (
                         <div key={a.id} className="flex items-center justify-between p-4 bg-black/[0.02] rounded-2xl border border-black/5 hover:border-black/10 transition-all group">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center font-black text-[10px] border border-black/5 group-hover:bg-black group-hover:text-white transition-all">
                                  {a.email?.substring(0, 2).toUpperCase()}
                               </div>
                               <div className="min-w-0">
                                  <div className="font-bold text-sm truncate max-w-[150px]">{a.email}</div>
                                  <div className="text-[9px] font-black uppercase tracking-widest text-black/20 flex items-center gap-2">
                                     {a.role} {a.passwordHash ? <span className="text-emerald-500 flex items-center gap-1">• Active</span> : <span className="text-orange-500">• Pending</span>}
                                  </div>
                               </div>
                            </div>
                            <Link href={`/ueadmin/users/${a.id}`} className="p-2 hover:bg-black rounded-lg text-black/10 hover:text-white transition-all"><ArrowRight size={14} /></Link>
                         </div>
                      ))}
                   </div>
                </div>
              </div>
           </section>

           {/* Section 2: Global Operations */}
           <section className="lg:col-span-12 grid md:grid-cols-2 gap-10">
              <div className="space-y-6">
                 <h3 className="text-xl font-bold flex items-center gap-3">
                    <Package size={20} className="text-black/30" /> Inventory Check
                 </h3>
                 <div className="glass-panel-heavy rounded-[2.5rem] border border-black/10 bg-black text-white p-10 space-y-8 shadow-2xl overflow-hidden relative group">
                    <div className="relative">
                       <h4 className="text-3xl font-black">Regional Cross-Check</h4>
                       <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-2">Inventory verification across global stores</p>
                    </div>
                    
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] border-l-2 border-indigo-500 pl-4">
                       <ShieldCheck className="text-indigo-400" size={14} /> Critical Data Access Only
                    </div>

                    <Link href="/ueadmin/super/inventory" className="w-full h-16 rounded-full bg-white text-black font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                       Audit Inventory <ArrowRight className="ml-2" size={16} />
                    </Link>
                 </div>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xl font-bold flex items-center gap-3">
                    <Truck size={20} className="text-black/30" /> All Global Orders
                 </h3>
                 <div className="glass-panel-heavy rounded-[2.5rem] border border-black/5 bg-white p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                    <div className="relative">
                       <h4 className="text-3xl font-black text-black">Order Flow Audit</h4>
                       <p className="text-black/30 text-xs font-bold uppercase tracking-widest mt-2">Manage processing & fraudulent data</p>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] border-l-2 border-black/20 pl-4 text-black/40">
                       <Info size={14} /> Total Orders: {ordersCount}
                    </div>

                    <Link href="/ueadmin/orders" className="w-full h-16 rounded-full bg-black text-white font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                       Review History <ArrowRight className="ml-2" size={16} />
                    </Link>
                 </div>
              </div>
           </section>
        </div>
      </div>
    </SuperGuard>
  );
}

