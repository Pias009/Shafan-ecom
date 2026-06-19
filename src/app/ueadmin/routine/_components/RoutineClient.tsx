"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, Loader2, Package, Sparkles, Trash2, CheckSquare,
  Square, Plus, X, ImageIcon, ExternalLink, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  mainImage: string | null;
  stockQuantity: number;
  active: boolean;
  routine: boolean;
  createdAt: Date | string;
  brand: { name: string } | null;
  productCategories: { category: { id: string; name: string } }[];
  countryPrices: { country: string; price: number; currency: string }[];
}

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  active: boolean;
}

function getDisplayPrice(p: Product) {
  return p.countryPrices?.find((cp) => cp.country === 'AE')?.price ?? 0;
}

export function RoutineClient({
  initialProducts,
  initialBanners,
}: {
  initialProducts: Product[];
  initialBanners: Banner[];
}) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'routine' | 'available'>('routine');
  const [updating, setUpdating] = useState<string | null>(null);
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Banner state
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [bannerTab, setBannerTab] = useState<'list' | 'add'>('list');
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', active: true });
  const [savingBanner, setSavingBanner] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const filtered = useMemo(() => {
    if (!search) return productsList;
    const q = search.toLowerCase();
    return productsList.filter(p =>
      p.name.toLowerCase().includes(q) || p.brand?.name?.toLowerCase().includes(q)
    );
  }, [productsList, search]);

  const routineList = filtered.filter(p => p.routine === true);
  const availableList = filtered.filter(p => p.routine !== true);
  const displayList = activeTab === 'routine' ? routineList : availableList;

  // Selection helpers
  const allSelected = displayList.length > 0 && displayList.every(p => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        displayList.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        displayList.forEach(p => next.add(p.id));
        return next;
      });
    }
  }

  async function toggleRoutine(productId: string, current: boolean) {
    setUpdating(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/routine`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routine: !current }),
      });
      if (res.ok) {
        setProductsList(prev => prev.map(p => p.id === productId ? { ...p, routine: !current } : p));
        toast.success(!current ? 'Added to Routine' : 'Removed from Routine');
      } else {
        toast.error('Failed to update');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setUpdating(null);
    }
  }

  async function toggleActive(productId: string, current: boolean) {
    setUpdating(productId + '-active');
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !current }),
      });
      if (res.ok) {
        setProductsList(prev => prev.map(p => p.id === productId ? { ...p, active: !current } : p));
        toast.success(!current ? 'Product activated' : 'Product deactivated');
      } else {
        toast.error('Failed to update active status');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setUpdating(null);
    }
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Remove ${selectedIds.size} product(s) from Routine? This only removes the routine flag, not the product.`)) return;

    setDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(
        ids.map(id =>
          fetch(`/api/admin/products/${id}/routine`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ routine: false }),
          })
        )
      );
      const failed = results.filter(r => !r.ok).length;
      if (failed === 0) {
        setProductsList(prev => prev.map(p => selectedIds.has(p.id) ? { ...p, routine: false } : p));
        setSelectedIds(new Set());
        toast.success(`Removed ${ids.length} product(s) from Routine`);
      } else {
        toast.error(`${failed} update(s) failed`);
      }
    } catch {
      toast.error('Network error');
    } finally {
      setDeleting(false);
    }
  }

  // Banner actions
  async function saveBanner() {
    if (!bannerForm.title.trim()) { toast.error('Title is required'); return; }
    setSavingBanner(true);
    try {
      const isEdit = !!editingBanner;
      const res = await fetch('/api/admin/routine-banner', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { ...bannerForm, id: editingBanner!.id } : bannerForm),
      });
      if (res.ok) {
        const saved = await res.json();
        if (isEdit) {
          setBanners(prev => prev.map(b => b.id === saved.id ? saved : b));
          toast.success('Banner updated');
        } else {
          setBanners(prev => [saved, ...prev]);
          toast.success('Banner created');
        }
        setBannerForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', active: true });
        setEditingBanner(null);
        setBannerTab('list');
      } else {
        toast.error('Failed to save banner');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSavingBanner(false);
    }
  }

  async function deleteBanner(id: string) {
    if (!confirm('Delete this banner?')) return;
    try {
      const res = await fetch('/api/admin/routine-banner', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setBanners(prev => prev.filter(b => b.id !== id));
        toast.success('Banner deleted');
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Network error');
    }
  }

  function startEditBanner(b: Banner) {
    setEditingBanner(b);
    setBannerForm({ title: b.title, subtitle: b.subtitle ?? '', imageUrl: b.imageUrl ?? '', linkUrl: b.linkUrl ?? '', active: b.active });
    setBannerTab('add');
  }

  return (
    <div className="space-y-8">
      {/* ── Banner Section ── */}
      <div className="bg-white border border-black/5 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-violet-500" />
            <span className="font-black text-sm uppercase tracking-widest">Routine Banner</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setBannerTab('list'); setEditingBanner(null); setBannerForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', active: true }); }}
              className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${bannerTab === 'list' ? 'bg-black text-white' : 'text-black/50 hover:text-black'}`}
            >
              Banners ({banners.length})
            </button>
            <button
              onClick={() => { setEditingBanner(null); setBannerForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', active: true }); setBannerTab('add'); }}
              className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${bannerTab === 'add' && !editingBanner ? 'bg-violet-500 text-white' : 'text-black/50 hover:text-black'}`}
            >
              <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Banner
            </button>
          </div>
        </div>

        {bannerTab === 'list' ? (
          banners.length === 0 ? (
            <div className="py-12 text-center text-black/40 font-black text-sm">No banners yet</div>
          ) : (
            <div className="divide-y divide-black/5">
              {banners.map(b => (
                <div key={b.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-16 h-12 rounded-xl overflow-hidden bg-black/5 shrink-0 relative">
                    {b.imageUrl ? (
                      <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-black/20" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm truncate">{b.title}</p>
                    {b.subtitle && <p className="text-xs text-black/50 truncate">{b.subtitle}</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${b.active ? 'bg-emerald-100 text-emerald-700' : 'bg-black/5 text-black/40'}`}>
                    {b.active ? 'Active' : 'Hidden'}
                  </span>
                  {b.linkUrl && (
                    <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="text-black/30 hover:text-black transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button onClick={() => startEditBanner(b)} className="px-3 py-1.5 rounded-xl bg-black/5 hover:bg-black/10 font-black text-xs uppercase tracking-wider transition-colors">Edit</button>
                  <button onClick={() => deleteBanner(b.id)} className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-black text-xs uppercase tracking-wider transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="p-6 space-y-4">
            <p className="font-black text-sm uppercase tracking-widest text-black/50">
              {editingBanner ? 'Edit Banner' : 'New Banner'}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-black/50">Title *</label>
                <input
                  value={bannerForm.title}
                  onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Your Skincare Routine"
                  className="w-full h-12 px-4 bg-black/[0.03] border border-black/5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-black/50">Subtitle</label>
                <input
                  value={bannerForm.subtitle}
                  onChange={e => setBannerForm(f => ({ ...f, subtitle: e.target.value }))}
                  placeholder="Curated for your skin"
                  className="w-full h-12 px-4 bg-black/[0.03] border border-black/5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-black/50">Image URL</label>
                <input
                  value={bannerForm.imageUrl}
                  onChange={e => setBannerForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full h-12 px-4 bg-black/[0.03] border border-black/5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-widest text-black/50">Link URL</label>
                <input
                  value={bannerForm.linkUrl}
                  onChange={e => setBannerForm(f => ({ ...f, linkUrl: e.target.value }))}
                  placeholder="/products/routine"
                  className="w-full h-12 px-4 bg-black/[0.03] border border-black/5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setBannerForm(f => ({ ...f, active: !f.active }))}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${bannerForm.active ? 'bg-emerald-100 text-emerald-700' : 'bg-black/5 text-black/50'}`}
              >
                {bannerForm.active ? 'Active' : 'Hidden'}
              </button>
              <button
                onClick={saveBanner}
                disabled={savingBanner}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50"
              >
                {savingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingBanner ? 'Save Changes' : 'Create Banner'}
              </button>
              <button
                onClick={() => { setBannerTab('list'); setEditingBanner(null); }}
                className="px-4 py-2.5 rounded-full font-black text-xs uppercase tracking-widest text-black/50 hover:text-black transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Products Section ── */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/30" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full h-14 pl-14 pr-4 bg-white border border-black/5 rounded-2xl font-black text-sm focus:ring-2 focus:ring-black focus:outline-none"
            />
          </div>

          <div className="flex bg-white border border-black/5 rounded-full p-1">
            <button
              onClick={() => { setActiveTab('routine'); setSelectedIds(new Set()); }}
              className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'routine' ? 'bg-violet-500 text-white' : 'text-black/50 hover:text-black'}`}
            >
              <Sparkles className="w-4 h-4 inline mr-1" /> Active ({routineList.length})
            </button>
            <button
              onClick={() => { setActiveTab('available'); setSelectedIds(new Set()); }}
              className={`px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'available' ? 'bg-black text-white' : 'text-black/50 hover:text-black'}`}
            >
              All Products ({availableList.length})
            </button>
          </div>
        </div>

        {/* Bulk action bar */}
        {someSelected && (
          <div className="flex items-center gap-3 px-4 py-3 bg-violet-50 border border-violet-200 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-violet-500" />
            <span className="font-black text-sm text-violet-700">{selectedIds.size} selected</span>
            {activeTab === 'routine' && (
              <button
                onClick={deleteSelected}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-500 text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors disabled:opacity-50 ml-auto"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Remove from Routine
              </button>
            )}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-auto text-black/40 hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white border border-black/5 rounded-3xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-black/[0.02] border-b border-black/5">
              <tr>
                <th className="px-6 py-4 w-10">
                  <button onClick={toggleSelectAll} className="text-black/40 hover:text-black transition-colors">
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Product</th>
                <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Brand</th>
                <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Price</th>
                <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Stock</th>
                <th className="text-left px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Status</th>
                <th className="text-right px-6 py-4 font-black text-xs uppercase tracking-widest text-black/50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {displayList.map(product => {
                const isRoutine = product.routine === true;
                const isUpdating = updating === product.id;
                const isUpdatingActive = updating === product.id + '-active';
                const isSelected = selectedIds.has(product.id);

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-black/[0.02] transition-colors ${isSelected ? 'bg-violet-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <button onClick={() => toggleSelect(product.id)} className="text-black/40 hover:text-black transition-colors">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-violet-500" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/5 relative shrink-0">
                          {product.mainImage ? (
                            <Image src={product.mainImage} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-black/20 text-xs">No img</div>
                          )}
                        </div>
                        <div>
                          <Link href={`/ueadmin/products/${product.id}`} className="font-black text-sm hover:underline">
                            {product.name}
                          </Link>
                          <p className="text-xs text-black/50 mt-0.5">
                            {product.productCategories?.[0]?.category?.name || 'Uncategorized'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-xs uppercase tracking-wider text-black/60">
                        {product.brand?.name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-sm">AED {getDisplayPrice(product).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-black uppercase tracking-widest ${product.stockQuantity > 0 ? 'text-black/60' : 'text-red-500'}`}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {isRoutine && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-violet-100 text-violet-700 text-xs font-black uppercase rounded-full w-fit">
                            <Sparkles className="w-3 h-3" /> Routine
                          </span>
                        )}
                        <button
                          onClick={() => toggleActive(product.id, product.active)}
                          disabled={!!isUpdatingActive}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-black uppercase rounded-full w-fit transition-colors ${product.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-black/5 text-black/40 hover:bg-black/10'}`}
                        >
                          {isUpdatingActive ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                          {product.active ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleRoutine(product.id, isRoutine)}
                        disabled={!!isUpdating}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                          isRoutine
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-violet-500 text-white hover:bg-violet-600'
                        }`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isRoutine ? (
                          <>
                            <X className="w-4 h-4" /> Remove
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" /> Add to Routine
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {displayList.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-6xl mb-4 opacity-30">{activeTab === 'routine' ? '✨' : '📦'}</div>
              <p className="font-black text-lg text-black/50">
                {activeTab === 'routine' ? 'No routine products yet' : 'No products found'}
              </p>
              {activeTab === 'routine' && (
                <p className="text-sm text-black/30 mt-1">Switch to "All Products" to add some</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
