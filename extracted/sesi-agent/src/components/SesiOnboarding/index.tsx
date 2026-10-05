"use client";

import { useEffect, useState } from "react";
import { trackSesiOnboardingShown } from "@/lib/datalayer";
import { SesiOnboardingOverlay, type DismissReason } from "./SesiOnboardingOverlay";

const SEEN_KEY = "sesi-onboarding-seen";

export default function SesiOnboarding() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(SEEN_KEY);
      if (!seen) {
        setVisible(true);
        trackSesiOnboardingShown();
      }
    } catch {
      // localStorage unavailable (private browsing, disabled storage) —
      // don't show the overlay rather than risk showing it every visit.
    }
  }, []);

  function handleDismiss(reason: DismissReason) {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return <SesiOnboardingOverlay onDismiss={handleDismiss} />;
}
