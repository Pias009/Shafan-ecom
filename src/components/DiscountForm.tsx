"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { X, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
}

interface DiscountFormData {
  code: string;
  name: string;
  description: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_SHIPPING";
  value: number;
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

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/products?limit=50");
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
    setForm((prev) => ({ ...prev, [field]: value }));
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

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) &&
      !form.productIds.includes(p.id)
  );

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
              value={form.minimumOrderValue || ""}
              onChange={(e) => handleInputChange("minimumOrderValue", e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
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
              value={form.maxUses || ""}
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
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                onFocus={() => setShowProductSearch(true)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {showProductSearch && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto z-10">
                  {loadingProducts ? (
                    <div className="p-4 text-center text-gray-500">Loading...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No products found</div>
                  ) : (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddProduct(product.id)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                      >
                        {product.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selectedProducts.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Selected Products ({selectedProducts.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      <span className="text-sm">{product.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.id)}
                        className="hover:text-blue-600"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
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
