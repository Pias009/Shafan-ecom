"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, X, Save } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface Notice {
  id: string;
  text: string;
  active: boolean;
  sortOrder: number;
}

const defaultNotices = [
  { id: "1", text: "🎁 Special Offer: Get 20% off on all skincare products!", active: true, sortOrder: 1 },
  { id: "2", text: "🚚 Free shipping on orders above AED 200", active: true, sortOrder: 2 },
  { id: "3", text: "✨ New Arrivals: Check out our latest products", active: true, sortOrder: 3 },
];

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formText, setFormText] = useState("");
  const [boardEnabled, setBoardEnabled] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/notices");
      if (r.ok) {
        const data = await r.json();
        setNotices(data);
      } else {
        setNotices(defaultNotices);
      }
    } catch {
      setNotices(defaultNotices);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveNotice() {
    if (!formText.trim()) {
      toast.error("Notice text is required");
      return;
    }

    const payload = {
      text: formText,
      active: true,
      sortOrder: editingId ? notices.find(n => n.id === editingId)?.sortOrder : notices.length + 1,
    };

    try {
      if (editingId) {
        const r = await fetch(`/api/admin/notices/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          toast.success("Notice updated!");
        }
      } else {
        const r = await fetch("/api/admin/notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (r.ok) {
          toast.success("Notice created!");
        }
      }
      setFormText("");
      setEditingId(null);
      setShowForm(false);
      load();
    } catch {
      toast.error("Failed to save");
    }
  }

  async function toggleNotice(notice: Notice) {
    try {
      const r = await fetch(`/api/admin/notices/${notice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...notice, active: !notice.active }),
      });
      if (r.ok) {
        toast.success(notice.active ? "Notice disabled" : "Notice enabled");
        load();
      }
    } catch {
      toast.error("Failed to update");
    }
  }

  async function deleteNotice(id: string) {
    if (!confirm("Delete this notice?")) return;
    try {
      const r = await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
      if (r.ok) {
        toast.success("Deleted");
        load();
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  function editNotice(notice: Notice) {
    setFormText(notice.text);
    setEditingId(notice.id);
    setShowForm(true);
  }

  const activeNotices = notices.filter(n => n.active);

  return (
    <div className="space-y-8">
      <Toaster />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notice Board</h1>
          <p className="text-sm text-black/50 mt-1">Manage announcements shown at the top of homepage</p>
        </div>
        <button
          onClick={() => { setFormText(""); setEditingId(null); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-xl text-sm font-bold"
        >
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Notice</>}
        </button>
      </div>

      {/* Enable/Disable Notice Board */}
      <div className="bg-white rounded-2xl border border-black/10 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold">Notice Board Visibility</h3>
            <p className="text-sm text-black/50">Show/hide the announcement bar on homepage</p>
          </div>
          <button
            onClick={() => {
              const newState = !boardEnabled;
              setBoardEnabled(newState);
              localStorage.setItem("noticeBoardEnabled", String(newState));
              toast.success(newState ? "Notice board enabled" : "Notice board disabled");
            }}
            className={`px-4 py-2 rounded-xl font-bold text-sm ${boardEnabled ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {boardEnabled ? "Enabled" : "Disabled"}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-black/10 p-6 space-y-4">
          <h3 className="font-bold">{editingId ? "Edit Notice" : "Add New Notice"}</h3>
          <div>
            <label className="block text-xs font-bold text-black/50 mb-1 uppercase">Notice Text</label>
            <input
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              className="w-full border border-black/10 rounded-xl px-4 py-3 text-sm"
              placeholder="🎁 Special Offer: Get 20% off!"
            />
          </div>
          <button
            onClick={saveNotice}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-bold text-sm"
          >
            <Save size={16} /> Save Notice
          </button>
        </div>
      )}

      {/* Notices List */}
      {loading ? (
        <div className="text-center py-12 text-black/50">Loading...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-12 text-black/50">
          <p>No notices yet. Add your first notice!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.sort((a, b) => a.sortOrder - b.sortOrder).map((notice) => (
            <div key={notice.id} className={`flex items-center gap-4 p-4 rounded-2xl border ${notice.active ? "bg-white border-black/10" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex-1">
                <p className="font-medium">{notice.text}</p>
                <p className="text-xs text-black/30 mt-1">Order: {notice.sortOrder}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${notice.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {notice.active ? "Active" : "Inactive"}
                </span>
                <button onClick={() => editNotice(notice)} className="p-2 hover:bg-black/5 rounded-lg">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => toggleNotice(notice)} className={`p-2 rounded-lg text-xs font-bold ${notice.active ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  {notice.active ? "Disable" : "Enable"}
                </button>
                <button onClick={() => deleteNotice(notice.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <p className="text-sm text-blue-700">
          <strong>Preview:</strong> Users on homepage will see rotating notices from the active notices above.
          The notice bar will auto-fill the space when visible.
        </p>
      </div>
    </div>
  );
}