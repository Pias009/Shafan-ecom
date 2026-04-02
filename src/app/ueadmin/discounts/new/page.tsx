"use client";

import { DiscountForm } from "@/components/DiscountForm";

export default function NewDiscountPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Discount</h1>
        <DiscountForm />
      </div>
    </div>
  );
}
