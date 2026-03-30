"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Plus, Edit, Trash2, Palette, Package, 
  AlertCircle, Check, X, Droplets 
} from "lucide-react";
import toast from "react-hot-toast";

interface SkinTone {
  id: string;
  name: string;
  description?: string;
  hexColor?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}

export default function SkinTonesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [skinTones, setSkinTones] = useState<SkinTone[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingSkinTone, setEditingSkinTone] = useState<SkinTone | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    hexColor: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Predefined skin tone options from feedback
  const predefinedSkinTones = [
    { name: "Oily Skin", hexColor: "#4A90E2" },
    { name: "Dry Skin", hexColor: "#F5A623" },
    { name: "Normal Skin", hexColor: "#7ED321" },
    { name: "Combination", hexColor: "#BD10E0" },
    { name: "Acne-prone Skin", hexColor: "#D0021B" },
    { name: "All type Skin", hexColor: "#50E3C2" },
  ];

  // Fetch skin tones
  const fetchSkinTones = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/skin-tones");
      if (!response.ok) {
        throw new Error("Failed to fetch skin tones");
      }
      const data = await response.json();
      setSkinTones(data);
    } catch (error) {
      console.error("Error fetching skin tones:", error);
      toast.error("Failed to load skin tones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/ueadmin/login");
    } else if (status === "authenticated") {
      fetchSkinTones();
    }
  }, [status, router]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Use predefined skin tone
  const usePredefinedTone = (tone: { name: string; hexColor: string }) => {
    setFormData({
      name: tone.name,
      description: `Suitable for products targeting ${tone.name.toLowerCase()}`,
      hexColor: tone.hexColor,
    });
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: "", description: "", hexColor: "" });
    setEditingSkinTone(null);
    setShowForm(false);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Skin tone name is required");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingSkinTone 
        ? `/api/admin/skin-tones/${editingSkinTone.id}`
        : "/api/admin/skin-tones";
      
      const method = editingSkinTone ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save skin tone");
      }

      const savedSkinTone = await response.json();
      
      if (editingSkinTone) {
        setSkinTones(prev => prev.map(tone => 
          tone.id === savedSkinTone.id ? savedSkinTone : tone
        ));
        toast.success("Skin tone updated successfully");
      } else {
        setSkinTones(prev => [savedSkinTone, ...prev]);
        toast.success("Skin tone created successfully");
      }
      
      resetForm();
    } catch (error: any) {
      console.error("Error saving skin tone:", error);
      toast.error(error.message || "Failed to save skin tone");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit skin tone
  const handleEdit = (skinTone: SkinTone) => {
    setEditingSkinTone(skinTone);
    setFormData({
      name: skinTone.name,
      description: skinTone.description || "",
      hexColor: skinTone.hexColor || "",
    });
    setShowForm(true);
  };

  // Delete skin tone
  const handleDelete = async (skinToneId: string) => {
    if (!confirm("Are you sure you want to delete this skin tone?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/skin-tones/${skinToneId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete skin tone");
      }

      setSkinTones(prev => prev.filter(tone => tone.id !== skinToneId));
      toast.success("Skin tone deleted successfully");
    } catch (error: any) {
      console.error("Error deleting skin tone:", error);
      toast.error(error.message || "Failed to delete skin tone");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Skin Tone Management</h1>
          <p className="text-black/40 text-sm mt-2">
            Create and manage skin tone options for product filtering and categorization.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all"
        >
          <Plus size={18} />
          {showForm ? "Cancel" : "New Skin Tone"}
        </button>
      </div>

      {/* Predefined Skin Tones */}
      <div className="glass-panel p-6 rounded-3xl border border-black/5">
        <h3 className="font-black text-sm uppercase tracking-widest mb-4">
          Quick Add from Standard List
        </h3>
        <p className="text-black/60 text-sm mb-6">
          These are the standard skin tone options mentioned in the project feedback.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {predefinedSkinTones.map((tone, index) => {
            const exists = skinTones.some(st => st.name === tone.name);
            return (
              <button
                key={index}
                onClick={() => exists ? null : usePredefinedTone(tone)}
                disabled={exists}
                className={`p-4 rounded-2xl flex flex-col items-center justify-center transition-all ${
                  exists 
                    ? "bg-black/5 cursor-not-allowed" 
                    : "bg-black/[0.02] hover:bg-black/5 border border-black/5"
                }`}
              >
                <div 
                  className="w-8 h-8 rounded-full mb-2 border border-black/10"
                  style={{ backgroundColor: tone.hexColor }}
                />
                <span className={`font-medium text-sm ${exists ? "text-black/40" : "text-black"}`}>
                  {tone.name}
                </span>
                {exists && (
                  <span className="text-[10px] text-black/30 mt-1 flex items-center gap-1">
                    <Check size={10} /> Added
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="glass-panel p-8 rounded-3xl border border-black/5">
          <h2 className="text-xl font-black mb-6">
            {editingSkinTone ? "Edit Skin Tone" : "Create New Skin Tone"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  Skin Tone Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="e.g., Oily Skin, Dry Skin, Combination"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest mb-2">
                    Color Code (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      name="hexColor"
                      value={formData.hexColor}
                      onChange={handleInputChange}
                      className="flex-1 px-6 py-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="#4A90E2"
                    />
                    {formData.hexColor && (
                      <div 
                        className="w-12 h-12 rounded-2xl border border-black/10"
                        style={{ backgroundColor: formData.hexColor }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-black/40 mt-2">
                    Hex color code for visual representation
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest mb-2">
                    Preview
                  </label>
                  <div className="h-12 rounded-2xl border border-black/10 flex items-center justify-center">
                    {formData.name ? (
                      <div className="flex items-center gap-3">
                        {formData.hexColor && (
                          <div 
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: formData.hexColor }}
                          />
                        )}
                        <span className="font-medium">{formData.name}</span>
                      </div>
                    ) : (
                      <span className="text-black/40">Enter name to preview</span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20 min-h-[100px]"
                  placeholder="Description of this skin tone and suitable products..."
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingSkinTone ? "Update Skin Tone" : "Create Skin Tone"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-8 py-3 border border-black/10 text-black/60 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Skin Tones List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">All Skin Tones ({skinTones.length})</h2>
          <div className="text-sm text-black/40">
            Used for product filtering and categorization
          </div>
        </div>

        {skinTones.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-black/5 text-center">
            <Palette className="w-12 h-12 mx-auto text-black/20 mb-4" />
            <h3 className="text-lg font-black mb-2">No skin tones yet</h3>
            <p className="text-black/40 mb-6">
              Create skin tone options to help customers find suitable products
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all"
            >
              Create Skin Tone
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skinTones.map((skinTone) => (
              <div
                key={skinTone.id}
                className="glass-panel p-6 rounded-3xl border border-black/5 hover:border-black/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {skinTone.hexColor ? (
                      <div 
                        className="w-10 h-10 rounded-xl border border-black/10"
                        style={{ backgroundColor: skinTone.hexColor }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                        <Palette size={18} className="text-black/60" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-black">{skinTone.name}</h3>
                      <div className="text-xs text-black/40 mt-1">
                        {skinTone._count.products} products
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(skinTone)}
                      className="p-2 rounded-xl hover:bg-black/5 transition-all"
                      title="Edit skin tone"
                    >
                      <Edit size={16} className="text-black/60" />
                    </button>
                    <button
                      onClick={() => handleDelete(skinTone.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 transition-all"
                      title="Delete skin tone"
                      disabled={skinTone._count.products > 0}
                    >
                      <Trash2 
                        size={16} 
                        className={skinTone._count.products > 0 ? "text-black/20" : "text-red-500/60"} 
                      />
                    </button>
                  </div>
                </div>
                
                {skinTone.description && (
                  <p className="text-sm text-black/60 mb-4 line-clamp-2">
                    {skinTone.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-black/40">
                  <span>
                    Created: {new Date(skinTone.createdAt).toLocaleDateString()}
                  </span>
                  {skinTone.hexColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: skinTone.hexColor }}
                      />
                      <span>{skinTone.hexColor}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">{skinTones.length}</div>
          <div className="text-sm text-black/40 mt-2">Total Skin Tones</div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">
            {skinTones.reduce((sum, tone) => sum + tone._count.products, 0)}
          </div>
          <div className="text-sm text-black/40 mt-2">Total Products</div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">
            {skinTones.filter(tone => tone.hexColor).length}
          </div>
          <div className="text-sm text-black/40 mt-2">With Color Code</div>
        </div>
      </div>
    </div>
  );
}