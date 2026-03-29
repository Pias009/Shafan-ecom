import { prisma } from "@/lib/prisma";
import SuperGuard from "../../_components/SuperGuard";
import { AlertCircle, CheckCircle, XCircle, Clock, User, Store, Globe, Shield } from "lucide-react";
import Link from "next/link";
import { approveLoginRequest, rejectLoginRequest } from "../approval-actions";

export const dynamic = 'force-dynamic';

export default async function SuperAdminApprovalsPage() {
  // Fetch pending login approvals
  const pendingApprovals = await prisma.loginApproval.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch recent processed approvals
  const recentApprovals = await prisma.loginApproval.findMany({
    where: {
      status: { in: ["APPROVED", "REJECTED"] },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const stats = {
    pending: pendingApprovals.length,
    approved: recentApprovals.filter(a => a.status === "APPROVED").length,
    rejected: recentApprovals.filter(a => a.status === "REJECTED").length,
    total: pendingApprovals.length + recentApprovals.length,
  };

  return (
    <SuperGuard>
      <div className="space-y-12 pb-20 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black rounded-xl text-white"><Shield size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Super Admin Console</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-black">Login Approval Dashboard</h1>
            <p className="text-sm font-medium text-black/30 mt-2 max-w-md">
              Review and approve admin login requests. First-time admin logins require super admin approval.
            </p>
          </div>
          
          <div className="flex gap-4">
            <Link href="/ueadmin/super" className="px-6 py-4 rounded-full bg-black/5 text-black hover:bg-black hover:text-white transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-black/5">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-[2rem] bg-orange-50 border border-orange-100/50 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-orange-500" />
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">Pending</div>
            </div>
            <div className="text-3xl font-black text-orange-900">{stats.pending}</div>
            <div className="mt-2 text-xs text-orange-700/60">Awaiting review</div>
          </div>
          
          <div className="p-6 rounded-[2rem] bg-emerald-50 border border-emerald-100/50 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Approved</div>
            </div>
            <div className="text-3xl font-black text-emerald-900">{stats.approved}</div>
            <div className="mt-2 text-xs text-emerald-700/60">Login requests approved</div>
          </div>
          
          <div className="p-6 rounded-[2rem] bg-rose-50 border border-rose-100/50 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <XCircle className="w-5 h-5 text-rose-500" />
              <div className="text-[10px] font-black uppercase tracking-widest text-rose-400">Rejected</div>
            </div>
            <div className="text-3xl font-black text-rose-900">{stats.rejected}</div>
            <div className="mt-2 text-xs text-rose-700/60">Login requests rejected</div>
          </div>
          
          <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100/50 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-slate-500" />
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total</div>
            </div>
            <div className="text-3xl font-black text-slate-900">{stats.total}</div>
            <div className="mt-2 text-xs text-slate-700/60">All login requests</div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Clock size={20} className="text-orange-500" /> Pending Login Requests
            </h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-black/30">
              {stats.pending} requests waiting
            </span>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="glass-panel-heavy p-12 rounded-[3rem] border border-black/5 bg-white shadow-sm text-center">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h4 className="text-xl font-bold text-black mb-2">No pending requests</h4>
              <p className="text-sm text-black/40 max-w-md mx-auto">
                All admin login requests have been processed. New requests will appear here when admins attempt to login for the first time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="glass-panel-heavy p-6 rounded-[2.5rem] border border-black/5 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-xl">
                        <User className="w-4 h-4 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-black">{approval.user?.name || approval.adminName}</h4>
                        <p className="text-xs text-black/40">{approval.adminEmail}</p>
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-orange-100 text-orange-600 rounded-full">
                      PENDING
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Store className="w-3 h-3 text-black/30" />
                      <span className="text-black/60">Store:</span>
                      <span className="font-medium">{approval.storeCode || 'UAE'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-3 h-3 text-black/30" />
                      <span className="text-black/60">IP:</span>
                      <span className="font-mono text-xs">{approval.ipAddress || 'Unknown'}</span>
                    </div>
                    <div className="text-xs text-black/40">
                      Requested: {new Date(approval.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <form action={async (formData) => {
                    await approveLoginRequest(formData);
                  }} className="space-y-3">
                    <input type="hidden" name="approvalId" value={approval.id} />
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        name="action"
                        value="approve"
                        className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all"
                      >
                        Approve Login
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt("Enter rejection reason:");
                          if (reason) {
                            const form = document.createElement('form');
                            form.method = 'POST';
                            form.action = '/ueadmin/super/approvals/actions';
                            const idInput = document.createElement('input');
                            idInput.type = 'hidden';
                            idInput.name = 'approvalId';
                            idInput.value = approval.id;
                            form.appendChild(idInput);
                            const actionInput = document.createElement('input');
                            actionInput.type = 'hidden';
                            actionInput.name = 'action';
                            actionInput.value = 'reject';
                            form.appendChild(actionInput);
                            const reasonInput = document.createElement('input');
                            reasonInput.type = 'hidden';
                            reasonInput.name = 'rejectionReason';
                            reasonInput.value = reason;
                            form.appendChild(reasonInput);
                            document.body.appendChild(form);
                            form.submit();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600 transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Activity Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <AlertCircle size={20} className="text-slate-500" /> Recent Activity
            </h3>
          </div>

          <div className="glass-panel-heavy rounded-[3rem] border border-black/5 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black text-white border-b border-white/10 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-6">Admin</th>
                    <th className="px-8 py-6">Store</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6">Time</th>
                    <th className="px-8 py-6">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApprovals.map((approval) => (
                    <tr key={approval.id} className="border-b border-black/5 hover:bg-black/2 transition-colors">
                      <td className="px-8 py-6">
                        <div>
                          <div className="font-medium">{approval.user?.name || approval.adminName}</div>
                          <div className="text-xs text-black/40">{approval.adminEmail}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-medium">{approval.storeCode || 'UAE'}</div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          approval.status === 'APPROVED' 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-rose-100 text-rose-600'
                        }`}>
                          {approval.status}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm text-black/60">
                          {new Date(approval.updatedAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        {approval.status === 'REJECTED' && approval.rejectionReason && (
                          <div className="text-xs text-black/40" title={approval.rejectionReason}>
                            Reason: {approval.rejectionReason.substring(0, 30)}...
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </SuperGuard>
  );
}