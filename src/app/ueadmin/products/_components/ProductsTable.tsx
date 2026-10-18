"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, ImageOff, Leaf, MoreHorizontal, PackageSearch, Pencil, Search, Trash2, X } from 'lucide-react';
import { useAdminSession } from '../../_components/AdminSessionContext';
import { Badge, EmptyState, btn, formatMoney } from '../../_components/ui';

export interface ProductRow {
  id: string;
  name: string;
  sku: string | null;
  mainImage: string | null;
  stockQuantity: number;
  active: boolean;
  freshFromShelf: boolean;
  brand: { name: string } | null;
  productCategories: { category: { id: string; name: string } }[];
  countryPrices: { country: string; price: number | null; currency: string }[];
}

const PAGE_SIZE = 50;
const PRICE_ORDER = ['AE', 'SA', 'KW', 'QA', 'BH', 'OM'];

type StatusTab = 'all' | 'published' | 'draft' | 'low' | 'out';
const STATUS_TABS: { key: StatusTab; label: string; test: (p: ProductRow) => boolean }[] = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'published', label: 'Published', test: (p) => p.active },
  { key: 'draft', label: 'Draft', test: (p) => !p.active },
  { key: 'low', label: 'Low stock', test: (p) => p.stockQuantity > 0 && p.stockQuantity <= 5 },
  { key: 'out', label: 'Out of stock', test: (p) => p.stockQuantity <= 0 },
];

function primaryPrice(p: ProductRow) {
  const priced = p.countryPrices.filter((cp) => (cp.price ?? 0) > 0);
  return [...priced].sort((a, b) => PRICE_ORDER.indexOf(a.country) - PRICE_ORDER.indexOf(b.country))[0];
}

