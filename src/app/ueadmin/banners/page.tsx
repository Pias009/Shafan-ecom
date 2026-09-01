"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit2, Check, X, Tag, Upload, Link as LinkIcon, ImageIcon, Layers, Eye, EyeOff, Type, Palette } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

function isValidImageSrc(src: string): boolean {
  if (!src.trim()) return false;
  if (src.startsWith("/")) return true;
  try {
    const u = new URL(src);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

interface HeroBanner {
  id: string;
  imageUrl: string;
  title: string | null;
  subtitle: string | null;
  link: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  offerText: string | null;
  ctaText: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  backgroundImage: string | null;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  clicks: number;
  conversions: number;
  discountId: string | null;
  isHero: boolean;
}

const emptyForm = {
  imageUrl: "",
  title: "",
  subtitle: "",
  link: "",
  active: true,
  sortOrder: 0,
  offerText: "",
  ctaText: "SHOP NOW",
  backgroundColor: "",
  textColor: "#ffffff",
  backgroundImage: "",
  startDate: "",
  endDate: "",
  priority: 2,
  discountId: "",
  isHero: true,
};

type FormTab = "image" | "text" | "style" | "schedule";

export default function AdminHeroBannersPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageTab, setImageTab] = useState<"url" | "upload">("url");
  const [formTab, setFormTab] = useState<FormTab>("image");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/offer-banners");
      if (r.ok) setBanners(await r.json());
    } catch (error) { console.error(error); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleFileUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "ecommerce/banners");
    try {
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (r.ok && data.url) {
        setForm((f) => ({ ...f, imageUrl: data.url }));
        toast.success("Image uploaded!");
      } else { toast.error(data.error || "Upload failed"); }
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  }

  async function save() {
    if (!form.imageUrl.trim()) { toast.error("Banner image is required"); return; }
    setSaving(true);
    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder),
      priority: Number(form.priority) || 2,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      discountId: form.discountId || null,
    };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/offer-banners/${editing}` : "/api/admin/offer-banners";
    try {
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (r.ok) {
        toast.success(editing ? "Banner updated!" : "Banner created!");
        setForm(emptyForm); setEditing(null); setShowForm(false); load();
      } else {
        toast.error("Failed to save banner");
      }
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm("Delete this banner?")) return;
    try {
      const r = await fetch(`/api/admin/offer-banners/${id}`, { method: "DELETE" });
      if (r.ok) { toast.success("Deleted"); load(); } else toast.error("Failed");
    } catch { toast.error("Failed to delete"); }
  }

  function edit(banner: HeroBanner) {
    setForm({
      imageUrl: banner.imageUrl,
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      link: banner.link || "",
      active: banner.active,
      sortOrder: banner.sortOrder,
      offerText: banner.offerText || "",
      ctaText: banner.ctaText || "SHOP NOW",
      backgroundColor: banner.backgroundColor || "",
      textColor: banner.textColor || "#ffffff",
      backgroundImage: banner.backgroundImage || "",
      startDate: banner.startDate || "",
      endDate: banner.endDate || "",
      priority: banner.priority || 2,
      discountId: banner.discountId || "",
      isHero: true,
    });
    setEditing(banner.id);
    setShowForm(true);
    setFormTab("image");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const previewSrc = isValidImageSrc(form.imageUrl) ? form.imageUrl : null;

  const formTabs: { id: FormTab; label: string; icon: React.ReactNode }[] = [
    { id: "image", label: "Image", icon: <ImageIcon size={14} /> },
    { id: "text", label: "Text & CTA", icon: <Type size={14} /> },
    { id: "style", label: "Style", icon: <Palette size={14} /> },
    { id: "schedule", label: "Schedule", icon: <Layers size={14} /> },
  ];

  return (
    <div className="space-y-8">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#0c433a] rounded-xl text-white shadow-lg">
            <ImageIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0c3a32]">Hero Slider Banners</h1>
            <p className="text-sm text-black/50 mt-0.5">Control the full-screen homepage slider — images, text overlay, CTA & scheduling</p>
          </div>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(!showForm); setFormTab("image"); setImageTab("url"); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0c433a] text-white rounded-xl text-sm font-bold hover:bg-[#072a24] transition-all shadow-md"
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Banner</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-3xl border border-[#c5e1d7] shadow-lg overflow-hidden">
          {/* Tab Nav */}
          <div className="flex border-b border-[#e5f3ee] bg-[#f4fbf8] px-2 pt-2 gap-1">
            {formTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFormTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all ${
                  formTab === tab.id
                    ? "bg-white border border-[#c5e1d7] border-b-white -mb-px text-[#0c433a]"
                    : "text-black/40 hover:text-[#0c433a]"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-[#0c3a32]">
                {editing ? "Edit Banner" : "New Hero Slider Banner"}
              </h2>
              <span className="text-xs font-bold text-[#72ccbd] uppercase tracking-widest bg-[#edf9f5] px-3 py-1 rounded-full border border-[#c5e1d7]">
                Hero Slider
              </span>
            </div>

            {/* Tab: Image */}
            {formTab === "image" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-black/60 mb-2 uppercase tracking-widest">
                    Banner Image *
                  </label>
                  <div className="flex gap-1 mb-3 bg-black/5 rounded-xl p-1 w-fit">
                    <button
                      onClick={() => setImageTab("url")}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${imageTab === "url" ? "bg-white shadow text-[#0c433a]" : "text-black/60 hover:text-black"}`}
                    >
                      <LinkIcon size={12} /> URL
                    </button>
                    <button
                      onClick={() => setImageTab("upload")}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${imageTab === "upload" ? "bg-white shadow text-[#0c433a]" : "text-black/60 hover:text-black"}`}
                    >
                      <Upload size={12} /> Upload
                    </button>
                  </div>

                  {imageTab === "url" ? (
                    <input
                      value={form.imageUrl}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50"
                      placeholder="https://..."
                    />
                  ) : (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-[#c5e1d7] rounded-xl px-6 py-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[#72ccbd] hover:bg-[#edf9f5] transition-all"
                    >
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                      {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 rounded-full border-4 border-[#c5e1d7] border-t-[#0c433a] animate-spin" />
                          <span className="text-sm font-bold text-[#0c433a]">Uploading…</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={28} className="text-[#72ccbd]" />
                          <div className="text-center">
                            <p className="font-bold text-sm text-[#0c3a32]">Click to upload image</p>
                            <p className="text-xs text-black/40 mt-1">JPG, PNG, WebP · Max 5MB · Recommended: 1920×720px</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Live Preview */}
                  {previewSrc && (
                    <div className="mt-4">
                      <p className="text-xs font-black text-black/50 mb-2 uppercase tracking-widest flex items-center gap-1.5"><Eye size={12} /> Hero Preview</p>
                      <div className="relative aspect-[21/7] w-full rounded-2xl overflow-hidden bg-[#72ccbd] shadow-inner">
                        <Image src={previewSrc} alt="preview" fill className="object-cover object-[85%_center]" unoptimized={previewSrc.startsWith("/")} />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#72ccbd] via-[#72ccbd]/80 via-40% to-transparent" />
                        {/* Overlay preview text */}
                        <div className="absolute inset-0 flex flex-col justify-center px-6 gap-1.5">
                          {form.offerText && (
                            <span className="inline-block text-[8px] font-black uppercase tracking-widest text-white bg-white/15 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/30 w-fit">
                              {form.offerText}
                            </span>
                          )}
                          {form.title && (
                            <p className="font-serif text-white text-base sm:text-xl font-semibold leading-tight drop-shadow-sm max-w-xs">
                              {form.title}
                            </p>
                          )}
                          {form.subtitle && (
                            <p className="text-[8px] text-white/90 max-w-xs leading-snug">{form.subtitle}</p>
                          )}
                          {form.ctaText && form.link && (
                            <span className="inline-flex items-center gap-1 bg-[#0c433a] text-white text-[8px] font-black uppercase px-3 py-1 rounded-full w-fit mt-1">
                              {form.ctaText}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Text & CTA */}
            {formTab === "text" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-black/60 mb-1 uppercase tracking-widest">Offer Tag / Badge Text</label>
                    <input value={form.offerText} onChange={(e) => setForm({ ...form, offerText: e.target.value })}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50" placeholder="e.g. NATURALLY RADIANT or 50% OFF" />
                    <p className="text-[10px] text-black/30 mt-1">Shown as a small pill badge above the headline</p>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black/60 mb-1 uppercase tracking-widest">CTA Button Text</label>
                    <input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50" placeholder="SHOP NOW" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-black/60 mb-1 uppercase tracking-widest">Headline (supports line breaks with \n)</label>
                    <textarea value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      rows={3}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50 resize-none" placeholder={"Skincare that cares,\nbeauty that shines."} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-black/60 mb-1 uppercase tracking-widest">Subtitle / Description</label>
                    <textarea value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                      rows={2}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50 resize-none" placeholder="Discover the perfect blend of nature and science…" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-black/60 mb-1 uppercase tracking-widest">CTA Button Link URL</label>
                    <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50" placeholder="/products or https://..." />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Style */}
            {formTab === "style" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-black/60 mb-1 uppercase tracking-widest">Background Color Tint</label>
                    <div className="flex gap-2">
                      <input value={form.backgroundColor} onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                        className="flex-1 border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50" placeholder="#72ccbd" />
                      <div className="w-12 h-12 rounded-xl border border-black/10 shadow-inner" style={{ backgroundColor: form.backgroundColor || "#72ccbd" }} />
                    </div>
                    <p className="text-[10px] text-black/30 mt-1">Applied as a translucent tint over the slide</p>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black/60 mb-1 uppercase tracking-widest">Text / Overlay Color</label>
                    <div className="flex gap-2">
                      <input value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                        className="flex-1 border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50" placeholder="#ffffff" />
                      <div className="w-12 h-12 rounded-xl border border-black/10 shadow-inner" style={{ backgroundColor: form.textColor || "#ffffff" }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black/60 mb-1 uppercase tracking-widest">Sort Order (lower = appears first)</label>
                    <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black/60 mb-1 uppercase tracking-widest">Priority</label>
                    <select value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50">
                      <option value="1">Low (1)</option>
                      <option value="2">Medium (2)</option>
                      <option value="3">High (3)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Schedule */}
            {formTab === "schedule" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-black/50 mb-1 uppercase tracking-widest">Start Date (optional)</label>
                    <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black/50 mb-1 uppercase tracking-widest">End Date (optional)</label>
                    <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-black/50 mb-1 uppercase tracking-widest">Discount ID (optional)</label>
                    <input value={form.discountId} onChange={(e) => setForm({ ...form, discountId: e.target.value })}
                      className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#72ccbd]/50" placeholder="Link to discount for tracking" />
                  </div>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#e5f3ee]">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={`relative w-11 h-6 rounded-full transition-all duration-250 cursor-pointer ${form.active ? "bg-[#0c433a]" : "bg-black/15"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-250 ${form.active ? "left-5.5" : "left-0.5"}`} style={{ left: form.active ? "calc(100% - 22px)" : "2px" }} />
                </div>
                <span className="text-sm font-bold text-[#0c3a32]">
                  {form.active ? "Active — Visible on homepage slider" : "Inactive — Hidden from slider"}
                </span>
              </label>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#0c433a] text-white rounded-xl text-sm font-bold hover:bg-[#072a24] disabled:opacity-50 transition-all shadow-md"
              >
                {saving ? "Saving…" : <><Check size={16} /> {editing ? "Update Banner" : "Create Banner"}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banners Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-4 border-[#c5e1d7] border-t-[#0c433a] animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-20 text-black/30">
          <Tag size={48} className="mx-auto mb-4 opacity-20" />
          <p className="font-bold text-lg">No hero banners yet</p>
          <p className="text-sm mt-1">Add your first banner to populate the homepage slider</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-2xl border border-[#c5e1d7] shadow-sm p-4 flex items-center gap-4 hover:border-[#72ccbd] transition-colors">
              {/* Thumbnail */}
              {isValidImageSrc(banner.imageUrl) && (
                <div className="relative w-36 h-20 rounded-xl overflow-hidden bg-[#edf9f5] flex-shrink-0 border border-[#c5e1d7]">
                  <Image src={banner.imageUrl} alt={banner.title || "banner"} fill className="object-cover" unoptimized={banner.imageUrl.startsWith("/")} />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full flex items-center gap-1 ${banner.active ? "bg-[#edf9f5] text-[#0c433a] border border-[#c5e1d7]" : "bg-red-50 text-red-400 border border-red-200"}`}>
                    {banner.active ? <Eye size={10} /> : <EyeOff size={10} />}
                    {banner.active ? "Live" : "Hidden"}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    banner.priority === 3 ? "bg-red-50 text-red-600 border-red-200" : banner.priority === 2 ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-blue-50 text-blue-600 border-blue-200"
                  }`}>
                    {banner.priority === 3 ? "High Priority" : banner.priority === 2 ? "Medium" : "Low"}
                  </span>
                  <span className="text-[10px] text-black/30 font-bold">Order #{banner.sortOrder}</span>
                </div>
                <h3 className="font-bold text-sm text-[#0c3a32] truncate">{banner.title || "(No headline)"}</h3>
                {banner.subtitle && <p className="text-xs text-black/40 truncate mt-0.5">{banner.subtitle}</p>}
                {banner.offerText && (
                  <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-widest bg-[#edf9f5] text-[#0c433a] px-2 py-0.5 rounded-full border border-[#c5e1d7]">
                    {banner.offerText}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <button onClick={() => edit(banner)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#edf9f5] text-[#0c433a] text-xs font-bold transition-colors">
                  <Edit2 size={14} /> Edit
                </button>
                <button onClick={() => del(banner.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 text-black/30 hover:text-red-500 text-xs font-bold transition-colors">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
