"use client";

import { useEffect } from "react";

export default function ScrollToProduct({ itemId }: { itemId?: string }) {
  useEffect(() => {
    if (!itemId) return;
    const el = document.getElementById(`item-${itemId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [itemId]);
  return null;
}
