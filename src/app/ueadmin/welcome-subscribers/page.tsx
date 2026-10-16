"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, Search, Trash2 } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  welcomeCode: string | null;
  emailSentAt: string | null;
  createdAt: string;
  usedAt: string | null;
}

export default function WelcomeSubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      const res = await fetch(`/api/admin/welcome-subscribers?${params}`, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          window.location.href = "/ueadmin/login";
          return;
        }
        throw new Error("Failed to fetch sign-ups");
      }
      const data = await res.json();
      setSubscribers(data.subscribers || []);
    } catch (error) {
      console.error("Error fetching sign-ups:", error);
      toast.error("Failed to load sign-ups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/welcome-subscribers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Sign-up deleted");
      setDeleteTarget(null);
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting sign-up:", error);
      toast.error("Failed to delete sign-up");
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
          <Link href="/ueadmin/discounts" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-3">
            <ArrowLeft size={16} /> Discounts & Coupons
          </Link>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Welcome Offer Sign-ups</h1>
            <p className="text-sm text-gray-500 mt-1">
              Customers who claimed the footer welcome code. Each code works once per customer, then shows as used.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading sign-ups...</div>
          ) : subscribers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No sign-ups yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Signed Up</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subscribers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{s.email}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-700">{s.welcomeCode || "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(s.createdAt)}</td>
                    <td className="px-6 py-4 text-sm">
                      {s.usedAt ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          USED {formatDate(s.usedAt)}
                        </span>
                      ) : s.emailSentAt ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          SENT, NOT USED
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          EMAIL NOT SENT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => setDeleteTarget(s)} className="text-red-600 hover:text-red-800" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Sign-up?</h3>
            <p className="text-gray-600 mb-6">
              {deleteTarget.email} will be removed from this list and can sign up again. If they already used the
              code, it stays used.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget.id)}
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