export function ProductsTable({ initialProducts }: { initialProducts: ProductRow[] }) {
  const router = useRouter();
  const { data: session } = useAdminSession();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('All');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState<StatusTab>('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => setProducts(initialProducts), [initialProducts]);
  useEffect(() => setPage(1), [search, brand, category, status]);

  const brands = useMemo(
    () => ['All', ...Array.from(new Set(products.map((p) => p.brand?.name).filter(Boolean) as string[])).sort()],
    [products],
  );

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    products.forEach((p) => p.productCategories.forEach((pc) => pc.category?.name && m.set(pc.category.name, (m.get(pc.category.name) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [products]);

  // Search + brand + category first, so the status tab counts reflect them.
  const baseFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !(
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.brand?.name || '').toLowerCase().includes(q)
      )) return false;
      if (brand !== 'All' && p.brand?.name !== brand) return false;
      if (category !== 'All' && !p.productCategories.some((pc) => pc.category.name === category)) return false;
      return true;
    });
  }, [products, search, brand, category]);

  const tabCounts = useMemo(
    () => Object.fromEntries(STATUS_TABS.map((t) => [t.key, baseFiltered.filter(t.test).length])) as Record<StatusTab, number>,
    [baseFiltered],
  );

  const filtered = useMemo(
    () => baseFiltered.filter(STATUS_TABS.find((t) => t.key === status)!.test),
    [baseFiltered, status],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selectedIds.has(p.id));
  const hasFilters = !!search || brand !== 'All' || category !== 'All';

  const toggleOne = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const toggleAllVisible = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visible.forEach((p) => (allVisibleSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });

  const deleteIds = async (ids: string[], label: string) => {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    setBusy(true);
    const tid = toast.loading('Deleting…');
    try {
      const res = await fetch('/api/admin/products/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error();
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSelectedIds(new Set());
      toast.success(ids.length === 1 ? 'Product deleted' : `${ids.length} products deleted`, { id: tid });
      router.refresh();
    } catch {
      toast.error('Could not delete. Please try again.', { id: tid });
    } finally {
      setBusy(false);
    }
  };

  const toggleFreshFromShelf = async (p: ProductRow) => {
    const next = !p.freshFromShelf;
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, freshFromShelf: next } : x)));
    try {
      const res = await fetch(`/api/admin/products/${p.id}/fresh-from-shelf`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ freshFromShelf: next }),
      });
      if (!res.ok) throw new Error();
      toast.success(next ? 'Added to Fresh from shelf' : 'Removed from Fresh from shelf');
    } catch {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, freshFromShelf: !next } : x)));
      toast.error('Could not update. Please try again.');
    }
  };

  const restockZeroStock = async () => {
    if (!confirm('Set stock to 100 for EVERY product that currently has 0 stock? Only do this if you know the real stock.')) return;
    const tid = toast.loading('Updating stock…');
    try {
      const res = await fetch('/api/admin/products/fix-stock', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed');
      toast.success(data.message, { id: tid });
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update stock', { id: tid });
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-100 px-3 pt-2 [scrollbar-width:none]">
        {STATUS_TABS.map((t) => {
          const active = t.key === status;
          return (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={`relative flex shrink-0 items-center gap-2 px-3 pb-2.5 pt-1.5 text-sm ${active ? 'font-medium text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                active ? 'bg-slate-900 text-white' : t.key === 'out' && tabCounts.out > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {tabCounts[t.key].toLocaleString()}
              </span>
              {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-slate-900" />}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-2 border-b border-slate-100 p-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, brand or ID"
            className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400"
          />
        </div>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
          aria-label="Filter by brand"
        >
          {brands.map((b) => <option key={b} value={b}>{b === 'All' ? 'All brands' : b}</option>)}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
          aria-label="Filter by category"
        >
          <option value="All">All categories</option>
          {categoryCounts.map(([name, count]) => <option key={name} value={name}>{name} ({count})</option>)}
        </select>
        {hasFilters && (
          <button onClick={() => { setSearch(''); setBrand('All'); setCategory('All'); }} className={btn.ghost}>
            <X size={14} /> Reset
          </button>
        )}

        <div className="flex items-center gap-2 lg:ml-auto">
          {selectedIds.size > 0 && (
            <>
              <span className="text-sm text-slate-600">{selectedIds.size} selected</span>
              <button onClick={() => setSelectedIds(new Set())} className={btn.ghost}>Clear</button>
              <button onClick={() => deleteIds([...selectedIds], `${selectedIds.size} product(s)`)} disabled={busy} className={btn.danger}>
                <Trash2 size={15} /> Delete
              </button>
            </>
          )}
          {session?.role === 'SUPERADMIN' && (
            <details className="relative">
              <summary className={`${btn.ghost} cursor-pointer list-none px-2`} aria-label="More actions">
                <MoreHorizontal size={18} />
              </summary>
              <div className="adm-pop absolute right-0 z-20 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                <button onClick={restockZeroStock} className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
                  Set zero-stock products to 100
                  <span className="block text-xs text-slate-400">Bulk stock reset. Use with care.</span>
                </button>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <EmptyState
          icon={<PackageSearch size={20} />}
          title={hasFilters || status !== 'all' ? 'No products match these filters' : 'No products yet'}
          action={!hasFilters && status === 'all' ? <Link href="/ueadmin/products/add" className={btn.primary}>Add your first product</Link> : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="bg-slate-50/80 text-xs text-slate-500">
              <tr className="border-b border-slate-200">
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" aria-label="Select all on page" checked={allVisibleSelected} onChange={toggleAllVisible} className="h-4 w-4" />
                </th>
                <th className="px-3 py-2.5 font-medium">Product</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 text-right font-medium">Price</th>
                <th className="px-3 py-2.5 text-right font-medium">Stock</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-center font-medium">Fresh shelf</th>
                <th className="w-20 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const price = primaryPrice(p);
                const otherPrices = p.countryPrices.filter((cp) => (cp.price ?? 0) > 0 && cp !== price);
                const selected = selectedIds.has(p.id);
                return (
                  <tr key={p.id} className={`group border-b border-slate-100 last:border-0 ${selected ? 'bg-slate-50' : 'hover:bg-slate-50/70'}`}>
                    <td className="px-4 py-2.5">
                      <input type="checkbox" aria-label={`Select ${p.name}`} checked={selected} onChange={() => toggleOne(p.id)} className="h-4 w-4" />
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/ueadmin/products/${p.id}`} className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-slate-100 bg-slate-50 text-slate-300">
                          {p.mainImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.mainImage} alt="" loading="lazy" className="h-full w-full object-cover" />
                          ) : (
                            <ImageOff size={16} />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[340px] truncate font-medium text-slate-900 group-hover:underline" title={p.name}>{p.name}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {p.brand?.name || 'No brand'}{p.sku ? ` · ${p.sku}` : ''}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex max-w-[200px] flex-wrap gap-1">
                        {p.productCategories.length === 0 && <span className="text-xs text-slate-400">—</span>}
                        {p.productCategories.slice(0, 2).map((pc) => (
                          <span key={pc.category.id} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{pc.category.name}</span>
                        ))}
                        {p.productCategories.length > 2 && <span className="text-xs text-slate-400">+{p.productCategories.length - 2}</span>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">
                      {price ? (
                        <span title={p.countryPrices.map((cp) => `${cp.country}: ${formatMoney(cp.price, cp.currency)}`).join('\n')}>
                          <span className="font-medium tabular-nums text-slate-900">{formatMoney(price.price, price.currency)}</span>
                          {otherPrices.length > 0 && <span className="block text-xs text-slate-400">+{otherPrices.length} countries</span>}
                        </span>
                      ) : (
                        <Badge tone="red">No price</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <span className={p.stockQuantity <= 0 ? 'font-medium text-rose-600' : p.stockQuantity <= 5 ? 'font-medium text-orange-600' : 'text-slate-700'}>
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {p.active ? <Badge tone="green" dot>Published</Badge> : <Badge dot>Draft</Badge>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => toggleFreshFromShelf(p)}
                        role="switch"
                        aria-checked={p.freshFromShelf}
                        title={p.freshFromShelf ? 'Shown in Fresh from shelf. Click to remove' : 'Click to show in Fresh from shelf'}
                        className={`inline-flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${p.freshFromShelf ? 'bg-emerald-500' : 'bg-slate-200'}`}
                      >
                        <span className={`grid h-5 w-5 place-items-center rounded-full bg-white shadow transition-transform ${p.freshFromShelf ? 'translate-x-4' : ''}`}>
                          <Leaf size={11} className={p.freshFromShelf ? 'text-emerald-600' : 'text-slate-300'} />
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                        <Link href={`/ueadmin/products/${p.id}`} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit ${p.name}`}>
                          <Pencil size={15} />
                        </Link>
                        <button onClick={() => deleteIds([p.id], `"${p.name}"`)} disabled={busy} className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${p.name}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row">
          <span className="tabular-nums">
            Showing <span className="font-medium text-slate-900">{((safePage - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(safePage * PAGE_SIZE, filtered.length).toLocaleString()}</span> of{' '}
            <span className="font-medium text-slate-900">{filtered.length.toLocaleString()}</span>
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} className={`${btn.secondary} h-8 px-2.5`}>
              <ChevronLeft size={15} /> Prev
            </button>
            <Badge>{safePage} / {pageCount}</Badge>
            <button onClick={() => setPage(safePage + 1)} disabled={safePage >= pageCount} className={`${btn.secondary} h-8 px-2.5`}>
              Next <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
