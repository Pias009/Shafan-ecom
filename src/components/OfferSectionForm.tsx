"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X, Search, Plus, Loader2, ArrowUp, ArrowDown, Package } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  images?: string[];
}

interface OfferSectionFormData {
  title: string;
  subtitle: string;
  productIds: string[];
  sortOrder: number;
  active: boolean;
}

interface OfferSectionFormProps {
  initialData?: Partial<OfferSectionFormData> & { id?: string };
  isEditing?: boolean;
}

function Thumb({ product, size = 36 }: { product: Product; size?: number }) {
  const src = product.images?.[0];
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

export function OfferSectionForm({ initialData, isEditing = false }: OfferSectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");

  const [form, setForm] = useState<OfferSectionFormData>({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    productIds: initialData?.productIds || [],
    sortOrder: initialData?.sortOrder ?? 0,
    active: initialData?.active ?? true,
  });

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/admin/products?select=name,id,sku,price,images,weight,weightUnit");
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleInputChange = <K extends keyof OfferSectionFormData>(field: K, value: OfferSectionFormData[K]) => {
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

  const availableProducts = useMemo(() => {
    const query = searchProduct.trim().toLowerCase();
    return products.filter(
      (p) =>
        !form.productIds.includes(p.id) &&
        (!query || p.name.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query))
    );
  }, [products, searchProduct, form.productIds]);

  // Keep admin-chosen order; products that are no longer active drop out of the lookup.
  const selectedProducts = form.productIds
    .map((id) => productById.get(id))
    .filter((p): p is Product => Boolean(p));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      toast.error("Section title is required");
      return;
    }
    if (form.productIds.length === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/admin/offer-sections/${initialData?.id}` : "/api/admin/offer-sections";
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to save offer section");
      }

      toast.success(isEditing ? "Offer section updated successfully" : "Offer section created successfully");
      router.push("/ueadmin/offer-sections");
    } catch (error) {
      console.error("Error saving offer section:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save offer section");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Section Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Buy 1 Get 1 Free"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={(e) => handleInputChange("subtitle", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Limited time bundle deals"
            />
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
            <p className="text-xs text-gray-500 mt-1">Lower numbers show first on the Offers page</p>
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
            Showing {availableProducts.length} of {products.length} products
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
          <span className="text-sm text-gray-700">Show this section on the Offers page</span>
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
          {loading ? "Saving..." : isEditing ? "Update Section" : "Create Section"}
        </button>
      </div>
    </form>
  );
}
