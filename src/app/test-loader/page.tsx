"use client";

import { useState, useEffect } from "react";
import { Loader } from "@/components/Loader";

export default function TestLoaderPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-cream p-8">
      <h1 className="text-3xl font-bold mb-8">Loader Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Small Loader</h2>
          <Loader size="sm" />
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Medium Loader (Default)</h2>
          <Loader size="md" />
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Large Loader</h2>
          <Loader size="lg" />
        </div>
      </div>

      <div className="mt-12 bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Simulated Loading State</h2>
        <p className="mb-4">
          This simulates a loading state that disappears after 3 seconds.
        </p>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
            <Loader size="lg" />
            <p className="mt-4 text-gray-600">Loading content...</p>
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-green-200 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-700">✓ Content Loaded!</p>
            <p className="mt-2 text-gray-600">The loader has completed and content is now visible.</p>
            <button 
              onClick={() => setLoading(true)}
              className="mt-4 px-6 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-800 transition-colors"
            >
              Reset Loading
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-500">
        <p>Loader CSS from Uiverse.io by EddyBel has been added to globals.css</p>
        <p>The loader features animated circles with gradient backgrounds and blur effects.</p>
      </div>
    </div>
  );
}