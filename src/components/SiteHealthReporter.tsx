"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";

// Real-user page speed (Core Web Vitals) and JavaScript errors from shoppers'
// browsers, sent to /api/performance/metrics for Kira's Engineering team.
// No personal data: page path, metric value, error message and browser only.

type Metric = { name: string; value: number; unit?: string; timestamp: number; metadata?: Record<string, unknown> };

const ENDPOINT = "/api/performance/metrics";
const VITALS_SAMPLE_RATE = 0.5; // half of page views report speed; errors are always reported
const MAX_ERRORS_PER_PAGE = 5;

let queue: Metric[] = [];
let sampled: boolean | null = null;
const seenErrors = new Set<string>();

function sessionId() {
  try {
    let id = sessionStorage.getItem("tracking_session_id");
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem("tracking_session_id", id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

function flush() {
  if (queue.length === 0) return;
  const body = JSON.stringify({
    metrics: queue.splice(0, 50),
    sessionId: sessionId(),
    userAgent: navigator.userAgent.slice(0, 200),
    connection: (navigator as any).connection?.effectiveType || "",
  });
  try {
    if (!navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) {
      fetch(ENDPOINT, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  } catch {}
}

function push(m: Metric) {
  queue.push(m);
  if (queue.length >= 20) flush();
}

export default function SiteHealthReporter() {
  const pathname = usePathname() || "/";

  useReportWebVitals((metric) => {
    if (sampled === null) sampled = Math.random() < VITALS_SAMPLE_RATE;
    if (!sampled) return;
    const name = metric.name.toLowerCase(); // lcp, inp, cls, fcp, ttfb
    if (!["lcp", "inp", "cls", "fcp", "ttfb"].includes(name)) return;
    push({
      name,
      value: Math.round(name === "cls" ? metric.value * 1000 : metric.value) / (name === "cls" ? 1000 : 1),
      unit: name === "cls" ? "score" : "ms",
      timestamp: Date.now(),
      metadata: { page: window.location.pathname, rating: (metric as any).rating },
    });
  });

  useEffect(() => {
    const report = (message: string, source?: string, stack?: string) => {
      const key = `${message}|${window.location.pathname}`;
      if (seenErrors.has(key) || seenErrors.size >= MAX_ERRORS_PER_PAGE) return;
      seenErrors.add(key);
      push({
        name: "js_error",
        value: 1,
        unit: "count",
        timestamp: Date.now(),
        metadata: {
          message: message.slice(0, 300),
          source: (source || "").slice(0, 200),
          stack: (stack || "").split("\n").slice(0, 4).join("\n").slice(0, 600),
          page: window.location.pathname,
        },
      });
      flush();
    };
    const onError = (e: ErrorEvent) => {
      // Ignore cross-origin "Script error." noise from third-party tags.
      if (!e.message || e.message === "Script error.") return;
      report(e.message, e.filename, e.error?.stack);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      const message = r instanceof Error ? r.message : typeof r === "string" ? r : "";
      if (!message) return;
      report(`Unhandled promise rejection: ${message}`, "", r instanceof Error ? r.stack : "");
    };
    const onHide = () => { if (document.visibilityState === "hidden") flush(); };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  // New page: allow its errors to be reported, send what we have.
  useEffect(() => {
    seenErrors.clear();
    flush();
  }, [pathname]);

  return null;
}
