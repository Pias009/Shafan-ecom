"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X, Search, Plus, Loader2, ArrowUp, ArrowDown, Package, Check } from "lucide-react";
import { EMPTY_POPUP, PopupBannerFields, popupBannerError, type PopupBannerValue } from "@/components/admin/PopupBannerFields";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  images?: string[];
  brandId?: string | null;
}

interface Brand {
  id: string;
  name: string;
}

export interface SectionCouponForm {
  enabled: boolean;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  value: string;
  maxLimitAmount: string;
  minimumOrderValue: string;
  endDate: string;
}

const EMPTY_COUPON: SectionCouponForm = {
  enabled: false,
  code: "",
  discountType: "PERCENTAGE",
  value: "",
  maxLimitAmount: "",
  minimumOrderValue: "",
  endDate: "",
};

interface OfferSectionFormData extends PopupBannerValue {
  title: string;
  subtitle: string;
  productIds: string[];
  sortOrder: number;
  active: boolean;
  coupon: SectionCouponForm;
}

interface OfferSectionFormProps {
  initialData?: Partial<OfferSectionFormData> & { id?: string; couponUses?: number };
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("");

  const [form, setForm] = useState<OfferSectionFormData>({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    productIds: initialData?.productIds || [],
    sortOrder: initialData?.sortOrder ?? 0,
    active: initialData?.active ?? true,
    coupon: { ...EMPTY_COUPON, ...initialData?.coupon },
    popupEnabled: initialData?.popupEnabled ?? EMPTY_POPUP.popupEnabled,
    popupImage: initialData?.popupImage ?? EMPTY_POPUP.popupImage,
    popupAction: initialData?.popupAction ?? EMPTY_POPUP.popupAction,
    popupLink: initialData?.popupLink ?? EMPTY_POPUP.popupLink,
  });

  const setCoupon = (patch: Partial<SectionCouponForm>) =>
    setForm((prev) => ({ ...prev, coupon: { ...prev.coupon, ...patch } }));

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
    fetch("/api/admin/brands")
      .then((res) => res.json())
      .then((data) => setBrands(Array.isArray(data) ? data.map((b: any) => ({ id: b.id, name: b.name })) : []))
      .catch(() => {});
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

  // Brands that have active products, for "Add by brand".
  const brandProducts = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      if (!p.brandId) continue;
      map.set(p.brandId, [...(map.get(p.brandId) || []), p]);
    }
    return map;
  }, [products]);
  const brandOptions = brands.filter((b) => brandProducts.has(b.id));
  const currentBrandProducts = brandId ? brandProducts.get(brandId) || [] : [];
  const currentBrandInSection = currentBrandProducts.filter((p) => form.productIds.includes(p.id)).length;

  const toggleSectionProduct = (productId: string) =>
    form.productIds.includes(productId) ? handleRemoveProduct(productId) : handleAddProduct(productId);

  const addAllBrandProducts = () =>
    setForm((prev) => ({
      ...prev,
      productIds: [...prev.productIds, ...currentBrandProducts.map((p) => p.id).filter((id) => !prev.productIds.includes(id))],
    }));

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
    if (form.coupon.enabled) {
      if (!form.coupon.code.trim()) {
        toast.error("Enter the coupon code");
        return;
      }
      if (!(Number(form.coupon.value) > 0)) {
        toast.error("Enter the coupon discount value");
        return;
      }
    }
    const popupError = popupBannerError(form, form.coupon.enabled && !!form.coupon.code.trim());
    if (popupError) {
      toast.error(popupError);
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

        {/* Add by brand */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50/60">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <span className="text-sm font-medium text-gray-700 shrink-0">Add products by brand</span>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a brand…</option>
              {brandOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({brandProducts.get(b.id)?.length || 0})
                </option>
              ))}
            </select>
          </div>

          {brandId && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {currentBrandInSection} of {currentBrandProducts.length} in this section — tick the ones you want
                </span>
                <button
                  type="button"
                  onClick={addAllBrandProducts}
                  disabled={currentBrandInSection === currentBrandProducts.length}
                  className="text-xs font-medium text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
                >
                  Add all {currentBrandProducts.length - currentBrandInSection > 0 ? `(${currentBrandProducts.length - currentBrandInSection})` : ""}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1 max-h-72 overflow-y-auto">
                {currentBrandProducts.map((product) => {
                  const inSection = form.productIds.includes(product.id);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => toggleSectionProduct(product.id)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all border ${
                        inSection ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                          inSection ? "bg-white/20" : "bg-gray-100"
                        }`}
                      >
                        {inSection && <Check size={14} />}
                      </div>
                      <Thumb product={product} size={28} />
                      <span className="text-sm font-medium truncate">{product.name}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

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

      {/* Coupon code for this section */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Coupon Code</h2>
          <p className="text-sm text-gray-500">
            A code that discounts only the products in this section — other items in the cart are charged full price.
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.coupon.enabled}
            onChange={(e) => setCoupon({ enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Create a coupon code for these products</span>
        </label>

        {form.coupon.enabled && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
                <input
                  type="text"
                  value={form.coupon.code}
                  onChange={(e) => setCoupon({ code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                  placeholder="e.g. UAE55"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discount type</label>
                <select
                  value={form.coupon.discountType}
                  onChange={(e) => setCoupon({ discountType: e.target.value as SectionCouponForm["discountType"] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {form.coupon.discountType === "PERCENTAGE" ? "Percent off *" : "Amount off *"}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.coupon.value}
                  onChange={(e) => setCoupon({ value: e.target.value })}
                  placeholder={form.coupon.discountType === "PERCENTAGE" ? "55" : "20"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max discount (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.coupon.maxLimitAmount}
                  onChange={(e) => setCoupon({ maxLimitAmount: e.target.value })}
                  placeholder="No cap"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum order (optional)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.coupon.minimumOrderValue}
                  onChange={(e) => setCoupon({ minimumOrderValue: e.target.value })}
                  placeholder="None"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ends (optional)</label>
                <input
                  type="datetime-local"
                  value={form.coupon.endDate}
                  onChange={(e) => setCoupon({ endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Works in all 6 countries and appears under Discounts &amp; coupons. Adding or removing products here updates which
              products the code covers.{initialData?.couponUses ? ` Used ${initialData.couponUses} time(s) so far.` : ""}
            </p>
          </div>
        )}
      </div>

      {/* Popup banner */}
      <PopupBannerFields
        value={{
          popupEnabled: form.popupEnabled,
          popupImage: form.popupImage,
          popupAction: form.popupAction,
          popupLink: form.popupLink,
        }}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        couponCode={form.coupon.enabled ? form.coupon.code : ""}
      />

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
