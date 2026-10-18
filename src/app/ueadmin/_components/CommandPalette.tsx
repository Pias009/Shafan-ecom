"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search, ShoppingBag, type LucideIcon } from "lucide-react";
import { QUICK_ACTIONS, visibleGroups } from "./admin-nav";

type Entry = { id: string; label: string; hint: string; href: string; icon: LucideIcon; haystack: string };

function score(entry: Entry, q: string): number {
  if (!q) return 1;
  const label = entry.label.toLowerCase();
  if (label.startsWith(q)) return 4;
  const idx = entry.haystack.indexOf(q);
  if (idx === 0) return 3;
  if (idx > 0) return entry.haystack[idx - 1] === " " ? 2 : 1;
  // loose subsequence match on the label only ("hsec" → "homepage sections")
  let i = 0;
  for (const ch of label) if (ch === q[i]) i++;
  return i === q.length && q.length >= 3 ? 0.5 : 0;
}

export function CommandPalette({ open, onClose, isSuper }: { open: boolean; onClose: () => void; isSuper: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const pages = visibleGroups(isSuper).flatMap((g) =>
      g.items.map((i) => ({
        id: i.href, label: i.label, hint: g.title, href: i.href, icon: i.icon,
        haystack: `${i.label} ${g.title} ${i.keywords || ""}`.toLowerCase(),
      })),
    );
    const actions = QUICK_ACTIONS.map((i) => ({
      id: `action:${i.href}`, label: i.label, hint: "Action", href: i.href, icon: i.icon,
      haystack: `${i.label} ${i.keywords || ""}`.toLowerCase(),
    }));
    return [...actions, ...pages];
  }, [isSuper]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = entries
      .map((e) => ({ e, s: score(e, q) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12)
      .map((r) => r.e);

    // Anything that could be an order number, email or phone also offers an order search.
    const raw = query.trim().replace(/^#/, "");
    if (raw.length >= 3) {
      matched.push({
        id: "search-orders",
        label: `Search orders for “${raw}”`,
        hint: "Order #, email, name or phone",
        href: `/ueadmin/orders?q=${encodeURIComponent(raw)}`,
        icon: ShoppingBag,
        haystack: "",
      });
    }
    return matched;
  }, [entries, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  const go = (entry?: Entry) => {
    if (!entry) return;
    onClose();
    router.push(entry.href);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Command menu">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="adm-pop relative w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search size={18} className="shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); go(results[cursor]); }
              else if (e.key === "Escape") { e.preventDefault(); onClose(); }
            }}
            placeholder="Search pages, actions, or an order number…"
            className="adm-bare h-12 w-full bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">ESC</kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-slate-500">No matches. Try “orders”, “banner” or an order number.</p>
          ) : (
            results.map((r, idx) => {
              const Icon = r.icon;
              const active = idx === cursor;
              return (
                <button
                  key={r.id}
                  data-idx={idx}
                  onMouseMove={() => setCursor(idx)}
                  onClick={() => go(r)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${active ? "bg-slate-100" : ""}`}
                >
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border ${active ? "border-slate-300 bg-white text-slate-900" : "border-slate-200 text-slate-500"}`}>
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900">{r.label}</span>
                    <span className="block truncate text-xs text-slate-500">{r.hint}</span>
                  </span>
                  {active && <CornerDownLeft size={14} className="shrink-0 text-slate-400" />}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-2 text-[11px] text-slate-500">
          <span><kbd className="font-sans">↑↓</kbd> navigate</span>
          <span><kbd className="font-sans">↵</kbd> open</span>
          <span className="ml-auto">Tip: type an order number to jump to it</span>
        </div>
      </div>
    </div>
  );
}
