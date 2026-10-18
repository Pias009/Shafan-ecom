"use client";

import { useEffect, useState } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

/**
 * Shown when the admin's login is valid but the database could not be reached
 * to confirm it. Retries on its own; never logs the admin out.
 */
export function AdminUnavailable({ onRetry }: { onRetry?: () => void }) {
  const [seconds, setSeconds] = useState(8);

  const retry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  useEffect(() => {
    if (seconds <= 0) {
      retry();
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-amber-50 text-amber-600">
          <WifiOff size={20} />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">Database temporarily unreachable</h1>
        <p className="mt-1 text-sm text-slate-500">
          You’re still signed in. The store database didn’t respond in time, usually a brief network hiccup.
          Retrying in {seconds}s.
        </p>
        <button
          onClick={retry}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          <RefreshCw size={15} /> Retry now
        </button>
      </div>
    </div>
  );
}
