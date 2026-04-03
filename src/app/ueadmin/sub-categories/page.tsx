"use client";

import { useState, useEffect } from "react";
import { useAdminSession } from "../_components/useAdminSession";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Plus, Edit, Trash2, Filter, X, GitBranch, 
  Package, Layers, AlertCircle, Check 
} from "lucide-react";
import toast from "react-hot-toast";

interface SubCategory {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
  category: {
    id: string;
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

export default function SubCategoriesPage() {
  const { data: session, status } = useAdminSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams?.get("categoryId") || ""
  );

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data);
      
      // If categoryId is in URL but not in form, set it
      if (searchParams?.get("categoryId") && !formData.categoryId) {
        setFormData(prev => ({ ...prev, categoryId: searchParams?.get("categoryId") || "" }));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  // Fetch sub-categories
  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const url = selectedCategory 
        ? `/api/admin/sub-categories?categoryId=${selectedCategory}`
        : "/api/admin/sub-categories";
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch sub-categories");
      }
      const data = await response.json();
      setSubCategories(data);
    } catch (error) {
      console.error("Error fetching sub-categories:", error);
      toast.error("Failed to load sub-categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/ueadmin/login");
    } else if (status === "authenticated") {
      fetchCategories();
      fetchSubCategories();
    }
  }, [status, router, selectedCategory]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      categoryId: searchParams?.get("categoryId") || ""
    });
    setEditingSubCategory(null);
    setShowForm(false);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.categoryId) {
      toast.error("Sub-category name and parent category are required");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingSubCategory 
        ? `/api/admin/sub-categories/${editingSubCategory.id}`
        : "/api/admin/sub-categories";
      
      const method = editingSubCategory ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save sub-category");
      }

      const savedSubCategory = await response.json();
      
      if (editingSubCategory) {
        setSubCategories(prev => prev.map(sub => 
          sub.id === savedSubCategory.id ? savedSubCategory : sub
        ));
        toast.success("Sub-category updated successfully");
      } else {
        setSubCategories(prev => [savedSubCategory, ...prev]);
        toast.success("Sub-category created successfully");
      }
      
      resetForm();
    } catch (error: any) {
      console.error("Error saving sub-category:", error);
      toast.error(error.message || "Failed to save sub-category");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit sub-category
  const handleEdit = (subCategory: SubCategory) => {
    setEditingSubCategory(subCategory);
    setFormData({
      name: subCategory.name,
      description: subCategory.description || "",
      categoryId: subCategory.categoryId,
    });
    setShowForm(true);
  };

  // Delete sub-category
  const handleDelete = async (subCategoryId: string) => {
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

      setSubCategories(prev => prev.filter(sub => sub.id !== subCategoryId));
      toast.success("Sub-category deleted successfully");
    } catch (error: any) {
      console.error("Error deleting sub-category:", error);
      toast.error(error.message || "Failed to delete sub-category");
    }
  };

  // Clear filter
  const clearFilter = () => {
    setSelectedCategory("");
    router.push("/ueadmin/sub-categories");
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
          <h1 className="text-3xl font-black tracking-tight">Sub-category Management</h1>
          <p className="text-black/40 text-sm mt-2">
            Create and manage product sub-categories. Each sub-category belongs to a parent category.
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
          {showForm ? "Cancel" : "New Sub-category"}
        </button>
      </div>

      {/* Filter */}
      <div className="glass-panel p-6 rounded-3xl border border-black/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <Filter size={16} /> Filter by Category
          </h3>
          {selectedCategory && (
            <button
              onClick={clearFilter}
              className="text-sm font-black text-black/60 hover:text-black transition-all flex items-center gap-1"
            >
              <X size={14} /> Clear filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              !selectedCategory 
                ? "bg-black text-white" 
                : "bg-black/5 text-black/60 hover:bg-black/10"
            }`}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                selectedCategory === category.id
                  ? "bg-black text-white" 
                  : "bg-black/5 text-black/60 hover:bg-black/10"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="glass-panel p-8 rounded-3xl border border-black/5">
          <h2 className="text-xl font-black mb-6">
            {editingSubCategory ? "Edit Sub-category" : "Create New Sub-category"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  Sub-category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="e.g., Cleanser, Face Serum, Hair Oil"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  Parent Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
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
                  placeholder="Brief description of this sub-category..."
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingSubCategory ? "Update Sub-category" : "Create Sub-category"}
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

      {/* Sub-categories List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">
            {selectedCategory 
              ? `Sub-categories in "${categories.find(c => c.id === selectedCategory)?.name || 'Selected Category'}"`
              : "All Sub-categories"
            } ({subCategories.length})
          </h2>
          <div className="text-sm text-black/40">
            {selectedCategory ? "Filtered by category" : "Showing all sub-categories"}
          </div>
        </div>

        {subCategories.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-black/5 text-center">
            <GitBranch className="w-12 h-12 mx-auto text-black/20 mb-4" />
            <h3 className="text-lg font-black mb-2">No sub-categories yet</h3>
            <p className="text-black/40 mb-6">
              {selectedCategory 
                ? `No sub-categories found in this category. Create the first one!`
                : "Create your first sub-category to get started"
              }
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all"
            >
              Create Sub-category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subCategories.map((subCategory) => (
              <div
                key={subCategory.id}
                className="glass-panel p-6 rounded-3xl border border-black/5 hover:border-black/10 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
                      <GitBranch size={18} className="text-black/60" />
                    </div>
                    <div>
                      <h3 className="font-black">{subCategory.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="px-2 py-1 bg-black/5 rounded-lg text-xs font-medium">
                          {subCategory.category.name}
                        </div>
                        <div className="text-xs text-black/40">
                          {subCategory._count.products} products
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(subCategory)}
                      className="p-2 rounded-xl hover:bg-black/5 transition-all"
                      title="Edit sub-category"
                    >
                      <Edit size={16} className="text-black/60" />
                    </button>
                    <button
                      onClick={() => handleDelete(subCategory.id)}
                      className="p-2 rounded-xl hover:bg-red-500/10 transition-all"
                      title="Delete sub-category"
                      disabled={subCategory._count.products > 0}
                    >
                      <Trash2 
                        size={16} 
                        className={subCategory._count.products > 0 ? "text-black/20" : "text-red-500/60"} 
                      />
                    </button>
                  </div>
                </div>
                
                {subCategory.description && (
                  <p className="text-sm text-black/60 mb-4 line-clamp-2">
                    {subCategory.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-black/40">
                  <span>
                    Created: {new Date(subCategory.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => router.push(`/ueadmin/categories?expand=${subCategory.categoryId}`)}
                    className="hover:text-black transition-all"
                  >
                    View category →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">{subCategories.length}</div>
          <div className="text-sm text-black/40 mt-2">
            {selectedCategory ? "Filtered Sub-categories" : "Total Sub-categories"}
          </div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">
            {subCategories.reduce((sum, sub) => sum + sub._count.products, 0)}
          </div>
          <div className="text-sm text-black/40 mt-2">Total Products</div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">
            {new Set(subCategories.map(sub => sub.categoryId)).size}
          </div>
          <div className="text-sm text-black/40 mt-2">Categories Covered</div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">
            {categories.length}
          </div>
          <div className="text-sm text-black/40 mt-2">Available Categories</div>
        </div>
      </div>
    </div>
  );
}