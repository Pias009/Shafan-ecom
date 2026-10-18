"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AdminUnavailable } from "./_components/AdminUnavailable";

// Errors thrown while rendering an admin page. Server error messages are hidden
// in production, so a database outage is recognised by its error name.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin] page error:", error);
  }, [error]);

  const dbOutage =
    error?.name === "AdminSessionUnavailableError" ||
    /database temporarily unavailable|P2010|P1001|server selection|timed out/i.test(error?.message || "");

  if (dbOutage) return <AdminUnavailable onRetry={reset} />;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle size={20} />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">This page couldn’t load</h1>
        <p className="mt-1 text-sm text-slate-500">
          Something went wrong while loading it. Try again; if it keeps happening, the error reference below helps us find it.
        </p>
        {error?.digest && <p className="mt-2 font-mono text-xs text-slate-400">Ref: {error.digest}</p>}
        <button
          onClick={reset}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    </div>
  );
}
