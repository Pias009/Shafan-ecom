"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Edit2, Check, X, Eye, EyeOff, BookOpen, Upload, Link as LinkIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  tags: string[];
  published: boolean;
  createdAt: string;
}

const emptyForm = { title: "", excerpt: "", content: "", coverImage: "", tags: "", published: false };

/** Returns true only if str is a valid absolute URL or a /path */
function isValidImageSrc(src: string): boolean {
  if (!src.trim()) return false;
  if (src.startsWith("/")) return true; // local path
  try {
    const u = new URL(src);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
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
    const r = await fetch("/api/admin/blog");
    if (r.ok) setPosts(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleFileUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "ecommerce/blog");
    try {
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await r.json();
      if (r.ok && data.url) {
        setForm((f) => ({ ...f, coverImage: data.url }));
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
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      excerpt: form.excerpt,
      content: form.content,
      coverImage: form.coverImage || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      published: form.published,
    };
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/blog/${editing}` : "/api/admin/blog";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (r.ok) {
      toast.success(editing ? "Post updated!" : "Post created!");
      setForm(emptyForm);
      setEditing(null);
      setShowForm(false);
      load();
    } else {
      const err = await r.json().catch(() => ({}));
      toast.error(err.error || "Failed to save");
    }
    setSaving(false);
  }

  async function del(id: string) {
    if (!confirm("Delete this post?")) return;
    const r = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    if (r.ok) { toast.success("Deleted"); load(); } else toast.error("Failed");
  }

  function edit(post: BlogPost) {
    setForm({ title: post.title, excerpt: post.excerpt || "", content: post.content, coverImage: post.coverImage || "", tags: post.tags.join(", "), published: post.published });
    setEditing(post.id);
    setShowForm(true);
    setImageTab("url");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const previewSrc = isValidImageSrc(form.coverImage) ? form.coverImage : null;

  return (
    <div className="space-y-8">
      <Toaster />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog & Announcements</h1>
          <p className="text-sm text-black/70 mt-1">Manage published blog posts & offers</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm); setEditing(null); setShowForm(!showForm); setImageTab("url"); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 transition-all"
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New Post</>}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-black/10 shadow-sm p-6 space-y-5">
          <h2 className="font-bold text-lg">{editing ? "Edit Post" : "New Post"}</h2>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-black/70 mb-1 uppercase tracking-widest">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="Post title" />
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-xs font-bold text-black/70 mb-2 uppercase tracking-widest">Cover Image</label>
            {/* Tabs */}
            <div className="flex gap-1 mb-3 bg-black/5 rounded-xl p-1 w-fit">
              <button onClick={() => setImageTab("url")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${imageTab === "url" ? "bg-white shadow text-black" : "text-black/50 hover:text-black"}`}>
                <LinkIcon size={12} /> URL
              </button>
              <button onClick={() => setImageTab("upload")}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${imageTab === "upload" ? "bg-white shadow text-black" : "text-black/50 hover:text-black"}`}>
                <Upload size={12} /> Upload
              </button>
            </div>

            {imageTab === "url" ? (
              <input value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="https://example.com/image.jpg" />
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
                    <span className="text-sm font-bold text-black/50">Uploading…</span>
                  </div>
                ) : (
                  <>
                    <Upload size={28} className="text-black/30" />
                    <div className="text-center">
                      <p className="font-bold text-sm text-black/60">Click to upload image</p>
                      <p className="text-xs text-black/40 mt-1">JPG, PNG, WebP or GIF · Max 5MB</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Preview — only rendered when URL is valid */}
            {previewSrc && (
              <div className="mt-3">
                <p className="text-xs font-bold text-black/40 mb-1.5 uppercase tracking-widest">Preview</p>
                <div className="relative aspect-[16/5] w-full rounded-xl overflow-hidden bg-black/5">
                  <Image
                    src={previewSrc}
                    alt="cover preview"
                    fill
                    className="object-cover"
                    unoptimized={previewSrc.startsWith("/")}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Tags & Excerpt */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-widest">Tags (comma separated)</label>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20" placeholder="Skin Care, Offer, Hair Care" />
            </div>
            <div>
              <label className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-widest">Excerpt (short summary)</label>
              <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                rows={2} className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 resize-none" placeholder="A brief summary…" />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-black/50 mb-1 uppercase tracking-widest">Content * <span className="normal-case font-normal text-black/30">(HTML supported, or plain text)</span></label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={10} className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black/20 resize-y" placeholder="Write your post content here..." />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-black/5">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })}
                className="w-4 h-4 rounded accent-black" />
              <span className="text-sm font-bold">Published (visible to public)</span>
            </label>
            <button onClick={save} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-black/80 disabled:opacity-50 transition-all">
              {saving ? "Saving…" : <><Check size={16} /> {editing ? "Update" : "Publish"} Post</>}
            </button>
          </div>
        </div>
      )}

      {/* Post list */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-4 border-black/10 border-t-black animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-black/40">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-bold">No posts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl border border-black/8 shadow-sm p-4 flex items-center gap-4">
              {post.coverImage && isValidImageSrc(post.coverImage) && (
                <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-black/5 flex-shrink-0">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    unoptimized={post.coverImage.startsWith("/")}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${post.published ? "bg-emerald-50 text-emerald-600" : "bg-black/5 text-black/40"}`}>
                    {post.published ? <><Eye size={8} /> Published</> : <><EyeOff size={8} /> Draft</>}
                  </span>
                  {post.tags.slice(0, 3).map((t) => (
                    <span key={t} className="text-[9px] font-black uppercase tracking-widest text-black/30 bg-black/5 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
                <h3 className="font-bold text-sm text-black truncate">{post.title}</h3>
                <p className="text-xs text-black/40 mt-0.5">{new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => edit(post)} className="p-2 rounded-xl hover:bg-black/5 text-black/40 hover:text-black transition-colors" title="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => del(post.id)} className="p-2 rounded-xl hover:bg-red-50 text-black/40 hover:text-red-500 transition-colors" title="Delete">
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
