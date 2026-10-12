"use client";

import { BannerManager } from "./_components/BannerManager";

export default function AdminHeroBannersPage() {
  return (
    <BannerManager
      placement="HERO"
      config={{
        title: "Hero Slider Banners",
        description: "The full-screen slider at the very top of the homepage — images, text overlay, CTA & scheduling",
        badge: "Hero Slider",
        newLabel: "New Hero Slider Banner",
        activeText: "Active — Visible on homepage slider",
        inactiveText: "Inactive — Hidden from slider",
        emptyTitle: "No hero banners yet",
        emptyHint: "Add your first banner to populate the homepage slider",
        sizeHint: "1920×720px",
        preview: "hero",
      }}
    />
  );
}
