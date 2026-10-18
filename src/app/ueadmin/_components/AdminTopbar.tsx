"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Bell, ChevronRight, ExternalLink, Menu, PanelLeft, Search } from "lucide-react";
import { breadcrumbsFor } from "./admin-nav";
import { formatOrderNumber } from "@/lib/order-number";

type NewOrder = {
  id: string;
  createdAt: string;
  total: number | null;
  currency: string | null;
  paymentMethod?: string | null;
  email?: string | null;
  user?: { name: string | null; email: string | null } | null;
};

const SEEN_KEY = "adm-orders-seen-at";
const POLL_MS = 60_000;

function readSeen(): number {
  try {
    const v = Number(localStorage.getItem(SEEN_KEY));
    if (v > 0) return v;
  } catch {}
  return Date.now() - 24 * 60 * 60 * 1000;
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function NewOrdersBell() {
  const [orders, setOrders] = useState<NewOrder[]>([]);
  const [open, setOpen] = useState(false);
  const known = useRef<Set<string> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    if (document.visibilityState !== "visible") return;
    try {
      const res = await fetch(`/api/admin/orders/new?since=${readSeen()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const list: NewOrder[] = data.orders || [];
      // Toast only for orders that arrived while this tab was open.
      if (known.current) {
        const fresh = list.filter((o) => !known.current!.has(o.id));
        if (fresh.length > 0) {
          toast.success(
            fresh.length === 1
              ? `New order ${formatOrderNumber(fresh[0].id)} · ${(fresh[0].currency || "AED").toUpperCase()} ${(fresh[0].total || 0).toFixed(2)}`
              : `${fresh.length} new orders`,
            { position: "top-right", duration: 6000 },
          );
        }
      }
      known.current = new Set(list.map((o) => o.id));
      setOrders(list);
    } catch {}
  }, []);

  useEffect(() => {
    poll();
    const id = setInterval(poll, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && poll();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [poll]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const markSeen = () => {
    try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch {}
    known.current = new Set();
    setOrders([]);
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        aria-label={`New orders${orders.length ? ` (${orders.length})` : ""}`}
        title="New orders"
      >
        <Bell size={18} />
        {orders.length > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#b0115f] px-1 text-[10px] font-semibold leading-none text-white">
            {orders.length > 9 ? "9+" : orders.length}
          </span>
        )}
      </button>

      {open && (
        <div className="adm-pop absolute right-0 top-11 z-50 w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">New orders</div>
              <div className="text-xs text-slate-500">Paid or confirmed since you last checked</div>
            </div>
            {orders.length > 0 && (
              <button onClick={markSeen} className="text-xs font-medium text-[#9c0f55] hover:underline">
                Mark seen
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {orders.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">You’re all caught up.</p>
            ) : (
              orders.slice(0, 8).map((o) => (
                <Link
                  key={o.id}
                  href={`/ueadmin/orders/${o.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <Bell size={14} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-slate-900">
                      {formatOrderNumber(o.id)}
                      <span className="ml-2 font-normal tabular-nums text-slate-500">
                        {(o.currency || "AED").toUpperCase()} {(o.total || 0).toFixed(2)}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {o.user?.name || o.user?.email || o.email || "Guest"} · {timeAgo(o.createdAt)}
                    </span>
                  </span>
                </Link>
              ))
            )}
          </div>
          <Link
            href="/ueadmin/orders"
            onClick={() => setOpen(false)}
            className="block border-t border-slate-100 bg-slate-50/70 px-4 py-2.5 text-center text-xs font-medium text-slate-700 hover:text-slate-950"
          >
            View all orders
          </Link>
        </div>
      )}
    </div>
  );
}

export function AdminTopbar({
  onOpenMobileNav,
  onToggleCollapse,
  onOpenSearch,
}: {
  onOpenMobileNav: () => void;
  onToggleCollapse: () => void;
  onOpenSearch: () => void;
}) {
  const pathname = usePathname() || "/ueadmin";
  const crumbs = breadcrumbsFor(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200/80 bg-white/90 px-3 backdrop-blur-md sm:px-5">
      <button
        onClick={onOpenMobileNav}
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={19} />
      </button>
      <button
        onClick={onToggleCollapse}
        className="hidden h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:grid"
        aria-label="Collapse sidebar"
        title="Toggle sidebar (Ctrl/⌘ B)"
      >
        <PanelLeft size={18} />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1 text-sm">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <li key={c.href} className={`flex min-w-0 items-center gap-1 ${last ? "" : "hidden sm:flex"}`}>
                {i > 0 && <ChevronRight size={14} className="hidden shrink-0 text-slate-300 sm:block" />}
                {last ? (
                  <span className="truncate font-medium text-slate-900" aria-current="page">{c.label}</span>
                ) : (
                  <Link href={c.href} className="truncate text-slate-500 hover:text-slate-900">{c.label}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <button
        onClick={onOpenSearch}
        className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition-colors hover:border-slate-300 hover:bg-white md:flex"
      >
        <Search size={15} />
        <span>Search…</span>
        <kbd className="ml-auto rounded border border-slate-200 bg-white px-1.5 text-[10px] font-medium text-slate-400">⌘K</kbd>
      </button>
      <button
        onClick={onOpenSearch}
        className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
        aria-label="Search"
      >
        <Search size={18} />
      </button>

      <NewOrdersBell />

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 sm:flex"
      >
        View store <ExternalLink size={14} />
      </a>
    </header>
  );
}
