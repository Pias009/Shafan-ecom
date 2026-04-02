"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Trash2, Edit2, Copy, Search, Filter } from "lucide-react";

interface Discount {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  discountType: string;
  value: number;
  countries: string[];
  active: boolean;
  status: string;
  startDate: string | null;
  endDate: string | null;
  uses: number;
  maxUses: number | null;
  publishedAt: string | null;
  createdAt: string;
  _count?: {
    productDiscounts: number;
    categoryDiscounts: number;
  };
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: statusFilter,
      });
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const res = await fetch(`/api/admin/promotional/discounts?${params}`);
      const data = await res.json();
      setDiscounts(data.discounts || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      toast.error("Failed to load discounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [page, statusFilter, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!deleteId) return;

    try {
      const res = await fetch(`/api/admin/promotional/discounts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Discount deleted successfully");
      setDeleteId(null);
      fetchDiscounts();
    } catch (error) {
      console.error("Error deleting discount:", error);
      toast.error("Failed to delete discount");
    }
  };

  const handleCopyCode = (code: string | null) => {
    if (!code) {
      toast.error("No code to copy");
      return;
    }
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-800",
      DRAFT: "bg-gray-100 text-gray-800",
      ARCHIVED: "bg-red-100 text-red-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Discounts & Coupons</h1>
            <Link
              href="/ueadmin/discounts/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              New Discount
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading discounts...</div>
          ) : discounts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No discounts found</div>
          ) : (
            <>
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Countries</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Products</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Usage</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Valid</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {discounts.map((discount) => (
                    <tr key={discount.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{discount.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {discount.code ? (
                          <button
                            onClick={() => handleCopyCode(discount.code)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            {discount.code}
                            <Copy size={14} />
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {discount.discountType === "PERCENTAGE" ? "%" : "$"}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {discount.value}{discount.discountType === "PERCENTAGE" ? "%" : ""}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {discount.countries.slice(0, 2).map((c) => (
                            <span
                              key={c}
                              className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {c}
                            </span>
                          ))}
                          {discount.countries.length > 2 && (
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              +{discount.countries.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {discount._count?.productDiscounts || 0}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {discount.uses}/{discount.maxUses ? discount.maxUses : "∞"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(discount.startDate)} to {formatDate(discount.endDate)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(discount.status)}`}>
                          {discount.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <Link
                          href={`/ueadmin/discounts/${discount.id}/edit`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleCopyCode(discount.code)}
                          className="text-green-600 hover:text-green-800"
                          title="Copy code"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => setDeleteId(discount.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Page {page} of {Math.ceil(total / limit)} (Total: {total})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(total / limit)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Discount?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The discount will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
