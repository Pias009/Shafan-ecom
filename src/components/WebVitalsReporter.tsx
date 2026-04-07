"use client";

import { useReportWebVitals } from "next/web-vitals";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "development") {
      console.log("Web Vitals:", metric.name, metric.value);
    } else {
      console.log(`[WebVitals] ${metric.name}:`, metric.value);
    }
  });

  return null;
}