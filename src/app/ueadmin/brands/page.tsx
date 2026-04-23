"use client";

import { useState, useEffect, useRef } from "react";
import { useAdminSession } from "../_components/useAdminSession";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Plus, Edit, Trash2, ChevronDown, ChevronUp, 
  Layers, Package, ImageIcon, X, Upload
} from "lucide-react";
import toast from "react-hot-toast";

interface Brand {
  id: string;
  name: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

export default function BrandsPage() {
  const { data: session, status } = useAdminSession();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    image: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/brands");
      if (!response.ok) {
        throw new Error("Failed to fetch brands");
      }
      const data = await response.json();
      setBrands(data);
    } catch (error) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/ueadmin/login");
    } else if (status === "authenticated") {
      fetchBrands();
    }
  }, [status, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ name: "", image: "" });
    setEditingBrand(null);
    setShowForm(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, image: data.url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Brand name is required");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingBrand 
        ? `/api/admin/brands/${editingBrand.id}`
        : "/api/admin/brands";
      
      const method = editingBrand ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save brand");
      }

      const savedBrand = await response.json();
      
      if (editingBrand) {
        setBrands(prev => prev.map(brand => 
          brand.id === savedBrand.id ? savedBrand : brand
        ));
        toast.success("Brand updated successfully");
      } else {
        setBrands(prev => [savedBrand, ...prev]);
        toast.success("Brand created successfully");
      }
      
      resetForm();
    } catch (error: any) {
      console.error("Error saving brand:", error);
      toast.error(error.message || "Failed to save brand");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      image: brand.image || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (brandId: string) => {
    if (!confirm("Are you sure you want to delete this brand? This cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/brands/${brandId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete brand");
      }

      setBrands(prev => prev.filter(brand => brand.id !== brandId));
      toast.success("Brand deleted successfully");
    } catch (error: any) {
      console.error("Error deleting brand:", error);
      toast.error(error.message || "Failed to delete brand");
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Brand Management</h1>
          <p className="text-black/40 text-sm mt-2">
            Create and manage product brands with logos.
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
          {showForm ? "Cancel" : "New Brand"}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel p-8 rounded-3xl border border-black/5">
          <h2 className="text-xl font-black mb-6">
            {editingBrand ? "Edit Brand" : "Create New Brand"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="e.g., La Roche-Posay, CeraVe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  Brand Logo (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl border border-black/10 overflow-hidden bg-black/5">
                    {formData.image ? (
                      <Image
                        src={formData.image}
                        alt="Brand logo"
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={24} className="text-black/30" />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 border border-black/10 rounded-xl font-black text-sm hover:bg-black/5 transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload Logo
                        </>
                      )}
                    </button>
                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: "" }))}
                        className="flex items-center gap-1 px-2 py-1 text-sm text-red-500 hover:text-red-600 ml-2"
                      >
                        <X size={14} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingBrand ? "Update Brand" : "Create Brand"}
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

      <div className="space-y-4">
        <h2 className="text-xl font-black">All Brands ({brands.length})</h2>

        {brands.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-black/5 text-center">
            <Layers className="w-12 h-12 mx-auto text-black/20 mb-4" />
            <h3 className="text-lg font-black mb-2">No brands yet</h3>
            <p className="text-black/40 mb-6">Create your first brand to get started</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all"
            >
              Create Brand
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="glass-panel rounded-3xl border border-black/5 p-6 hover:border-black/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="relative w-14 h-14 rounded-2xl bg-black/5 overflow-hidden flex items-center justify-center shrink-0">
                    {brand.image ? (
                      <Image
                        src={brand.image}
                        alt={brand.name}
                        fill
                        className="object-contain"
                      />
                    ) : (
                      <Layers size={20} className="text-black/30" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(brand)}
                      className="p-2 rounded-xl hover:bg-black/5 transition-all"
                      title="Edit brand"
                    >
                      <Edit size={16} className="text-black/60" />
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 transition-all"
                      title="Delete brand"
                      disabled={(brand._count?.products ?? 0) > 0}
                    >
                      <Trash2 
                        size={16} 
                        className={(brand._count?.products ?? 0) > 0 ? "text-black/20" : "text-red-500/60"} 
                      />
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="font-black text-lg">{brand.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-black/40">
                    <span className="flex items-center gap-1">
                      <Package size={12} />
                      {brand._count?.products || 0} products
                    </span>
                    <span>
                      {new Date(brand.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">{brands.length}</div>
          <div className="text-sm text-black/40 mt-2">Total Brands</div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">
            {brands.filter(b => b.image).length}
          </div>
          <div className="text-sm text-black/40 mt-2">Brands with Logos</div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">
            {brands.reduce((sum, b) => sum + (b._count?.products || 0), 0)}
          </div>
          <div className="text-sm text-black/40 mt-2">Total Products</div>
        </div>
      </div>
    </div>
  );
}