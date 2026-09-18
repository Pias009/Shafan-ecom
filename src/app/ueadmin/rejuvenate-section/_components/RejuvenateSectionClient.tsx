"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Save,
  RotateCcw,
  Upload,
  ExternalLink,
  Image as ImageIcon,
  Type,
  LayoutGrid,
  Check,
  Loader2,
  Eye,
  Layers,
  Palette,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  DEFAULT_REJUVENATE_SECTION,
  RejuvenateCardConfig,
  RejuvenateSectionConfig,
} from "@/lib/rejuvenate-section";

interface ProductOption {
  id: string;
  name: string;
  mainImage: string | null;
  price: number;
  discountPrice: number | null;
  brand: { name: string } | null;
}

interface Props {
  initialConfig: RejuvenateSectionConfig;
  availableProducts: ProductOption[];
}

const COLOR_PRESETS = [
  { name: "Peach Soft", hex: "#fbe8df", accent: "#d87a63" },
  { name: "Coral Rose", hex: "#f4c7bf", accent: "#cf6d68" },
  { name: "Sage Mint", hex: "#cde2d6", accent: "#5c9176" },
  { name: "Lavender", hex: "#e9d5ff", accent: "#9333ea" },
  { name: "Sky Mist", hex: "#e0f2fe", accent: "#0284c7" },
  { name: "Vanilla Pearl", hex: "#fef3c7", accent: "#d97706" },
  { name: "Blush Pink", hex: "#fce7f3", accent: "#db2777" },
];

