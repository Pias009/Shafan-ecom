import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { User, Mail, Calendar, ChevronRight, Search, Filter } from 'lucide-react';

export default async function UsersPage() {
  const users = await (prisma as any).user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 md:px-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-black tracking-tight mb-2">Users Management</h1>
          <p className="text-sm font-bold text-black/60 uppercase tracking-[0.2em] leading-none">
            {users.length} Total Customers & Administrators
          </p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/50 group-focus-within:text-black transition-colors" size={16} />
                <input
                    type="text"
                    placeholder="Search Users..."
                    className="h-12 w-64 bg-black/5 rounded-2xl pl-12 pr-6 text-sm font-bold outline-none focus:ring-4 focus:ring-black/5 transition-all"
                />
            </div>
            <button className="h-12 w-12 bg-black/5 rounded-2xl flex items-center justify-center text-black/70 hover:bg-black/10 transition-all">
                <Filter size={18} />
            </button>
        </div>
      </div>

      <div className="glass-panel-heavy rounded-[2.5rem] border border-black/5 bg-white shadow-2xl shadow-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02] text-[10px] font-black uppercase tracking-widest text-black/60">
                <th className="px-8 py-5">User Identity</th>
                <th className="px-8 py-5">Account Status</th>
                <th className="px-8 py-5">Registration Date</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {users.map((u: any) => (
                <tr key={u.id} className="group hover:bg-black/[0.01] transition-all">
                  <td className="px-8 py-6">
                    <Link href={`/ueadmin/users/${u.id}`} className="flex items-center gap-4 group/item">
                      <div className="h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center text-black/50 group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-lg shadow-transparent group-hover:shadow-black/20">
                        <User size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-black text-base group-hover/item:underline">{u.name || 'Anonymous User'}</div>
                        <div className="text-[10px] font-bold text-black/70 flex items-center gap-1.5 uppercase tracking-wider mt-0.5">
                            <Mail size={10} className="text-black/40" />
                            {u.email}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                        u.role === 'SUPERADMIN' ? 'bg-black text-white border-black' :
                        u.role === 'ADMIN' ? 'bg-black/5 text-black border-black/10' :
                        'bg-white text-black/70 border-black/5'
                    }`}>
                        {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-black/70 text-xs font-semibold">
                      <Calendar size={14} className="text-black/40" />
                      {new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link
                      href={`/ueadmin/users/${u.id}`}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-black/5 text-black/50 hover:bg-black hover:text-white transition-all shadow-lg shadow-transparent hover:shadow-black/10"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
