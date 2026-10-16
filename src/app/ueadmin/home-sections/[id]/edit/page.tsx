"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import { HomeSectionForm } from "@/components/HomeSectionForm";

interface HomeSection {
  id: string;
  title: string;
  badge: string | null;
  categoryId: string | null;
  productIds: string[];
  sortOrder: number;
  active: boolean;
}

export default function EditHomeSectionPage() {
  const id = useParams<{ id: string }>()?.id;
  const [section, setSection] = useState<HomeSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/home-sections/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch home section");
        return res.json();
      })
      .then(setSection)
      .catch((err) => {
        console.error("Error fetching home section:", err);
        setError("Failed to load home section");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading home section...</p>
        </div>
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-800 font-semibold mb-2">Error</p>
          <p className="text-red-700">{error || "Home section not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Homepage Section</h1>
        <HomeSectionForm
          initialData={{
            id: section.id,
            title: section.title,
            badge: section.badge || "",
            categoryId: section.categoryId || "",
            productIds: section.productIds,
            sortOrder: section.sortOrder,
            active: section.active,
          }}
          isEditing={true}
        />
      </div>
    </div>
  );
}