export default function RejuvenateSectionClient({
  initialConfig,
  availableProducts,
}: Props) {
  const [config, setConfig] = useState<RejuvenateSectionConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"head" | "cards" | "preview">("head");
  const [previewLang, setPreviewLang] = useState<"en" | "ar">("en");
  const [cardActiveIdx, setCardActiveIdx] = useState(0);

  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/rejuvenate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save section");
      }

      toast.success("Section updated successfully! Homepage refreshed.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all texts, images, and cards to default values?")) {
      setConfig(DEFAULT_REJUVENATE_SECTION);
      toast.success("Reset to defaults. Remember to click Save!");
    }
  };

  const handleImageUpload = async (cardIndex: number, file: File) => {
    setUploadingIdx(cardIndex);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "rejuvenate");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      updateCard(cardIndex, { imageSrc: data.url });
      toast.success(`Card ${cardIndex + 1} image uploaded!`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploadingIdx(null);
    }
  };

  const updateCard = (idx: number, updates: Partial<RejuvenateCardConfig>) => {
    setConfig((prev) => {
      const newCards = [...prev.cards];
      newCards[idx] = { ...newCards[idx], ...updates };
      return { ...prev, cards: newCards };
    });
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#890754]/10 text-[#890754] flex items-center justify-center font-bold">
              <Sparkles size={16} />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              &quot;Refresh Your Mind&quot; Section Controller
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">
            Manage the section header texts, subtext, explore link, and the 3 tabbed card images &amp; products displayed on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            href="/#refresh-your-mind"
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("head")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "head"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200"
          }`}
        >
          <Type size={14} />
          <span>Head Texts &amp; Badge</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cards")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "cards"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200"
          }`}
        >
          <LayoutGrid size={14} />
          <span>3 Tabbed Cards (Images &amp; Content)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
            activeTab === "preview"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200"
          }`}
        >
          <Eye size={14} />
          <span>Live Preview</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HEAD TEXTS & BADGE */}
      {/* ========================================================================= */}
      {activeTab === "head" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-gray-900">Header Texts Controller</h2>
            <p className="text-xs text-gray-500">Edit the top badge, heading, description, and bottom action link in both languages.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pre-title Badge EN */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Pre-Title Badge (English)</label>
              <input
                type="text"
                value={config.badgeText}
                onChange={(e) => setConfig({ ...config, badgeText: e.target.value })}
                placeholder="e.g. SEAL SIP :"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all"
              />
            </div>

            {/* Pre-title Badge AR */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Pre-Title Badge (Arabic)</label>
              <input
                type="text"
                dir="rtl"
                value={config.badgeTextAr || ""}
                onChange={(e) => setConfig({ ...config, badgeTextAr: e.target.value })}
                placeholder="مثال: طقوس الصفاء والنقاء :"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all text-right"
              />
            </div>

            {/* Head Text / Main Title EN */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Main Title / Head Text (English)</label>
              <input
                type="text"
                value={config.heading}
                onChange={(e) => setConfig({ ...config, heading: e.target.value })}
                placeholder="e.g. Refresh Your Mind"
                className="w-full px-4 py-2.5 text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all"
              />
            </div>

            {/* Head Text / Main Title AR */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Main Title / Head Text (Arabic)</label>
              <input
                type="text"
                dir="rtl"
                value={config.headingAr || ""}
                onChange={(e) => setConfig({ ...config, headingAr: e.target.value })}
                placeholder="مثال: انعشي حواسك وبشرتك"
                className="w-full px-4 py-2.5 text-sm font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all text-right"
              />
            </div>

            {/* Description Subtext EN */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Subtitle / Description (English)</label>
              <textarea
                rows={3}
                value={config.description}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Nourish your skin and soul with pure botanical essentials..."
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all leading-relaxed"
              />
            </div>

            {/* Description Subtext AR */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Subtitle / Description (Arabic)</label>
              <textarea
                rows={3}
                dir="rtl"
                value={config.descriptionAr || ""}
                onChange={(e) => setConfig({ ...config, descriptionAr: e.target.value })}
                placeholder="اعتني بجمالك وصفاء روحك مع أفضل مستحضرات العناية الطبيعية..."
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all leading-relaxed text-right"
              />
            </div>

            {/* Bottom Link Text EN */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Explore Link Text (English)</label>
              <input
                type="text"
                value={config.bottomLinkText}
                onChange={(e) => setConfig({ ...config, bottomLinkText: e.target.value })}
                placeholder="e.g. Explore All Routine Essentials"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all"
              />
            </div>

            {/* Bottom Link Text AR */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Explore Link Text (Arabic)</label>
              <input
                type="text"
                dir="rtl"
                value={config.bottomLinkTextAr || ""}
                onChange={(e) => setConfig({ ...config, bottomLinkTextAr: e.target.value })}
                placeholder="مثال: اكتشفي كافة مستحضرات الروتين"
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all text-right"
              />
            </div>

            {/* Bottom Link URL */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-gray-700">Explore Link Destination URL</label>
              <input
                type="text"
                value={config.bottomLinkUrl}
                onChange={(e) => setConfig({ ...config, bottomLinkUrl: e.target.value })}
                placeholder="e.g. /products?category=Routine"
                className="w-full px-4 py-2.5 text-sm font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 3 TABBED CARDS (IMAGE & TEXT) */}
      {/* ========================================================================= */}
      {activeTab === "cards" && (
        <div className="space-y-6">
          {/* Card Selector Pills */}
          <div className="flex items-center gap-2">
            {config.cards.map((c, i) => (
              <button
                key={c.id || i}
                type="button"
                onClick={() => setCardActiveIdx(i)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  cardActiveIdx === i
                    ? "bg-[#890754] text-white shadow-xs"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/10"
                  style={{ backgroundColor: c.bgHex }}
                />
                <span>Card {i + 1}: {c.tabTitle.replace("\n", " ") || `Item ${i + 1}`}</span>
              </button>
            ))}
          </div>

          {/* Current Card Editor Form */}
          {(() => {
            const card = config.cards[cardActiveIdx];
            if (!card) return null;

            return (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Card {cardActiveIdx + 1} Settings
                    </h3>
                    <p className="text-xs text-gray-500">
                      Customize the studio photograph image, folder tab title, subtitle tag, and linked product.
                    </p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-xl border border-black/10 shadow-2xs"
                    style={{ backgroundColor: card.bgHex }}
                    title="Card Background Color"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Image Manager */}
                  <div className="lg:col-span-5 space-y-4">
                    <label className="text-xs font-bold text-gray-700 block">
                      Card Image (Studio Photograph)
                    </label>

                    {/* Image Preview Box */}
                    <div
                      style={{ backgroundColor: card.bgHex }}
                      className="relative w-full aspect-square rounded-2xl overflow-hidden p-3 flex items-center justify-center border border-black/5 shadow-2xs group"
                    >
                      {card.imageSrc ? (
                        <Image
                          src={card.imageSrc}
                          alt={card.imageAlt || "Card image"}
                          fill
                          className="object-cover rounded-xl"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <ImageIcon size={32} />
                          <span className="text-xs font-medium">No image selected</span>
                        </div>
                      )}

                      {uploadingIdx === cardActiveIdx && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20">
                          <Loader2 size={28} className="animate-spin" />
                          <span className="text-xs font-bold">Uploading to Cloudinary...</span>
                        </div>
                      )}
                    </div>

                    {/* Upload / URL Controls */}
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={(el) => {
                          fileInputRefs.current[cardActiveIdx] = el;
                        }}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(cardActiveIdx, file);
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[cardActiveIdx]?.click()}
                        disabled={uploadingIdx === cardActiveIdx}
                        className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-[#890754]/30 hover:border-[#890754] text-[#890754] hover:bg-[#890754]/5 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        <Upload size={14} />
                        <span>Upload New Image</span>
                      </button>

                      <div className="space-y-1 pt-1">
                        <span className="text-[11px] font-semibold text-gray-500">Or Paste Image URL:</span>
                        <input
                          type="text"
                          value={card.imageSrc}
                          onChange={(e) => updateCard(cardActiveIdx, { imageSrc: e.target.value })}
                          placeholder="https://... or /images/..."
                          className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Texts, Product Link, Colors */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Tab Titles EN & AR */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">
                          Tab Title (EN) <span className="text-[10px] text-gray-400 font-normal">Use \n for line break</span>
                        </label>
                        <input
                          type="text"
                          value={card.tabTitle}
                          onChange={(e) => updateCard(cardActiveIdx, { tabTitle: e.target.value })}
                          placeholder="Sentlary\nSinville"
                          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Tab Title (AR)</label>
                        <input
                          type="text"
                          dir="rtl"
                          value={card.tabTitleAr || ""}
                          onChange={(e) => updateCard(cardActiveIdx, { tabTitleAr: e.target.value })}
                          placeholder="سينتلاري"
                          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden text-right"
                        />
                      </div>
                    </div>

                    {/* Category Tag / Subtitle EN & AR */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Category Tag (EN)</label>
                        <input
                          type="text"
                          value={card.categoryTag}
                          onChange={(e) => updateCard(cardActiveIdx, { categoryTag: e.target.value })}
                          placeholder="Radiance Elixir"
                          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700">Category Tag (AR)</label>
                        <input
                          type="text"
                          dir="rtl"
                          value={card.categoryTagAr || ""}
                          onChange={(e) => updateCard(cardActiveIdx, { categoryTagAr: e.target.value })}
                          placeholder="سيروم النضارة"
                          className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden text-right"
                        />
                      </div>
                    </div>

                    {/* Linked Product Selector */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                        <span>Linked Store Product</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          (Controls live price, quick-view &amp; cart button)
                        </span>
                      </label>

                      <select
                        value={card.productId || ""}
                        onChange={(e) => updateCard(cardActiveIdx, { productId: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#890754] focus:outline-hidden"
                      >
                        <option value="">-- Automatic from Routine / Best Pool --</option>
                        {availableProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} — {p.discountPrice || p.price} KWD ({p.brand?.name || "Generic"})
                          </option>
                        ))}
                      </select>

                      {/* Linked Product Preview Badge if selected */}
                      {card.productId && (() => {
                        const selectedP = availableProducts.find((p) => p.id === card.productId);
                        if (!selectedP) return null;
                        return (
                          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                            {selectedP.mainImage && (
                              <Image
                                src={selectedP.mainImage}
                                alt={selectedP.name}
                                width={36}
                                height={36}
                                className="object-contain rounded-md bg-white border border-gray-100"
                              />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-gray-900 truncate">{selectedP.name}</div>
                              <div className="text-[10px] text-[#890754] font-black">
                                Price: {selectedP.discountPrice || selectedP.price} KWD
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => updateCard(cardActiveIdx, { productId: "" })}
                              className="text-[11px] text-gray-400 hover:text-rose-600 font-semibold"
                            >
                              Clear
                            </button>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Card Theme Color Presets */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <label className="text-xs font-bold text-gray-700 block">
                        Card Background Color Theme
                      </label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            key={color.hex}
                            type="button"
                            onClick={() =>
                              updateCard(cardActiveIdx, {
                                bgHex: color.hex,
                                accentHex: color.accent,
                              })
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                              card.bgHex.toLowerCase() === color.hex.toLowerCase()
                                ? "border-[#890754] ring-2 ring-[#890754]/20 scale-105"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span>{color.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Custom Hex input */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-gray-500 font-semibold">Custom Hex:</span>
                        <input
                          type="text"
                          value={card.bgHex}
                          onChange={(e) => updateCard(cardActiveIdx, { bgHex: e.target.value })}
                          className="w-28 px-2.5 py-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg"
                        />
                        <input
                          type="color"
                          value={card.bgHex.startsWith("#") ? card.bgHex : "#fbe8df"}
                          onChange={(e) => updateCard(cardActiveIdx, { bgHex: e.target.value })}
                          className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: LIVE PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200">
            <div className="text-xs font-bold text-gray-700">Preview Language:</div>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewLang("en")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  previewLang === "en" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setPreviewLang("ar")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  previewLang === "ar" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500"
                }`}
              >
                العربية
              </button>
            </div>
          </div>

          {/* Storefront Section Replica Preview */}
          <div className="rounded-3xl border border-amber-900/10 shadow-[0_16px_50px_rgba(137,7,84,0.06)] bg-white overflow-hidden">
            <div className="pt-8 pb-8 px-4 sm:px-8 bg-gradient-to-b from-[#fdfbf9] to-white" dir={previewLang === "ar" ? "rtl" : "ltr"}>
              
              {/* Header Preview */}
              <div className="text-center max-w-xl mx-auto mb-8 px-2">
                <div className="inline-block text-xs font-black uppercase tracking-[0.2em] text-[#890754] mb-1.5">
                  {previewLang === "ar"
                    ? config.badgeTextAr || config.badgeText
                    : config.badgeText}
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-gray-950 tracking-tight mb-2">
                  {previewLang === "ar"
                    ? config.headingAr || config.heading
                    : config.heading}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed font-medium">
                  {previewLang === "ar"
                    ? config.descriptionAr || config.description
                    : config.description}
                </p>
              </div>

              {/* 3 Tabbed Cards Preview */}
              <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-4xl mx-auto">
                {config.cards.map((card, idx) => {
                  const linkedProduct = availableProducts.find((p) => p.id === card.productId);
                  const displayTitle = previewLang === "ar" ? (card.tabTitleAr || card.tabTitle) : card.tabTitle;
                  const displayTag = previewLang === "ar" ? (card.categoryTagAr || card.categoryTag) : card.categoryTag;
                  const price = linkedProduct ? (linkedProduct.discountPrice || linkedProduct.price) : "19.900";

                  return (
                    <div key={card.id || idx} className="flex flex-col select-none">
                      {/* Folder Tab Header */}
                      <div className="flex items-end h-10 sm:h-12 w-full relative z-10">
                        <div
                          style={{ backgroundColor: card.bgHex }}
                          className="w-[72%] sm:w-[64%] h-full rounded-t-xl px-2 sm:px-3 pt-1 flex flex-col justify-center"
                        >
                          <span className="font-serif text-[10px] sm:text-sm font-bold leading-tight text-gray-950 whitespace-pre-line truncate">
                            {displayTitle}
                          </span>
                        </div>
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 -ml-[0.5px] rtl:-mr-[0.5px] rtl:scale-x-[-1]"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path d="M 0 0 C 0 14 6 24 24 24 L 0 24 Z" fill={card.bgHex} />
                        </svg>
                      </div>

                      {/* Card Body */}
                      <div
                        style={{ backgroundColor: card.bgHex }}
                        className="rounded-b-2xl rounded-tr-xl p-2 sm:p-4 flex flex-col justify-between shadow-sm"
                      >
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white/40 shadow-2xs">
                          {card.imageSrc ? (
                            <Image
                              src={card.imageSrc}
                              alt={card.imageAlt || "Card Image"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon size={24} />
                            </div>
                          )}
                        </div>

                        {/* Bottom product bar */}
                        <div className="mt-2 pt-1.5 border-t border-black/5 flex items-center justify-between gap-1">
                          <div className="min-w-0 flex-1">
                            <div className="text-[9px] sm:text-xs font-bold text-gray-900 truncate">
                              {linkedProduct?.name || displayTag}
                            </div>
                            <div className="text-[10px] sm:text-xs font-black text-[#890754]">
                              KWD {price}
                            </div>
                          </div>
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white text-[#890754] flex items-center justify-center shadow-2xs">
                            <Package size={12} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom explore link preview */}
              <div className="text-center mt-6">
                <span className="text-xs font-black uppercase tracking-widest text-[#890754] underline underline-offset-4">
                  {previewLang === "ar"
                    ? config.bottomLinkTextAr || config.bottomLinkText
                    : config.bottomLinkText} &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
