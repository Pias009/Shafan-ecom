"use client";

import { Toaster } from "react-hot-toast";
import { HomeSectionForm } from "@/components/HomeSectionForm";

export default function NewHomeSectionPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Add New Section on Homepage</h1>
        <HomeSectionForm />
      </div>
    </div>
  );
}
