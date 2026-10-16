"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Gift, Loader2 } from "lucide-react";

interface Coupon {
  code: string;
  name: string;
  discountType: string;
  value: number;
}

// Picks which coupon the footer "Claim 10%" sign-up emails and the account dashboard shows.
export function WelcomeOfferSetting() {
  const [code, setCode] = useState("");
  const [savedCode, setSavedCode] = useState("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [subscribers, setSubscribers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/welcome-offer")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setCode(data.code);
        setSavedCode(data.code);
        setCoupons(data.coupons || []);
        setSubscribers(data.subscribers || 0);
      })
      .catch(() => toast.error("Failed to load welcome offer"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/welcome-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSavedCode(data.code);
      toast.success(`Footer welcome offer set to ${data.code}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const savedIsActive = coupons.some((c) => c.code.toLowerCase() === savedCode.toLowerCase());

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="p-2.5 rounded-xl bg-pink-50 text-[#890754] shrink-0">
          <Gift size={20} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Footer Welcome Offer</h2>
          <p className="text-xs text-gray-500">
            Emailed to new footer sign-ups and shown on each customer&apos;s account dashboard
            {!loading && (
              <>
                {" • "}
                <Link href="/ueadmin/welcome-subscribers" className="text-blue-600 hover:text-blue-800 font-medium">
                  {subscribers} sign-up{subscribers === 1 ? "" : "s"} — view &amp; manage
                </Link>
              </>
            )}
          </p>
          {!loading && !savedIsActive && (
            <p className="text-xs font-medium text-red-600 mt-1">
              {savedCode} is not an active coupon. Sign-ups are saved but no code is sent.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 size={20} className="animate-spin text-gray-400" />
        ) : (
          <>
            <select
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {!savedIsActive && <option value={savedCode}>{savedCode} (inactive)</option>}
              {coupons.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || code === savedCode}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
