"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit2, Check, X, Tag, Upload, Link as LinkIcon, ImageIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

/** Returns true only if src is a valid absolute URL or /path */
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
  ctaText: "",
  backgroundColor: "",
  textColor: "",
  backgroundImage: "",
  startDate: "",
  endDate: "",
  priority: 2,
  discountId: "",
  isHero: true
};

export default function AdminHeroBannersPage() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageTab, setImageTab] = useState<"url" | "upload">("url");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/offer-banners");
      if (r.ok) {
        const data = await r.json();
        // Filter to show only hero banners or all banners for management
        setBanners(data);
      }
    } catch (error) {
      console.error("Error loading banners:", error);
    }
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
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    }
    setUploading(false);
  }

  async function save() {
    if (!form.imageUrl.trim()) { toast.error("Image URL is required"); return; }
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
        const error = await r.text();
        console.error("Save error:", error);
        toast.error("Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save");
    }
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm("Delete this banner?")) return;
    try {
      const r = await fetch(`/api/admin/offer-banners/${id}`, { method: "DELETE" });
      if (r.ok) { toast.success("Deleted"); load(); } else toast.error("Failed");
    } catch {
      toast.error("Failed to delete");
    }
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
      ctaText: banner.ctaText || "",
      backgroundColor: banner.backgroundColor || "",
      textColor: banner.textColor || "",
      backgroundImage: banner.backgroundImage || "",
      startDate: banner.startDate || "",
      endDate: banner.endDate || "",
      priority: banner.priority || 2,
      discountId: banner.discountId || "",
      isHero: true
    });
    setEditing(banner.id); setShowForm(true); setImageTab("url");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const previewSrc = isValidImageSrc(form.imageUrl) ? form.imageUrl : null;

  return (
    <div className="space-y-8">
      <Toaster />
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-xl text-white"><ImageIcon size={20} /></div>
            <div>
              <h1 className="text-2xl font-bold">Hero Banners</h1>
              <p className="text-sm text-black/70 mt-1">Manage hero banners shown on the homepage</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(!showForm); setImageTab("url"); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-all"
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Banner</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-black/10 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-lg">{editing ? "Edit Banner" : "New Hero Banner"}</h2>

          {/* Image section */}
          <div>
            <label className="block text-xs font-bold text-black/70 mb-2 uppercase tracking-widest">Banner Image *</label>
            <div className="flex gap-1 mb-3 bg-black/5 rounded-xl p-1 w-fit">
              <button onClick={() => setImageTab("url")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${imageTab === "url" ? "bg-white shadow text-black" : "text-black/70 hover:text-black"}`}>
                <LinkIcon size={12} /> URL
              </button>
              <button onClick={() => setImageTab("upload")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${imageTab === "upload" ? "bg-white shadow text-black" : "text-black/70 hover:text-black"}`}>
                <Upload size={12} /> Upload
              </button>
            </div>

            {imageTab === "url" ? (
              <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="https://..." />
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-black/15 rounded-xl px-6 py-8 flex flex-col items-center gap-3 cursor-pointer hover:border-black/30 hover:bg-black/[0.02] transition-all"
              >
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full border-4 border-black/10 border-t-black animate-spin" />
                    <span className="text-sm font-bold text-black/70">Uploading…</span>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="text-black/50" />
                    <div className="text-center">
                      <p className="font-bold text-sm text-black/70">Click to upload image</p>
                      <p className="text-xs text-black/60 mt-1">JPG, PNG, WebP or GIF · Max 5MB</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Preview */}
            {previewSrc && (
              <div className="mt-3">
                <p className="text-xs font-bold text-black/70 mb-1.5 uppercase tracking-widest">Preview</p>
                <div className="relative aspect-[21/6] w-full rounded-xl overflow-hidden bg-black/5">
                  <Image src={previewSrc} alt="preview" fill className="object-cover" unoptimized={previewSrc.startsWith("/")} />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-widest">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="Summer Sale" />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-widest">Subtitle</label>
              <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="Up to 50% off" />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-widest">Link URL</label>
              <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="/products or https://..." />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-widest">Sort Order (lower = first)</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
            </div>
          </div>

          {/* Enhanced fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-widest">Offer Text</label>
              <input value={form.offerText} onChange={(e) => setForm({ ...form, offerText: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="70% OFF or $50 OFF" />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-widest">CTA Button Text</label>
              <input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="Shop Now or Learn More" />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-widest">Background Color</label>
              <div className="flex gap-2">
                <input value={form.backgroundColor} onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })}
                  className="flex-1 border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="#FFFFFF" />
                <div className="w-12 h-12 rounded-xl border border-black/10" style={{ backgroundColor: form.backgroundColor || '#FFFFFF' }} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-widest">Text Color</label>
              <div className="flex gap-2">
                <input value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                  className="flex-1 border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="#000000" />
                <div className="w-12 h-12 rounded-xl border border-black/10" style={{ backgroundColor: form.textColor || '#000000' }} />
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-widest">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20">
                <option value="1">Low (1)</option>
                <option value="2">Medium (2)</option>
                <option value="3">High (3)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-widest">Discount ID (optional)</label>
              <input value={form.discountId} onChange={(e) => setForm({ ...form, discountId: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="Discount ID for tracking" />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-widest">Start Date (optional)</label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-widest">End Date (optional)</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-black/5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 rounded accent-black" />
              <span className="text-sm font-bold">Active (visible on homepage)</span>
            </label>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 disabled:opacity-50 transition-all">
              {saving ? "Saving…" : <><Check size={16} /> {editing ? "Update" : "Create"} Banner</>}
            </button>
          </div>
        </div>
      )}

      {/* Banners list */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-4 border-black/10 border-t-black animate-spin" /></div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-black/40">
          <Tag size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">No hero banners yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner) => (
            <div key={banner.id} className="bg-white rounded-2xl border border-black/8 shadow-sm p-4 flex items-center gap-4">
              {isValidImageSrc(banner.imageUrl) && (
                <div className="relative w-32 h-16 rounded-xl overflow-hidden bg-black/5 flex-shrink-0">
                  <Image src={banner.imageUrl} alt={banner.title || "banner"} fill className="object-cover" unoptimized={banner.imageUrl.startsWith("/")} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${banner.active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-400"}`}>
                    {banner.active ? "Active" : "Inactive"}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    banner.priority === 3 ? "bg-red-50 text-red-600" : banner.priority === 2 ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {banner.priority === 3 ? "High" : banner.priority === 2 ? "Medium" : "Low"}
                  </span>
                  <span className="text-[10px] text-black/30 font-bold">Order: {banner.sortOrder}</span>
                </div>
                <h3 className="font-bold text-sm text-black truncate">{banner.title || "(No title)"}</h3>
                {banner.subtitle && <p className="text-xs text-black/50 truncate">{banner.subtitle}</p>}
                {banner.link && <p className="text-xs text-black/30 truncate">{banner.link}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => edit(banner)} className="p-2 rounded-xl hover:bg-black/5 text-black/40 hover:text-black transition-colors">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => del(banner.id)} className="p-2 rounded-xl hover:bg-red-50 text-black/40 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
