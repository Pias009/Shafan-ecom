"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Trash2, Edit2, Search, Filter } from "lucide-react";

interface OfferSection {
  id: string;
  title: string;
  subtitle: string | null;
  productIds: string[];
  sortOrder: number;
  active: boolean;
  updatedAt: string;
}

export default function OfferSectionsPage() {
  const [sections, setSections] = useState<OfferSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchSections = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: statusFilter });
      if (searchTerm) params.append("search", searchTerm);

      const res = await fetch(`/api/admin/offer-sections?${params}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/ueadmin/login";
          return;
        }
        throw new Error("Failed to fetch offer sections");
      }

      const data = await res.json();
      setSections(data.sections || []);
    } catch (error) {
      console.error("Error fetching offer sections:", error);
      toast.error("Failed to load offer sections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, [statusFilter, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/offer-sections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Offer section deleted successfully");
      setDeleteId(null);
      fetchSections();
    } catch (error) {
      console.error("Error deleting offer section:", error);
      toast.error("Failed to delete offer section");
    }
  };

  const handleToggleActive = async (section: OfferSection) => {
    try {
      const res = await fetch(`/api/admin/offer-sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !section.active }),
      });
      if (!res.ok) throw new Error("Failed to update");
      setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, active: !s.active } : s)));
      toast.success(section.active ? "Section hidden from Offers page" : "Section now live on Offers page");
    } catch (error) {
      console.error("Error toggling offer section:", error);
      toast.error("Failed to update offer section");
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Offer Sections</h1>
              <p className="text-sm text-gray-500 mt-1">Titled product collections shown on the Offers page</p>
            </div>
            <Link
              href="/ueadmin/offer-sections/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={20} />
              New Section
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading offer sections...</div>
          ) : sections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No offer sections found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Order</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Products</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Updated</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sections.map((section) => (
                  <tr key={section.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{section.sortOrder}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-900 font-medium">{section.title}</div>
                      {section.subtitle && <div className="text-xs text-gray-500">{section.subtitle}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        {section.productIds.length} Product{section.productIds.length === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(section.updatedAt)}</td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleToggleActive(section)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          section.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                        title="Click to toggle"
                      >
                        {section.active ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Link
                          href={`/ueadmin/offer-sections/${section.id}/edit`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button onClick={() => setDeleteId(section.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Offer Section?</h3>
            <p className="text-gray-600 mb-6">
              This action cannot be undone. The section will be removed from the Offers page. The products
              themselves are not affected.
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
