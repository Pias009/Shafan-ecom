import React from 'react';
import Link from 'next/link';
import { Prisma, Role } from '@prisma/client';
import { ChevronLeft, ChevronRight, Search, Users as UsersIcon, X } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Badge, EmptyState, PageHeader, btn, initials } from '../_components/ui';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Customers' };

const PAGE_SIZE = 50;
const ROLE_TABS = [
  { key: 'ALL', label: 'Everyone' },
  { key: 'USER', label: 'Customers' },
  { key: 'ADMIN', label: 'Admins' },
  { key: 'SUPERADMIN', label: 'Super admins' },
] as const;

function usersHref(params: { q?: string; role?: string; page?: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.role && params.role !== 'ALL') sp.set('role', params.role);
  if (params.page && params.page > 1) sp.set('page', String(params.page));
  const qs = sp.toString();
  return `/ueadmin/users${qs ? `?${qs}` : ''}`;
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; role?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params?.q || '').trim();
  const role = params?.role && params.role in Role ? (params.role as Role) : 'ALL';
  const page = Math.max(1, Number.parseInt(params?.page || '1', 10) || 1);

  const searchWhere: Prisma.UserWhereInput = q
    ? {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      }
    : {};
  const where: Prisma.UserWhereInput = role === 'ALL' ? searchWhere : { ...searchWhere, role };

  const [users, total, roleGroups] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        country: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({ by: ['role'], where: searchWhere, _count: { _all: true } }),
  ]);

  const roleCounts: Record<string, number> = { ALL: 0 };
  for (const g of roleGroups) {
    roleCounts[g.role] = g._count._all;
    roleCounts.ALL += g._count._all;
  }
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${(roleCounts.USER || 0).toLocaleString()} customers · ${((roleCounts.ADMIN || 0) + (roleCounts.SUPERADMIN || 0)).toLocaleString()} team members`}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-100 px-3 pt-2 [scrollbar-width:none]">
          {ROLE_TABS.map((t) => {
            const active = t.key === role;
            return (
              <Link
                key={t.key}
                href={usersHref({ q, role: t.key })}
                className={`relative flex shrink-0 items-center gap-2 px-3 pb-2.5 pt-1.5 text-sm ${active ? 'font-medium text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {(roleCounts[t.key] || 0).toLocaleString()}
                </span>
                {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-slate-900" />}
              </Link>
            );
          })}
        </div>

        <form action="/ueadmin/users" className="flex items-center gap-2 border-b border-slate-100 p-3">
          {role !== 'ALL' && <input type="hidden" name="role" value={role} />}
          <div className="relative flex-1 sm:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name, email or phone"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400"
            />
          </div>
          <button type="submit" className={btn.secondary}>Search</button>
          {q && (
            <Link href={usersHref({ role })} className={btn.ghost}>
              <X size={14} /> Clear
            </Link>
          )}
        </form>

        {users.length === 0 ? (
          <EmptyState icon={<UsersIcon size={20} />} title={q ? `No one matches “${q}”` : 'No users yet'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50/80 text-xs text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Role</th>
                  <th className="px-3 py-2.5 font-medium">Country</th>
                  <th className="px-3 py-2.5 text-right font-medium">Orders</th>
                  <th className="px-3 py-2.5 font-medium">Joined</th>
                  <th className="w-8 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <Link href={`/ueadmin/users/${u.id}`} className="flex items-center gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-600">
                          {initials(u.name, u.email)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900 group-hover:underline">{u.name || 'Unnamed'}</span>
                          <span className="block truncate text-xs text-slate-500">{u.email || u.phone || '—'}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      {u.role === 'SUPERADMIN' ? <Badge tone="violet">Super admin</Badge> : u.role === 'ADMIN' ? <Badge tone="blue">Admin</Badge> : <Badge>Customer</Badge>}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{u.country || '—'}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-slate-900">{u._count.orders}</td>
                    <td className="px-3 py-3 text-slate-600">
                      {u.createdAt.toLocaleDateString('en-US', { dateStyle: 'medium', timeZone: 'Asia/Dubai' })}
                    </td>
                    <td className="px-3 py-3 text-slate-300 group-hover:text-slate-500">
                      <Link href={`/ueadmin/users/${u.id}`} aria-label={`Open ${u.name || u.email}`}>
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row">
            <span className="tabular-nums">
              Showing <span className="font-medium text-slate-900">{from.toLocaleString()}–{to.toLocaleString()}</span> of{' '}
              <span className="font-medium text-slate-900">{total.toLocaleString()}</span>
            </span>
            <div className="flex items-center gap-1">
              {page > 1 ? (
                <Link href={usersHref({ q, role, page: page - 1 })} className={`${btn.secondary} h-8 px-2.5`}><ChevronLeft size={15} /> Prev</Link>
              ) : (
                <span className={`${btn.secondary} h-8 px-2.5 opacity-50`}><ChevronLeft size={15} /> Prev</span>
              )}
              <Badge>{page} / {pageCount}</Badge>
              {page < pageCount ? (
                <Link href={usersHref({ q, role, page: page + 1 })} className={`${btn.secondary} h-8 px-2.5`}>Next <ChevronRight size={15} /></Link>
              ) : (
                <span className={`${btn.secondary} h-8 px-2.5 opacity-50`}>Next <ChevronRight size={15} /></span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
