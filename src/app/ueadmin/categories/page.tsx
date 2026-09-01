"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAdminSession } from "../_components/useAdminSession";
import { useRouter } from "next/navigation";
import { 
  Plus, Edit, Trash2, ChevronDown, ChevronUp, 
  Layers, Package, AlertCircle, Check, X, BarChart3,
  Upload, Link as LinkIcon, Sparkles, Image as ImageIcon,
  ExternalLink, Eye, EyeOff
} from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  link?: string;
  sortOrder?: number;
  active?: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
  subCategories: Array<{
    id: string;
    name: string;
  }>;
}

export default function CategoriesPage() {
  const { data: session, status } = useAdminSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    link: "",
    sortOrder: 0,
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Sub-category form states
  const [showSubCategoryForm, setShowSubCategoryForm] = useState<string | null>(null);
  const [subCategoryFormData, setSubCategoryFormData] = useState({
    name: "",
    description: "",
  });
  const [submittingSubCategory, setSubmittingSubCategory] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/ueadmin/login");
    } else if (status === "authenticated") {
      fetchCategories();
    }
  }, [status, router]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === "sortOrder") {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else if (name === "name" && !formData.slug) {
      // Auto-generate slug and link if name changes and user hasn't explicitly set custom ones
      const autoSlug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
      setFormData(prev => ({ 
        ...prev, 
        name: value,
        slug: autoSlug,
        link: prev.link ? prev.link : `/products?category=${encodeURIComponent(value)}`
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Upload category image to Cloudinary
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const data = new FormData();
    data.append("file", file);
    data.append("folder", "ecommerce/categories");

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Image upload failed");
      }

      const result = await res.json();
      setFormData(prev => ({ ...prev, image: result.url }));
      toast.success("Category image uploaded!");
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      image: "",
      link: "",
      sortOrder: categories.length + 1,
      active: true,
    });
    setEditingCategory(null);
    setShowForm(false);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      
      const method = editingCategory ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save category");
      }

      const savedCategory = await response.json();
      
      if (editingCategory) {
        setCategories(prev => prev.map(cat => 
          cat.id === savedCategory.id ? savedCategory : cat
        ));
        toast.success("Category updated successfully");
      } else {
        setCategories(prev => [savedCategory, ...prev]);
        toast.success("Category created successfully");
      }
      
      resetForm();
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast.error(error.message || "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit category
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: category.description || "",
      image: category.image || "",
      link: category.link || `/products?category=${encodeURIComponent(category.name)}`,
      sortOrder: category.sortOrder ?? 0,
      active: category.active ?? true,
    });
    setShowForm(true);
  };

  // Toggle active directly
  const handleToggleActive = async (category: Category) => {
    try {
      const newActive = !(category.active ?? true);
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: category.name, active: newActive }),
      });
      if (response.ok) {
        setCategories(prev => prev.map(c => c.id === category.id ? { ...c, active: newActive } : c));
        toast.success(newActive ? "Category activated" : "Category hidden");
      }
    } catch (err) {
      toast.error("Failed to toggle status");
    }
  };

  // Delete category
  const handleDelete = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? This will also delete all associated sub-categories.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete category");
      }

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      toast.success("Category deleted successfully");
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.message || "Failed to delete category");
    }
  };

  // Toggle category expansion
  const toggleExpand = (categoryId: string) => {
    setExpandedCategory(prev => prev === categoryId ? null : categoryId);
  };

  // Handle sub-category input change
  const handleSubCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSubCategoryFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset sub-category form
  const resetSubCategoryForm = () => {
    setSubCategoryFormData({ name: "", description: "" });
    setShowSubCategoryForm(null);
  };

  // Create sub-category
  const handleCreateSubCategory = async (categoryId: string, e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subCategoryFormData.name.trim()) {
      toast.error("Sub-category name is required");
      return;
    }

    setSubmittingSubCategory(true);
    try {
      const response = await fetch("/api/admin/sub-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...subCategoryFormData,
          categoryId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create sub-category");
      }

      const savedSubCategory = await response.json();
      
      setCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subCategories: [...cat.subCategories, savedSubCategory]
          };
        }
        return cat;
      }));
      
      toast.success("Sub-category created successfully");
      resetSubCategoryForm();
    } catch (error: any) {
      console.error("Error creating sub-category:", error);
      toast.error(error.message || "Failed to create sub-category");
    } finally {
      setSubmittingSubCategory(false);
    }
  };

  // Delete sub-category
  const handleDeleteSubCategory = async (categoryId: string, subCategoryId: string) => {
    if (!confirm("Are you sure you want to delete this sub-category?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sub-categories/${subCategoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete sub-category");
      }

      setCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            subCategories: cat.subCategories.filter(sub => sub.id !== subCategoryId)
          };
        }
        return cat;
      }));
      
      toast.success("Sub-category deleted successfully");
    } catch (error: any) {
      console.error("Error deleting sub-category:", error);
      toast.error(error.message || "Failed to delete sub-category");
    }
  };

  // Suggested links generator
  const getLinkSuggestions = () => {
    const nameToUse = formData.name.trim() || "Category";
    const encName = encodeURIComponent(nameToUse);
    return [
      { label: `Filter by Category Name: /products?category=${encName}`, value: `/products?category=${encName}` },
      { label: `Filter by Slug: /products?category=${formData.slug || 'slug'}`, value: `/products?category=${formData.slug || 'slug'}` },
      { label: "Skin Care: /products?category=Skin%20Care", value: "/products?category=Skin%20Care" },
      { label: "Serums: /products?category=Serums", value: "/products?category=Serums" },
      { label: "Moisturizers: /products?category=Moisturizers", value: "/products?category=Moisturizers" },
      { label: "Cleansers: /products?category=Cleansers", value: "/products?category=Cleansers" },
      { label: "Toners: /products?category=Toners", value: "/products?category=Toners" },
      { label: "Eye Care: /products?category=Eye%20Care", value: "/products?category=Eye%20Care" },
      { label: "Sun Care: /products?category=Sun%20Care", value: "/products?category=Sun%20Care" },
      { label: "Beauty Routine Page: /products/routine", value: "/products/routine" },
      { label: "Flash Sales Page: /products/flash-sales", value: "/products/flash-sales" },
      { label: "Offers Page: /offers", value: "/offers" },
    ];
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Layers className="text-[#0c433a]" /> Category Management
          </h1>
          <p className="text-black/50 text-sm mt-1">
            Create, order, and link homepage category icons and storefront sub-categories.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/ueadmin/categories/stats"
            className="flex items-center gap-2 px-5 py-3 glass-panel rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black/5 transition-all"
          >
            <BarChart3 size={16} />
            Analytics
          </Link>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-[#0c433a] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0c433a]/90 shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={18} />
            {showForm ? "Close Form" : "Add New Category"}
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-black/10 shadow-xl bg-white/95 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-black/5">
            <h2 className="text-xl font-black text-[#0c433a] flex items-center gap-2">
              <Sparkles size={20} className="text-[#72ccbd]" />
              {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create Homepage & Shop Category"}
            </h2>
            <button onClick={resetForm} className="p-2 text-black/40 hover:text-black rounded-xl">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Category Name & Slug */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-black/70 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3.5 rounded-2xl border border-black/15 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#0c433a]/30"
                    placeholder="e.g., SERUMS, MOISTURIZERS, CLEANSERS"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-black/70 mb-2">
                    Category ID / Slug (Product Category Match)
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 rounded-2xl border border-black/15 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0c433a]/30"
                    placeholder="e.g. serums, cleansers"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-black/70 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-5 py-3 rounded-2xl border border-black/15 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0c433a]/30"
                    placeholder="Brief description of this category for SEO..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-black/70 mb-2">
                      Sort Order (Position)
                    </label>
                    <input
                      type="number"
                      name="sortOrder"
                      value={formData.sortOrder}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-2xl border border-black/15 bg-white font-bold focus:outline-none focus:ring-2 focus:ring-[#0c433a]/30"
                      min={0}
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="active"
                        checked={formData.active}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0c433a]"></div>
                    </label>
                    <span className="text-xs font-black uppercase tracking-wider text-black/80">
                      {formData.active ? "Active on Homepage" : "Hidden"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Image & Target Link Suggestions */}
              <div className="space-y-4">
                
                {/* Category Image Picker */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-black/70 mb-2">
                    Category Icon / Image
                  </label>

                  <div className="flex items-center gap-4 mb-3">
                    {/* Circle Thumbnail Preview */}
                    <div className="relative w-20 h-20 rounded-full bg-emerald-50 border-2 border-[#72ccbd] flex items-center justify-center overflow-hidden shadow-inner shrink-0">
                      {formData.image ? (
                        <Image
                          src={formData.image}
                          alt="Category preview"
                          fill
                          className="object-contain p-1.5"
                        />
                      ) : (
                        <ImageIcon size={28} className="text-[#0c433a]/30" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black/5 hover:bg-black/10 border border-black/10 rounded-2xl cursor-pointer font-bold text-xs uppercase tracking-wider text-black transition-all">
                        <Upload size={14} />
                        {uploadingImage ? "Uploading..." : "Upload New Image"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        name="image"
                        value={formData.image}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 text-xs rounded-xl border border-black/15 bg-white focus:outline-none focus:ring-1 focus:ring-[#0c433a]"
                        placeholder="Or paste image URL (e.g. /images/serum.png)"
                      />
                    </div>
                  </div>
                </div>

                {/* Target Page Link & Auto Suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-widest text-black/70 flex items-center gap-1.5">
                      <LinkIcon size={14} className="text-[#0c433a]" />
                      Target Page Link / Route *
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Click suggestions below
                    </span>
                  </div>

                  <input
                    type="text"
                    name="link"
                    value={formData.link}
                    onChange={handleInputChange}
                    className="w-full px-5 py-3 rounded-2xl border border-black/15 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#0c433a]/30"
                    placeholder="/products?category=Skin%20Care"
                  />

                  {/* Suggestion Chips */}
                  <div className="mt-3 bg-black/[0.02] p-3 rounded-2xl border border-black/5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-black/50 block mb-2">
                      💡 Suggested Page Links & Category IDs:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {getLinkSuggestions().map((sugg, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, link: sugg.value }))}
                          className="text-[11px] font-medium px-2.5 py-1 bg-white hover:bg-[#0c433a] hover:text-white border border-black/10 rounded-xl transition-all flex items-center gap-1 text-black/80 shadow-2xs"
                        >
                          <span>{sugg.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/5">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-black/15 text-black/70 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="px-8 py-3 bg-[#0c433a] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0c433a]/90 transition-all disabled:opacity-50 shadow-md"
              >
                {submitting ? "Saving..." : editingCategory ? "Update Category" : "Save & Publish Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-black">
            Store & Homepage Categories ({categories.length})
          </h2>
          <span className="text-xs font-medium text-black/50">
            Click on a category to expand sub-categories
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-black/5 text-center">
            <Layers className="w-12 h-12 mx-auto text-black/20 mb-4" />
            <h3 className="text-lg font-black mb-2">No categories yet</h3>
            <p className="text-black/40 mb-6">Create your first category to power the storefront slider!</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-[#0c433a] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0c433a]/90 transition-all"
            >
              Create Category
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`glass-panel rounded-3xl border transition-all overflow-hidden bg-white/80 ${
                  category.active === false ? "opacity-60 border-black/5" : "border-black/10 hover:border-[#0c433a]/30 shadow-xs hover:shadow-md"
                }`}
              >
                {/* Category Item Header */}
                <div 
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-black/[0.01]"
                  onClick={() => toggleExpand(category.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Circle Image Thumbnail */}
                    <div className="relative w-14 h-14 rounded-full bg-emerald-50/80 border-2 border-[#72ccbd]/40 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {category.image ? (
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-contain p-1"
                        />
                      ) : (
                        <Layers size={22} className="text-[#0c433a]/50" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-base sm:text-lg text-black tracking-tight">{category.name}</h3>
                        {category.active === false ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 flex items-center gap-1">
                            <EyeOff size={11} /> Hidden
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Eye size={11} /> Active
                          </span>
                        )}
                        {category.sortOrder !== undefined && (
                          <span className="text-[10px] font-mono bg-black/5 text-black/60 px-2 py-0.5 rounded-md">
                            Pos: #{category.sortOrder}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-black/50">
                        {category.link && (
                          <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                            <ExternalLink size={10} /> {category.link}
                          </span>
                        )}
                        <span>{category._count?.products ?? 0} Products</span>
                        <span>{category.subCategories?.length ?? 0} Sub-categories</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleActive(category)}
                      className="p-2.5 rounded-xl hover:bg-black/5 transition-all text-black/60"
                      title={category.active === false ? "Show on Homepage" : "Hide from Homepage"}
                    >
                      {category.active === false ? <EyeOff size={18} /> : <Eye size={18} className="text-emerald-600" />}
                    </button>
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2.5 rounded-xl hover:bg-black/5 transition-all text-black/60 hover:text-black"
                      title="Edit Category"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2.5 rounded-xl hover:bg-red-500/10 transition-all text-red-500/60 hover:text-red-600"
                      title="Delete Category"
                      disabled={(category._count?.products ?? 0) > 0}
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => toggleExpand(category.id)}
                      className="p-2 text-black/40 hover:text-black"
                    >
                      {expandedCategory === category.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Content (Sub-categories) */}
                {expandedCategory === category.id && (
                  <div className="border-t border-black/5 p-6 bg-black/[0.015]">
                    {category.description && (
                      <div className="mb-4">
                        <h4 className="font-black text-xs uppercase tracking-widest text-black/50 mb-1">Description</h4>
                        <p className="text-sm text-black/70">{category.description}</p>
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-xs uppercase tracking-widest text-black/70">
                          Sub-categories under {category.name}
                        </h4>
                        <button
                          onClick={() => setShowSubCategoryForm(showSubCategoryForm === category.id ? null : category.id)}
                          className="text-xs font-black text-[#0c433a] hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Sub-category
                        </button>
                      </div>
                      
                      {/* Sub-category form */}
                      {showSubCategoryForm === category.id && (
                        <div className="mb-4 p-4 rounded-2xl bg-white border border-black/10 shadow-xs">
                          <h5 className="font-black text-xs uppercase tracking-widest mb-3">Add Sub-category</h5>
                          <form onSubmit={(e) => handleCreateSubCategory(category.id, e)} className="space-y-3">
                            <input
                              type="text"
                              name="name"
                              value={subCategoryFormData.name}
                              onChange={handleSubCategoryInputChange}
                              className="w-full px-4 py-2.5 rounded-xl border border-black/15 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#0c433a]"
                              placeholder="e.g. Cleansing Oil, Hydrating Toner"
                              required
                            />
                            <textarea
                              name="description"
                              value={subCategoryFormData.description}
                              onChange={handleSubCategoryInputChange}
                              rows={2}
                              className="w-full px-4 py-2 rounded-xl border border-black/15 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#0c433a]"
                              placeholder="Optional description..."
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={submittingSubCategory}
                                className="px-4 py-2 bg-[#0c433a] text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#0c433a]/90 transition-all"
                              >
                                {submittingSubCategory ? "Saving..." : "Add Sub-category"}
                              </button>
                              <button
                                type="button"
                                onClick={resetSubCategoryForm}
                                className="px-4 py-2 border border-black/10 text-black/60 rounded-xl font-black text-xs uppercase tracking-wider"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                      
                      {(!category.subCategories || category.subCategories.length === 0) ? (
                        <div className="text-center py-6 text-xs text-black/40 italic bg-white/50 rounded-2xl border border-black/5">
                          No sub-categories created yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {category.subCategories.map((subCat) => (
                            <div
                              key={subCat.id}
                              className="p-3.5 rounded-2xl bg-white border border-black/10 hover:border-black/20 transition-all flex items-center justify-between group shadow-2xs"
                            >
                              <div className="flex items-center gap-2.5">
                                <Package size={14} className="text-[#0c433a]" />
                                <span className="font-semibold text-xs text-black">{subCat.name}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteSubCategory(category.id, subCat.id)}
                                className="p-1 rounded-lg hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete sub-category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}