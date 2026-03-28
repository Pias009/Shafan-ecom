import { prisma } from "@/lib/prisma";
import SuperGuard from "../../_components/SuperGuard";
import { Users, ShieldCheck, Mail, UserPlus, ArrowRight, Trash2, Edit, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { updateAdminRole, deleteAdmin, resendInvite } from "../actions";

export const dynamic = 'force-dynamic';

export default async function SuperAdminManagementPage() {
  const admins = await prisma.user.findMany({
    where: { 
      OR: [
        { role: 'ADMIN' },
        { role: 'SUPERADMIN' }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  const pendingAdmins = admins.filter(a => !a.passwordHash);
  const activeAdmins = admins.filter(a => a.passwordHash);

  return (
    <SuperGuard>
      <div className="space-y-12 pb-20 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-black rounded-xl text-white"><ShieldCheck size={20} /></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Super Admin Console</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-black">Admin Management</h1>
            <p className="text-sm font-medium text-black/30 mt-2 max-w-md">Manage administrative roles, permissions, and access controls across all store instances.</p>
          </div>
          
          <div className="flex gap-4">
            <Link href="/ueadmin/super" className="px-6 py-4 rounded-full bg-black/5 text-black hover:bg-black hover:text-white transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-black/5">
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100/50 shadow-sm relative overflow-hidden group">
            <Users className="absolute -right-4 -bottom-4 w-32 h-32 text-indigo-100 group-hover:scale-110 transition-transform opacity-50" />
            <div className="relative">
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Total Admins</div>
              <div className="text-4xl font-black text-indigo-900">{admins.length}</div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[9px] font-bold text-indigo-800/40 uppercase">System-wide access</span>
              </div>
            </div>
          </div>
          
          <div className="p-8 rounded-[2.5rem] bg-emerald-50 border border-emerald-100/50 shadow-sm relative overflow-hidden group">
            <CheckCircle className="absolute -right-4 -bottom-4 w-32 h-32 text-emerald-100 group-hover:scale-110 transition-transform opacity-50" />
            <div className="relative">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Active Admins</div>
              <div className="text-4xl font-black text-emerald-900">{activeAdmins.length}</div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[9px] font-bold text-emerald-800/40 uppercase">Password set & verified</span>
              </div>
            </div>
          </div>
          
          <div className="p-8 rounded-[2.5rem] bg-orange-50 border border-orange-100/50 shadow-sm relative overflow-hidden group">
            <UserPlus className="absolute -right-4 -bottom-4 w-32 h-32 text-orange-100 group-hover:scale-110 transition-transform opacity-50" />
            <div className="relative">
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">Pending Invites</div>
              <div className="text-4xl font-black text-orange-900">{pendingAdmins.length}</div>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[9px] font-bold text-orange-800/40 uppercase">Awaiting activation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Admin List Table */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Users size={20} className="text-black/30" /> All Administrative Accounts
            </h3>
            <Link href="/ueadmin/super" className="text-[10px] font-black uppercase tracking-widest text-black/30 hover:text-black transition">
              Invite New Admin
            </Link>
          </div>

          <div className="glass-panel-heavy rounded-[3rem] border border-black/5 bg-white shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black text-white border-b border-white/10 text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-6">Admin</th>
                    <th className="px-8 py-6">Role</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6">Created</th>
                    <th className="px-8 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 font-medium">
                  {admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-black/[0.01] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center font-black text-sm border border-black/5 group-hover:bg-black group-hover:text-white transition-all">
                            {admin.email?.substring(0, 2).toUpperCase() || '??'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm truncate max-w-[200px]">{admin.email || 'No email'}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-black/20 flex items-center gap-2 mt-1">
                              <Mail size={10} /> ID: {admin.id.substring(0, 8)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${admin.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-black/5 text-black'}`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {admin.passwordHash ? (
                            <>
                              <CheckCircle size={14} className="text-emerald-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={14} className="text-orange-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-orange-600">Pending</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-sm font-bold text-black">
                          {new Date(admin.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-[9px] font-black text-black/20 uppercase tracking-widest">
                          {new Date(admin.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!admin.passwordHash && (
                            <form action={resendInvite}>
                              <input type="hidden" name="email" value={admin.email || ''} />
                              <button type="submit" className="p-2 hover:bg-black rounded-xl text-black/10 hover:text-white transition-all" title="Resend Invite">
                                <Mail size={16} />
                              </button>
                            </form>
                          )}
                          
                          {admin.role !== 'SUPERADMIN' && (
                            <>
                              <form action={updateAdminRole}>
                                <input type="hidden" name="userId" value={admin.id} />
                                <input type="hidden" name="role" value={admin.role === 'ADMIN' ? 'SUPERADMIN' : 'ADMIN'} />
                                <button type="submit" className="p-2 hover:bg-black rounded-xl text-black/10 hover:text-white transition-all" title="Toggle Role">
                                  <Edit size={16} />
                                </button>
                              </form>
                              
                              <form action={deleteAdmin}>
                                <input type="hidden" name="userId" value={admin.id} />
                                <button type="submit" className="p-2 hover:bg-red-500 rounded-xl text-black/10 hover:text-white transition-all" title="Remove Admin">
                                  <Trash2 size={16} />
                                </button>
                              </form>
                            </>
                          )}
                          
                          <Link href={`/ueadmin/users/${admin.id}`} className="p-2 hover:bg-black rounded-xl text-black/10 hover:text-white transition-all">
                            <ArrowRight size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Security Notes */}
        <div className="glass-panel-heavy p-8 rounded-[2.5rem] bg-black text-white space-y-6">
          <div className="flex items-center gap-4">
            <ShieldCheck size={24} className="text-white/40" />
            <h3 className="text-xl font-bold">Security Protocol</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/40">Role Definitions</h4>
              <ul className="space-y-2 text-sm font-medium text-white/70">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span>SUPERADMIN: Full system access, can manage other admins</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span>ADMIN: Standard administrative access to assigned stores</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/40">Invitation Flow</h4>
              <ul className="space-y-2 text-sm font-medium text-white/70">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span>Pending admins must set password on first login</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span>Active admins have full access to their assigned regions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SuperGuard>
  );
}