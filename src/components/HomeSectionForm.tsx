"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X, Search, Plus, Loader2, ArrowUp, ArrowDown, Package, ArrowRight } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  mainImage?: string | null;
  images?: string[];
  productCategories?: { categoryId: string }[];
}

interface Category {
  id: string;
  name: string;
}

interface HomeSectionFormData {
  title: string;
  badge: string;
  categoryId: string;
  productIds: string[];
  sortOrder: number;
  active: boolean;
}

interface HomeSectionFormProps {
  initialData?: Partial<HomeSectionFormData> & { id?: string };
  isEditing?: boolean;
}

const BADGE_PRESETS = ["NEW", "HOT", "TOP", "SALE"];

function Thumb({ product, size = 36 }: { product: Product; size?: number }) {
  const src = product.mainImage || product.images?.[0];
  return (
    <div
      className="rounded-md bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={product.name} className="w-full h-full object-cover" />
      ) : (
        <Package size={16} className="text-gray-300" />
      )}
    </div>
  );
}

export function HomeSectionForm({ initialData, isEditing = false }: HomeSectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");

  const [form, setForm] = useState<HomeSectionFormData>({
    title: initialData?.title || "",
    badge: initialData?.badge || "",
    categoryId: initialData?.categoryId || "",
    productIds: initialData?.productIds || [],
    sortOrder: initialData?.sortOrder ?? 0,
    active: initialData?.active ?? true,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoadingProducts(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/admin/products?select=picker"),
          fetch("/api/admin/categories"),
        ]);
        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
        setCategories(Array.isArray(categoriesData) ? categoriesData.map((c: any) => ({ id: c.id, name: c.name })) : []);
      } catch (error) {
        console.error("Error fetching products/categories:", error);
        toast.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = <K extends keyof HomeSectionFormData>(field: K, value: HomeSectionFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddProduct = (productId: string) => {
    if (form.productIds.includes(productId)) return;
    setForm((prev) => ({ ...prev, productIds: [...prev.productIds, productId] }));
  };

  const handleRemoveProduct = (productId: string) => {
    setForm((prev) => ({ ...prev, productIds: prev.productIds.filter((id) => id !== productId) }));
  };

  const moveProduct = (index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const next = [...prev.productIds];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, productIds: next };
    });
  };

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Products come newest-first from the API, so a category's list starts with its latest arrivals.
  const availableProducts = useMemo(() => {
    const query = searchProduct.trim().toLowerCase();
    return products.filter(
      (p) =>
        !form.productIds.includes(p.id) &&
        (!form.categoryId || p.productCategories?.some((pc) => pc.categoryId === form.categoryId)) &&
        (!query || p.name.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query))
    );
  }, [products, searchProduct, form.productIds, form.categoryId]);

  const handleAddAllShown = () => {
    setForm((prev) => ({ ...prev, productIds: [...prev.productIds, ...availableProducts.map((p) => p.id)] }));
  };

  // Keep admin-chosen order; products that are no longer active drop out of the lookup.
  const selectedProducts = form.productIds
    .map((id) => productById.get(id))
    .filter((p): p is Product => Boolean(p));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Section heading is required");
      return;
    }
    if (form.productIds.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/admin/home-sections/${initialData?.id}` : "/api/admin/home-sections";
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save home section");
      }

      toast.success(isEditing ? "Home section updated successfully" : "Home section added to the homepage");
      router.push("/ueadmin/home-sections");
    } catch (error) {
      console.error("Error saving home section:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save home section");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section Head */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Section Head</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Section Heading *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., New Arrivals"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Badge</label>
            <input
              type="text"
              value={form.badge}
              maxLength={12}
              onChange={(e) => handleInputChange("badge", e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., NEW"
            />
            <div className="flex gap-1.5 mt-2">
              {BADGE_PRESETS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => handleInputChange("badge", form.badge === b ? "" : b)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    form.badge === b ? "bg-[#890754] text-white border-[#890754]" : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => handleInputChange("categoryId", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Filters the product list below and sets where &quot;See All&quot; links to</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => handleInputChange("sortOrder", parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">Lower numbers show first on the homepage</p>
          </div>
        </div>

        {/* Live preview of the homepage header bar */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2">Preview</label>
          <div className="rounded-2xl bg-gradient-to-r from-[#3e0325] via-[#540434] to-[#3e0325] px-5 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-sans text-base md:text-xl font-black tracking-tight text-white uppercase truncate">
                {form.title || "Section Heading"}
              </span>
              {form.badge && (
                <span className="inline-flex items-center bg-[#890754] border border-pink-400/40 text-white text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                  {form.badge}
                </span>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 text-white text-xs font-bold uppercase tracking-wider shrink-0">
              See All <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>

        {/* Selected Products (ordered) */}
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <label className="text-sm font-semibold text-blue-800">
              Selected Products ({selectedProducts.length}) — shown in this order
            </label>
            <div className="space-y-1.5">
              {selectedProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-white border border-blue-100 rounded-lg px-3 py-2 flex items-center gap-3"
                >
                  <span className="text-xs font-semibold text-blue-700 w-5 text-center">{index + 1}</span>
                  <Thumb product={product} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    {product.sku && <p className="text-[10px] text-gray-400 truncate">SKU: {product.sku}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveProduct(index, -1)}
                      disabled={index === 0}
                      className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveProduct(index, 1)}
                      disabled={index === selectedProducts.length - 1}
                      className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      title="Remove"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {loadingProducts && <Loader2 size={20} className="animate-spin text-gray-400" />}
          {!loadingProducts && availableProducts.length > 0 && availableProducts.length <= 30 && (
            <button
              type="button"
              onClick={handleAddAllShown}
              className="px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 whitespace-nowrap"
            >
              Add all {availableProducts.length}
            </button>
          )}
        </div>

        {/* Product List */}
        <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
          {loadingProducts ? (
            <div className="p-8 text-center">
              <Loader2 size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Loading products...</p>
            </div>
          ) : availableProducts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">
                {searchProduct ? `No products match "${searchProduct}"` : "No products available"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-2">
              {availableProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleAddProduct(product.id)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all bg-white hover:bg-gray-50 border border-gray-200"
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 bg-gray-100 text-gray-500">
                    <Plus size={14} />
                  </div>
                  <Thumb product={product} size={32} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    {product.sku && <p className="text-[10px] text-gray-400 truncate">SKU: {product.sku}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {!loadingProducts && products.length > 0 && (
          <p className="text-xs text-gray-500 text-center">
            Showing {availableProducts.length} products, newest first
            {searchProduct && ` matching "${searchProduct}"`}
          </p>
        )}
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Status</h2>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => handleInputChange("active", e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show this section on the homepage</span>
        </label>
      </div>

      {/* Submit */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : isEditing ? "Update Section" : "Add to Homepage"}
        </button>
      </div>
    </form>
  );
}
