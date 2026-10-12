"use client";

import { BannerManager } from "../_components/BannerManager";

export default function AdminHomeBannersPage() {
  return (
    <BannerManager
      placement="HOME_MID"
      config={{
        title: "Home Banner (above Routine)",
        description: "The promotional banner on the homepage between Flash Sales and the Routine section. Separate from the hero slider and the Offers page.",
        badge: "Home · above Routine",
        newLabel: "New Home Banner",
        activeText: "Active — Visible above the Routine section",
        inactiveText: "Inactive — Hidden from the homepage",
        emptyTitle: "No home banners yet",
        emptyHint: "Until you add one, nothing is shown above the Routine section",
        sizeHint: "1600×600px (shown full image, never cropped)",
        preview: "plain",
      }}
    />
  );
}
