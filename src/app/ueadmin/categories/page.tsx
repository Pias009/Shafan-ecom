"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Plus, Edit, Trash2, ChevronDown, ChevronUp, 
  Layers, Package, AlertCircle, Check, X 
} from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  description?: string;
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({ name: "", description: "" });
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
      description: category.description || "",
    });
    setShowForm(true);
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
      
      // Update the categories list with the new sub-category
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

      // Update the categories list by removing the sub-category
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
          <h1 className="text-3xl font-black tracking-tight">Category Management</h1>
          <p className="text-black/40 text-sm mt-2">
            Create and manage product categories. Each category can have multiple sub-categories.
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
          {showForm ? "Cancel" : "New Category"}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="glass-panel p-8 rounded-3xl border border-black/5">
          <h2 className="text-xl font-black mb-6">
            {editingCategory ? "Edit Category" : "Create New Category"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-black uppercase tracking-widest mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 rounded-2xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="e.g., Skin Care, Hair Care"
                  required
                />
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
                  placeholder="Brief description of this category..."
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
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

      {/* Categories List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black">All Categories ({categories.length})</h2>
          <div className="text-sm text-black/40">
            Click on a category to view sub-categories
          </div>
        </div>

        {categories.length === 0 ? (
          <div className="glass-panel p-12 rounded-3xl border border-black/5 text-center">
            <Layers className="w-12 h-12 mx-auto text-black/20 mb-4" />
            <h3 className="text-lg font-black mb-2">No categories yet</h3>
            <p className="text-black/40 mb-6">Create your first category to get started</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-black text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all"
            >
              Create Category
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="glass-panel rounded-3xl border border-black/5 overflow-hidden"
              >
                {/* Category Header */}
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-black/2 transition-all"
                  onClick={() => toggleExpand(category.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-black/5 flex items-center justify-center">
                      <Layers size={20} className="text-black/60" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg">{category.name}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-black/40">
                          {category._count.products} products
                        </span>
                        <span className="text-sm text-black/40">
                          {category.subCategories.length} sub-categories
                        </span>
                        <span className="text-xs text-black/30">
                          Created: {new Date(category.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(category);
                      }}
                      className="p-2 rounded-xl hover:bg-black/5 transition-all"
                      title="Edit category"
                    >
                      <Edit size={18} className="text-black/60" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(category.id);
                      }}
                      className="p-2 rounded-xl hover:bg-red-500/10 transition-all"
                      title="Delete category"
                      disabled={category._count.products > 0}
                    >
                      <Trash2 
                        size={18} 
                        className={category._count.products > 0 ? "text-black/20" : "text-red-500/60"} 
                      />
                    </button>
                    {expandedCategory === category.id ? (
                      <ChevronUp size={20} className="text-black/40" />
                    ) : (
                      <ChevronDown size={20} className="text-black/40" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedCategory === category.id && (
                  <div className="border-t border-black/5 p-6 bg-black/[0.02]">
                    <div className="mb-6">
                      <h4 className="font-black text-sm uppercase tracking-widest mb-4">Description</h4>
                      <p className="text-black/60">
                        {category.description || "No description provided."}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-sm uppercase tracking-widest">Sub-categories</h4>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => router.push(`/ueadmin/sub-categories?categoryId=${category.id}`)}
                            className="text-sm font-black text-black/60 hover:text-black transition-all"
                          >
                            Manage all →
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowSubCategoryForm(showSubCategoryForm === category.id ? null : category.id);
                            }}
                            className="text-sm font-black text-black/60 hover:text-black transition-all flex items-center gap-1"
                          >
                            <Plus size={14} /> Add New
                          </button>
                        </div>
                      </div>
                      
                      {/* Sub-category creation form */}
                      {showSubCategoryForm === category.id && (
                        <div className="mb-6 p-4 rounded-2xl bg-white border border-black/10">
                          <h5 className="font-black text-sm uppercase tracking-widest mb-3">Create New Sub-category</h5>
                          <form onSubmit={(e) => handleCreateSubCategory(category.id, e)} className="space-y-4">
                            <div>
                              <label className="block text-xs font-black uppercase tracking-widest mb-1">
                                Sub-category Name *
                              </label>
                              <input
                                type="text"
                                name="name"
                                value={subCategoryFormData.name}
                                onChange={handleSubCategoryInputChange}
                                className="w-full px-4 py-2 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-1 focus:ring-black/20"
                                placeholder="e.g., Face Cream, Shampoo"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-black uppercase tracking-widest mb-1">
                                Description (Optional)
                              </label>
                              <textarea
                                name="description"
                                value={subCategoryFormData.description}
                                onChange={handleSubCategoryInputChange}
                                className="w-full px-4 py-2 rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-1 focus:ring-black/20 min-h-[60px]"
                                placeholder="Brief description of this sub-category..."
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={submittingSubCategory}
                                className="px-4 py-2 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black/90 transition-all disabled:opacity-50"
                              >
                                {submittingSubCategory ? "Creating..." : "Create Sub-category"}
                              </button>
                              <button
                                type="button"
                                onClick={resetSubCategoryForm}
                                className="px-4 py-2 border border-black/10 text-black/60 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black/5 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                      
                      {category.subCategories.length === 0 ? (
                        <div className="text-center py-8 text-black/40">
                          No sub-categories yet. Create sub-categories to organize products further.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {category.subCategories.map((subCat) => (
                            <div
                              key={subCat.id}
                              className="p-4 rounded-2xl bg-white border border-black/5 hover:border-black/10 transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-black/5 flex items-center justify-center">
                                    <Package size={14} className="text-black/60" />
                                  </div>
                                  <span className="font-medium">{subCat.name}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSubCategory(category.id, subCat.id);
                                  }}
                                  className="p-1 rounded-lg hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                  title="Delete sub-category"
                                >
                                  <Trash2 size={14} className="text-red-500/60" />
                                </button>
                              </div>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">{categories.length}</div>
          <div className="text-sm text-black/40 mt-2">Total Categories</div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">
            {categories.reduce((sum, cat) => sum + cat.subCategories.length, 0)}
          </div>
          <div className="text-sm text-black/40 mt-2">Total Sub-categories</div>
        </div>
        <div className="glass-panel p-6 rounded-3xl border border-black/5">
          <div className="text-3xl font-black">
            {categories.reduce((sum, cat) => sum + cat._count.products, 0)}
          </div>
          <div className="text-sm text-black/40 mt-2">Total Products</div>
        </div>
      </div>
    </div>
  );
}