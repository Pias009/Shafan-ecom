"use client";

import { Toaster } from "react-hot-toast";
import { OfferSectionForm } from "@/components/OfferSectionForm";

export default function NewOfferSectionPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Toaster />
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Offer Section</h1>
        <OfferSectionForm />
      </div>
    </div>
  );
}
