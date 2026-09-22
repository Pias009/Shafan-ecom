"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Save,
  RotateCcw,
  ExternalLink,
  Image as ImageIcon,
  Check,
  Loader2,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Palette,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  DEFAULT_HAIRCARE_SECTION,
  HairCareSectionConfig,
} from "@/lib/haircare-section";

interface ProductOption {
  id: string;
  name: string;
  mainImage: string | null;
  price: number;
  discountPrice: number | null;
  brand: { name: string } | null;
  productCategories?: { category: { id: string; name: string } }[];
}

interface Props {
  initialConfig: HairCareSectionConfig;
  availableProducts: ProductOption[];
}

export default function HairCareSectionClient({
  initialConfig,
  availableProducts,
}: Props) {
  const [config, setConfig] = useState<HairCareSectionConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const productById = useMemo(() => {
    const map = new Map<string, ProductOption>();
    availableProducts.forEach((p) => map.set(p.id, p));
    return map;
  }, [availableProducts]);

  const selectedProducts = (config.productIds || [])
    .map((id) => productById.get(id))
    .filter(Boolean) as ProductOption[];

  const availableFiltered = useMemo(() => {
    const selectedSet = new Set(config.productIds || []);
    const q = search.toLowerCase();
    return availableProducts.filter(
      (p) =>
        !selectedSet.has(p.id) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.brand?.name?.toLowerCase().includes(q))
    );
  }, [availableProducts, config.productIds, search]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/haircare-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save section");
      }

      toast.success("Haircare section updated successfully! Homepage refreshed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all haircare section settings to defaults?")) {
      setConfig(DEFAULT_HAIRCARE_SECTION);
      toast.success("Reset to defaults. Remember to click Save!");
    }
  };

  const addProduct = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      productIds: [...(prev.productIds || []), id],
    }));
  };

  const removeProduct = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      productIds: (prev.productIds || []).filter((pid) => pid !== id),
    }));
  };

  const moveProduct = (index: number, dir: -1 | 1) => {
    setConfig((prev) => {
      const ids = [...(prev.productIds || [])];
      const target = index + dir;
      if (target < 0 || target >= ids.length) return prev;
      [ids[index], ids[target]] = [ids[target], ids[index]];
      return { ...prev, productIds: ids };
    });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#890754]/10 text-[#890754] flex items-center justify-center font-bold">
              <Palette size={16} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Herbal Haircare Section Controller
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Pick the products shown on desktop (2 side-by-side) and the mobile slider. Edit heading &amp; badge texts in both languages.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            href="/#haircare"
            target="_blank"
            className="px-4 py-2.5 rounded-2xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <ExternalLink size={14} />
            <span>Storefront</span>
          </Link>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-2xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-2xl bg-[#890754] hover:bg-[#540434] text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 shadow-sm shadow-[#890754]/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Section Visibility */}
      <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Section Visibility</h2>
            <p className="text-xs text-gray-500">
              Turn the herbal haircare spotlight section on or off on the homepage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
              config.enabled
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-gray-100 text-gray-500 border border-gray-200"
            }`}
          >
            {config.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {config.enabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      {/* Head Texts */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-xs space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-base font-bold text-gray-900">Header Texts Controller</h2>
          <p className="text-xs text-gray-500">Edit the badge and heading in both languages.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Pre-Title Badge (English)</label>
            <input
              type="text"
              value={config.badge}
              onChange={(e) => setConfig({ ...config, badge: e.target.value })}
              placeholder="e.g. RITUAL"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Pre-Title Badge (Arabic)</label>
            <input
              type="text"
              dir="rtl"
              value={config.badgeAr || ""}
              onChange={(e) => setConfig({ ...config, badgeAr: e.target.value })}
              placeholder="مثال: طقوس"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all text-right"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Heading (English)</label>
            <input
              type="text"
              value={config.heading}
              onChange={(e) => setConfig({ ...config, heading: e.target.value })}
              placeholder="e.g. Herbal Haircare"
              className="w-full px-4 py-2.5 text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Heading (Arabic)</label>
            <input
              type="text"
              dir="rtl"
              value={config.headingAr || ""}
              onChange={(e) => setConfig({ ...config, headingAr: e.target.value })}
              placeholder="مثال: العناية بالشعر"
              className="w-full px-4 py-2.5 text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all text-right"
            />
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-xs space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-base font-bold text-gray-900">Featured Products</h2>
          <p className="text-xs text-gray-500">
            Selected products render 2 side-by-side on desktop columns and slide on mobile. Drag order via the arrows.
          </p>
        </div>

        {/* Selected Products List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gray-700 block">
            Selected ({selectedProducts.length})
          </span>
          {selectedProducts.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center text-xs text-gray-400 font-medium flex flex-col items-center gap-2">
              <ImageIcon size={24} className="opacity-40" />
              No products selected yet — choose from the pool below.
            </div>
          )}

          {selectedProducts.map((p, index) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => moveProduct(index, -1)}
                  disabled={index === 0}
                  className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-[#890754] hover:border-[#890754] disabled:opacity-30 flex items-center justify-center transition-all"
                >
                  <ChevronUp size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => moveProduct(index, 1)}
                  disabled={index === selectedProducts.length - 1}
                  className="w-6 h-6 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-[#890754] hover:border-[#890754] disabled:opacity-30 flex items-center justify-center transition-all"
                >
                  <ChevronDown size={13} />
                </button>
              </div>

              {p.mainImage ? (
                <Image
                  src={p.mainImage}
                  alt={p.name}
                  width={40}
                  height={40}
                  className="object-contain rounded-md bg-white border border-gray-100 w-10 h-10"
                />
              ) : (
                <div className="w-10 h-10 rounded-md bg-white border border-gray-100 flex items-center justify-center text-gray-300">
                  <ImageIcon size={16} />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-gray-900 truncate">{p.name}</div>
                <div className="text-[10px] text-[#890754] font-black">
                  {p.discountPrice || p.price} KWD · {p.brand?.name || "Generic"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeProduct(p.id)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all"
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Available Pool with Search */}
        <div className="space-y-2 pt-4 border-t border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Plus size={13} className="text-[#890754]" />
              Add from available products
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full sm:w-64 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 max-h-96 overflow-y-auto border border-gray-100 rounded-2xl divide-y divide-gray-50">
            {availableFiltered.length === 0 && (
              <div className="col-span-full p-8 text-center text-xs text-gray-400 font-medium">
                {config.productIds && config.productIds.length > 0
                  ? "All products are already selected."
                  : "No products found."}
              </div>
            )}
            {availableFiltered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => addProduct(p.id)}
                className="flex items-center gap-3 p-2.5 hover:bg-[#890754]/5 transition-all text-left"
              >
                {p.mainImage ? (
                  <Image
                    src={p.mainImage}
                    alt={p.name}
                    width={36}
                    height={36}
                    className="object-contain rounded-md bg-white border border-gray-100 w-9 h-9"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300">
                    <ImageIcon size={14} />
                  </div>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-gray-800 truncate">{p.name}</span>
                  <span className="block text-[10px] text-gray-400 truncate">
                    {p.brand?.name || "Generic"} · {p.discountPrice || p.price} KWD
                  </span>
                </span>
                <span className="w-6 h-6 rounded-full bg-[#890754] text-white flex items-center justify-center shrink-0">
                  <Plus size={12} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}