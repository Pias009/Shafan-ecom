"use client";

import { BannerManager } from "../_components/BannerManager";

export default function AdminOffersBannersPage() {
  return (
    <BannerManager
      placement="OFFERS"
      config={{
        title: "Offers Page Banners",
        description: "The banner slider at the top of the /offers page. Separate from the homepage banners.",
        badge: "Offers page",
        newLabel: "New Offers Page Banner",
        activeText: "Active — Visible on the Offers page",
        inactiveText: "Inactive — Hidden from the Offers page",
        emptyTitle: "No offers page banners yet",
        emptyHint: "Add a banner to show a slider at the top of the Offers page",
        sizeHint: "2400×900px (24:9)",
        preview: "plain",
      }}
    />
  );
}
