"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { OfferSectionForm } from "@/components/OfferSectionForm";

interface OfferSection {
  id: string;
  title: string;
  subtitle: string | null;
  productIds: string[];
  sortOrder: number;
  active: boolean;
  popupEnabled?: boolean;
  popupImage?: string | null;
  popupAction?: string | null;
  popupLink?: string | null;
  coupon?: {
    enabled: boolean;
    code: string;
    discountType: "PERCENTAGE" | "FIXED_AMOUNT";
    value: number;
    maxLimitAmount: number | null;
    minimumOrderValue: number | null;
    endDate: string;
    uses: number;
  } | null;
}

export default function EditOfferSectionPage() {
  const id = useParams<{ id: string }>()?.id;
  const [section, setSection] = useState<OfferSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/offer-sections/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch offer section");
        return res.json();
      })
      .then(setSection)
      .catch((err) => {
        console.error("Error fetching offer section:", err);
        setError("Failed to load offer section");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading offer section...</p>
        </div>
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Error</p>
          <p className="text-red-700">{error || "Offer section not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Offer Section</h1>
        <OfferSectionForm
          initialData={{
            id: section.id,
            title: section.title,
            subtitle: section.subtitle || "",
            productIds: section.productIds,
            sortOrder: section.sortOrder,
            active: section.active,
            popupEnabled: !!section.popupEnabled,
            popupImage: section.popupImage || "",
            popupAction: (section.popupAction as "COPY_CODE" | "LINK" | "NONE") || "COPY_CODE",
            popupLink: section.popupLink || "",
            couponUses: section.coupon?.uses || 0,
            ...(section.coupon && {
              coupon: {
                enabled: section.coupon.enabled,
                code: section.coupon.code,
                discountType: section.coupon.discountType,
                value: String(section.coupon.value ?? ""),
                maxLimitAmount: section.coupon.maxLimitAmount != null ? String(section.coupon.maxLimitAmount) : "",
                minimumOrderValue: section.coupon.minimumOrderValue != null ? String(section.coupon.minimumOrderValue) : "",
                endDate: section.coupon.endDate || "",
              },
            }),
          }}
          isEditing={true}
        />
      </div>
    </div>
  );
}
