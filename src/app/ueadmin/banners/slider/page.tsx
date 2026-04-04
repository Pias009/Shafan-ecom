"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit2, X, Upload, Link as LinkIcon, ImageIcon, ArrowUpDown } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

function isValidImageSrc(src: string): boolean {
  if (!src.trim()) return false;
  if (src.startsWith("/")) return true;
  try {
    const u = new URL(src);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

interface ProductSliderBanner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
}

const emptyForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  active: true,
  sortOrder: 0,
};

export default function ProductSliderBannersPage() {
  const [banners, setBanners] = useState<ProductSliderBanner[]>([]);
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
      // Use EnhancedOfferBanner API with priority=2 for slider banners
      const r = await fetch("/api/admin/offer-banners?isHero=true");
      if (r.ok) {
        const data = await r.json();
        // Filter to get only slider-style banners (those with title+subtitle)
        setBanners(data.filter((b: any) => b.title && b.subtitle));
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
    fd.append("folder", "ecommerce/slider");
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
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.imageUrl.trim()) { toast.error("Image is required"); return; }
    setSaving(true);
    
    // Create slider-style banner with isHero=true
    const payload = {
      ...form,
      sortOrder: Number(form.sortOrder),
      priority: 2,
      isHero: true,
      subtitle: form.subtitle || "",
    };
    
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/offer-banners/${editing}` : "/api/admin/offer-banners";
    try {
      const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (r.ok) {
        toast.success(editing ? "Banner updated!" : "Banner created!");
        setForm(emptyForm); setEditing(null); setShowForm(false); load();
      } else {
        const error = await r.json();
        toast.error(error.error || "Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save");
    }
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm("Delete this slider banner?")) return;
    try {
      const r = await fetch(`/api/admin/offer-banners/${id}`, { method: "DELETE" });
      if (r.ok) { toast.success("Deleted"); load(); } else toast.error("Failed");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function toggleActive(banner: ProductSliderBanner) {
    try {
      const r = await fetch(`/api/admin/offer-banners/${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...banner, active: !banner.active })
      });
      if (r.ok) { toast.success(!banner.active ? "Activated" : "Deactivated"); load(); }
      else toast.error("Failed");
    } catch { toast.error("Failed"); }
  }

  function edit(banner: ProductSliderBanner) {
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      imageUrl: banner.imageUrl || "",
      active: banner.active,
      sortOrder: banner.sortOrder,
    });
    setEditing(banner.id); setShowForm(true); setImageTab("url");
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
              <h1 className="text-2xl font-bold">Products Slider Banners</h1>
              <p className="text-sm text-black/50 mt-1">Manage the animated banner slider on products page</p>
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
          <h2 className="font-bold text-lg">{editing ? "Edit Banner" : "New Slider Banner"}</h2>

          {/* Image */}
          <div>
            <label className="block text-xs font-bold text-black/50 mb-2 uppercase tracking-widest">Background Image *</label>
            <div className="flex gap-1 mb-3 bg-black/5 rounded-xl p-1 w-fit">
              <button onClick={() => setImageTab("url")} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold ${imageTab === "url" ? "bg-white shadow text-black" : "text-black/50"}`}>
                <LinkIcon size={12} /> URL
              </button>
              <button onClick={() => setImageTab("upload")} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold ${imageTab === "upload" ? "bg-white shadow text-black" : "text-black/50"}`}>
                <Upload size={12} /> Upload
              </button>
            </div>

            {imageTab === "url" ? (
              <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm" placeholder="https://..." />
            ) : (
              <div onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-black/15 rounded-xl px-6 py-8 flex flex-col items-center gap-3 cursor-pointer">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                {uploading ? <div className="w-8 h-8 border-4 border-black/10 border-t-black animate-spin rounded-full" /> : <><Upload size={28} className="text-black/30" /><p className="text-sm text-black/60">Click to upload</p></>}
              </div>
            )}

            {previewSrc && (
              <div className="mt-3">
                <p className="text-xs font-bold text-black/40 mb-1">Preview</p>
                <div className="relative aspect-[21/9] w-full rounded-xl overflow-hidden bg-black/5">
                  <Image src={previewSrc} alt="preview" fill className="object-cover" unoptimized={previewSrc.startsWith("/")} />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1 uppercase">Title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm" placeholder="Eco-Conscious Skincare" />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1 uppercase">Subtitle</label>
              <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm" placeholder="Premium formulas for a natural glow" />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1 uppercase">Sort Order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm" />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-5 h-5 rounded" />
                <span className="text-sm font-bold">Active (show in slider)</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={save} disabled={saving} className="px-6 py-3 bg-black text-white rounded-xl font-bold text-sm disabled:opacity-50">
              {saving ? "Saving..." : (editing ? "Update Banner" : "Create Banner")}
            </button>
          </div>
        </div>
      )}

      {/* Banner List */}
      {loading ? (
        <div className="text-center py-12 text-black/50">Loading...</div>
      ) : banners.length === 0 ? (
        <div className="text-center py-12 text-black/50">
          <p>No slider banners found. Create your first banner!</p>
          <p className="text-xs mt-2">These appear on the products page as an animated slider at the top.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {banners.sort((a, b) => a.sortOrder - b.sortOrder).map((banner) => (
            <div key={banner.id} className="flex items-center gap-4 bg-white rounded-2xl border border-black/10 p-4">
              <div className="w-40 h-24 relative rounded-xl overflow-hidden bg-black/5 flex-shrink-0">
                {banner.imageUrl && <Image src={banner.imageUrl} alt={banner.title} fill className="object-cover" unoptimized />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg">{banner.title}</h3>
                <p className="text-sm text-black/50 truncate">{banner.subtitle}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${banner.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {banner.active ? "Active" : "Inactive"}
                  </span>
                  <span className="text-[10px] text-black/30">Order: {banner.sortOrder}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(banner)} className={`p-2 rounded-lg text-xs font-bold ${banner.active ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  {banner.active ? "Disable" : "Enable"}
                </button>
                <button onClick={() => edit(banner)} className="p-2 hover:bg-black/5 rounded-lg"><Edit2 size={16} /></button>
                <button onClick={() => del(banner.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}