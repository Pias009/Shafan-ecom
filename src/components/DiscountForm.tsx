"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X, Plus, Search, Check, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku?: string | null;
}

interface DiscountFormData {
  code: string;
  name: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
  maxLimitAmount?: number;
  countryMaxLimits: Record<string, number>;
  applyToAll: boolean;
  productIds: string[];
  categoryIds: string[];
  countries: string[];
  minimumOrderValue?: number;
  startDate: string;
  endDate: string;
  maxUses?: number;
  active: boolean;
}

interface DiscountFormProps {
  initialData?: Partial<DiscountFormData> & { id?: string };
  isEditing?: boolean;
}

const COUNTRIES = [
  { code: "AE", name: "United Arab Emirates" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "OM", name: "Oman" },
  { code: "QA", name: "Qatar" },
];

export function DiscountForm({ initialData, isEditing = false }: DiscountFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchProduct, setSearchProduct] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  const [form, setForm] = useState<DiscountFormData>({
    code: (initialData?.code || '') as string,
    name: initialData?.name || "",
    description: (initialData?.description || '') as string,
    discountType: (initialData?.discountType as any) || "PERCENTAGE",
    value: initialData?.value || 0,
    maxLimitAmount: initialData?.maxLimitAmount,
    countryMaxLimits: (initialData?.countryMaxLimits as Record<string, number>) || {},
    applyToAll: initialData?.applyToAll || false,
    productIds: initialData?.productIds || [],
    categoryIds: initialData?.categoryIds || [],
    countries: initialData?.countries || COUNTRIES.map((c) => c.code),
    minimumOrderValue: initialData?.minimumOrderValue,
    startDate: initialData?.startDate || "",
    endDate: initialData?.endDate || "",
    maxUses: initialData?.maxUses || undefined,
    active: initialData?.active !== undefined ? initialData.active : true,
  });

  // Fetch products - lightweight select endpoint
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/products?select=name,id,sku");
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  const handleInputChange = (field: keyof DiscountFormData, value: any) => {
    if (field === "value" && value === "") {
      setForm((prev) => ({ ...prev, [field]: 0 }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleAddProduct = (productId: string) => {
    if (!form.productIds.includes(productId)) {
      setForm((prev) => ({
        ...prev,
        productIds: [...prev.productIds, productId],
      }));
    }
    setSearchProduct("");
    setShowProductSearch(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.filter((id) => id !== productId),
    }));
  };

  const handleCountryToggle = (countryCode: string) => {
    setForm((prev) => ({
      ...prev,
      countries: prev.countries.includes(countryCode)
        ? prev.countries.filter((c) => c !== countryCode)
        : [...prev.countries, countryCode],
    }));
  };

  const handleSelectAllCountries = () => {
    if (form.countries.length === COUNTRIES.length) {
      setForm((prev) => ({ ...prev, countries: [] }));
    } else {
      setForm((prev) => ({
        ...prev,
        countries: COUNTRIES.map((c) => c.code),
      }));
    }
  };

  const availableProducts = useMemo(() => {
    if (!searchProduct.trim()) {
      return products.filter((p) => !form.productIds.includes(p.id));
    }
    const query = searchProduct.toLowerCase();
    return products.filter(
      (p) =>
        (p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query))) &&
        !form.productIds.includes(p.id)
    );
  }, [products, searchProduct, form.productIds]);

  const selectedProducts = products.filter((p) => form.productIds.includes(p.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validation
      if (!form.name.trim()) {
        toast.error("Discount name is required");
        return;
      }

      if (form.value <= 0) {
        toast.error("Discount value must be greater than 0");
        return;
      }

      if (form.discountType === "PERCENTAGE" && form.value > 100) {
        toast.error("Percentage cannot exceed 100");
        return;
      }

      if (form.countries.length === 0) {
        toast.error("Please select at least one country");
        return;
      }

      const url = isEditing
        ? `/api/admin/promotional/discounts/${initialData?.id}`
        : `/api/admin/promotional/discounts`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save discount");
      }

      toast.success(isEditing ? "Discount updated successfully" : "Discount created successfully");
      router.push("/ueadmin/discounts");
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save discount");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Summer Sale 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coupon Code (Optional)
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., SUMMER20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Discount description..."
          />
        </div>
      </div>

      {/* Discount Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Discount Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type *
            </label>
            <select
              value={form.discountType}
              onChange={(e) => handleInputChange("discountType", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
              <option value="FREE_SHIPPING">Free Shipping</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value *
            </label>
            <input
              type="number"
              min="0"
              max={form.discountType === "PERCENTAGE" ? 100 : undefined}
              step={form.discountType === "PERCENTAGE" ? 1 : 0.01}
              value={form.value}
              onChange={(e) => handleInputChange("value", parseFloat(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Order Value (cents, optional)
            </label>
            <input
              type="number"
              min="0"
              value={form.minimumOrderValue ?? ""}
              onChange={(e) => handleInputChange("minimumOrderValue", e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              Max Discount Cap
              <span className="text-xs text-gray-500 font-normal">(The discount won't exceed this value)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.maxLimitAmount ?? ""}
              onChange={(e) => handleInputChange("maxLimitAmount", e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="No cap"
              title="The discount will not exceed this value, even if the percentage calculation is higher"
            />
          </div>
        </div>

        {/* Country-specific Max Discount Caps */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            Max Discount Cap by Country
            <span className="text-xs text-gray-500 font-normal">(Optional - set different cap per country)</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {COUNTRIES.map((country) => (
              <div key={country.code} className="border rounded-lg p-3">
                <div className="text-xs font-medium text-gray-600 mb-2">{country.name}</div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.countryMaxLimits[country.code] ?? ""}
                  onChange={(e) => handleInputChange("countryMaxLimits", {
                    ...form.countryMaxLimits,
                    [country.code]: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="No cap"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Uses (Optional, leave empty for unlimited)
            </label>
            <input
              type="number"
              min="1"
              value={form.maxUses ?? ""}
              onChange={(e) => handleInputChange("maxUses", e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Unlimited"
            />
          </div>
        </div>
      </div>

      {/* Date Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Validity Period</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Country Selection */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Target Countries</h2>
          <button
            type="button"
            onClick={handleSelectAllCountries}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {form.countries.length === COUNTRIES.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {COUNTRIES.map((country) => (
            <label key={country.code} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.countries.includes(country.code)}
                onChange={() => handleCountryToggle(country.code)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {country.name} ({country.code})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Product Selection */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Products</h2>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.applyToAll}
            onChange={(e) => handleInputChange("applyToAll", e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Apply to all products</span>
        </label>

        {!form.applyToAll && (
          <div className="space-y-4">
            {/* Search Bar with Local Filter */}
            <div className="relative">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products to filter list below..."
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {loadingProducts && <Loader2 size={20} className="animate-spin text-gray-400" />}
              </div>
            </div>

            {/* Selection Summary */}
            {selectedProducts.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <label className="text-sm font-semibold text-blue-800">
                  Selected Products ({selectedProducts.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-2 text-xs font-medium"
                    >
                      <span className="truncate max-w-[200px]">{product.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.id)}
                        className="hover:text-blue-200"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Multi-Select Grid */}
            <div className="border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
              {loadingProducts ? (
                <div className="p-8 text-center">
                  <Loader2 size={24} className="animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Loading products...</p>
                </div>
              ) : availableProducts.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-500">
                    {searchProduct ? `No products match "${searchProduct}"` : 'No products available'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-2">
                  {availableProducts.map((product) => {
                    const isSelected = form.productIds.includes(product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => isSelected ? handleRemoveProduct(product.id) : handleAddProduct(product.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all ${
                          isSelected 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-white hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-white/20' : 'bg-gray-100'
                        }`}>
                          {isSelected && <Check size={14} />}
                        </div>
                        <span className="text-sm font-medium truncate">{product.name}</span>
                        {product.sku && (
                          <span className={`text-[10px] truncate ${isSelected ? 'text-white/60' : 'text-gray-400'}`}>
                            SKU: {product.sku}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {availableProducts.length > 0 && (
              <p className="text-xs text-gray-500 text-center">
                Showing {availableProducts.length} of {products.length} products
                {searchProduct && ` matching "${searchProduct}"`}
              </p>
            )}
          </div>
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
          <span className="text-sm text-gray-700">
            Publish now (set as ACTIVE)
          </span>
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
          {loading ? "Saving..." : isEditing ? "Update Discount" : "Create Discount"}
        </button>
      </div>
    </form>
  );
}
