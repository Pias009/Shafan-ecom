"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Search, X } from "lucide-react";
import { useAdminSession } from "./AdminSessionContext";
import { isActive, visibleGroups } from "./admin-nav";
import { initials } from "./ui";

export function AdminSidebar({
  collapsed = false,
  onClose,
  onOpenSearch,
}: {
  collapsed?: boolean;
  onClose?: () => void;
  onOpenSearch?: () => void;
}) {
  const { data: session } = useAdminSession();
  const pathname = usePathname();
  const router = useRouter();
  const groups = visibleGroups(session?.role === "SUPERADMIN");

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/ueadmin/login");
      router.refresh();
    }
  };

  return (
    <aside
      className={`adm-dark flex h-full flex-col bg-[#0E1013] text-slate-200 transition-[width] duration-200 ${collapsed ? "w-[68px]" : "w-[260px]"}`}
      data-lenis-prevent="true"
      aria-label="Admin navigation"
    >
      {/* Brand */}
      <div className={`flex h-14 shrink-0 items-center gap-3 border-b border-white/[0.06] ${collapsed ? "justify-center" : "px-4"}`}>
        <Link href="/ueadmin/dashboard" className="flex min-w-0 items-center gap-3" onClick={() => onClose?.()}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#a3115f] to-[#5c0438] text-[13px] font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            S
          </span>
          {!collapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block text-[13px] font-semibold tracking-wide text-white">SHANFA</span>
              <span className="block text-[11px] text-slate-400">Store admin</span>
            </span>
          )}
        </Link>
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search trigger */}
      <div className="shrink-0 px-3 pt-3">
        <button
          onClick={onOpenSearch}
          className={`flex h-9 w-full items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] text-[13px] text-slate-300 transition-colors hover:border-white/15 hover:text-white ${collapsed ? "justify-center" : "px-3"}`}
          title="Search (Ctrl/⌘ K)"
        >
          <Search size={15} />
          {!collapsed && (
            <>
              <span>Jump to…</span>
              <kbd className="ml-auto rounded border border-white/10 px-1.5 text-[10px] font-medium text-slate-400">⌘K</kbd>
            </>
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="adm-dark-scroll flex-1 overflow-y-auto px-3 pb-4 pt-2">
        {groups.map((group) => (
          <div key={group.title} className="mt-4 first:mt-2">
            {!collapsed ? (
              <div className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                {group.title}
              </div>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-white/[0.06]" />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => onClose?.()}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex h-9 items-center gap-3 rounded-lg text-[13.5px] transition-colors ${
                        collapsed ? "justify-center" : "px-2.5"
                      } ${
                        active
                          ? "bg-white/[0.08] font-medium text-white"
                          : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#d6338a]" />
                      )}
                      <Icon
                        size={17}
                        strokeWidth={active ? 2.2 : 1.8}
                        className={active ? "text-[#f06aae]" : "text-slate-400 group-hover:text-slate-200"}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Account */}
      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className={`flex items-center gap-3 ${collapsed ? "flex-col" : "px-1.5 py-1"}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-700/60 text-[11px] font-semibold text-slate-100">
            {initials(session?.name, session?.email)}
          </span>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-medium text-slate-100">{session?.name || "Admin"}</div>
              <div className="truncate text-[11px] text-slate-400">
                {session?.role === "SUPERADMIN" ? "Super admin" : "Admin"} · {session?.email}
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-rose-400"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
