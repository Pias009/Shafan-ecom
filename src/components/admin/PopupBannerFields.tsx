"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { ImagePlus, Loader2 } from "lucide-react";

// Popup banner controls shared by the coupon form (Discounts & coupons) and
// the offer-section form. The storefront side is SitePopupBanner.

export interface PopupBannerValue {
  popupEnabled: boolean;
  popupImage: string;
  popupAction: "COPY_CODE" | "LINK" | "NONE";
  popupLink: string;
}

export const EMPTY_POPUP: PopupBannerValue = {
  popupEnabled: false,
  popupImage: "",
  popupAction: "COPY_CODE",
  popupLink: "",
};

/** Client-side check before saving; returns an error message or null. */
export function popupBannerError(value: PopupBannerValue, hasCode: boolean): string | null {
  if (!value.popupEnabled) return null;
  if (!value.popupImage) return "Upload the popup banner image, or turn the popup off";
  if (value.popupAction === "LINK" && !value.popupLink.trim()) return "Enter the link the popup banner should open";
  if (value.popupAction === "COPY_CODE" && !hasCode) return "Add a coupon code, or pick another click action for the popup";
  return null;
}

export function PopupBannerFields({
  value,
  onChange,
  couponCode,
}: {
  value: PopupBannerValue;
  onChange: (patch: Partial<PopupBannerValue>) => void;
  /** The code "Copy the coupon code" copies; empty disables that option. */
  couponCode: string;
}) {
  const [uploading, setUploading] = useState(false);
  const code = couponCode.trim().toUpperCase();

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "ecommerce/popups");
    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        onChange({ popupImage: data.url });
        toast.success("Banner uploaded");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const fileInput = (
    <input
      type="file"
      accept="image/*"
      className="hidden"
      disabled={uploading}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) upload(file);
        e.target.value = "";
      }}
    />
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Popup Banner</h2>
        <p className="text-sm text-gray-500">
          Show one full image as a popup across the website. Each visitor sees it once, on the first page they open, with an ✕ to close it.
        </p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value.popupEnabled}
          onChange={(e) =>
            onChange({
              popupEnabled: e.target.checked,
              // "Copy the coupon code" needs a code; fall back to a plain banner.
              ...(e.target.checked && !code && value.popupAction === "COPY_CODE" ? { popupAction: "NONE" as const } : {}),
            })
          }
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Show this banner as a popup on the website</span>
      </label>

      {value.popupEnabled && (
        <div className="space-y-5">
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">Banner image</span>
            {value.popupImage ? (
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                <img
                  src={value.popupImage}
                  alt="Popup banner preview"
                  className="max-h-72 w-auto rounded-lg border border-gray-200 bg-gray-50"
                />
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-blue-600 hover:underline cursor-pointer">
                    {uploading ? "Uploading..." : "Replace image"}
                    {fileInput}
                  </label>
                  <button
                    type="button"
                    onClick={() => onChange({ popupImage: "" })}
                    className="text-sm text-red-600 hover:underline text-left"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 w-full max-w-md h-44 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/40 transition">
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                ) : (
                  <ImagePlus className="w-6 h-6 text-gray-400" />
                )}
                <span className="text-sm text-gray-600">{uploading ? "Uploading..." : "Upload banner image"}</span>
                <span className="text-xs text-gray-400">Portrait or square works best, e.g. 1080 × 1350 px · max 10 MB</span>
                {fileInput}
              </label>
            )}
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">When a visitor clicks the banner</span>
            <div className="space-y-2">
              {([
                { value: "COPY_CODE", label: "Copy the coupon code", hint: code ? `Copies ${code} so they can paste it at checkout` : "Add a coupon code first" },
                { value: "LINK", label: "Open a link", hint: "A page on this site (e.g. /offers) or a full URL" },
                { value: "NONE", label: "Nothing", hint: "The banner is just an announcement" },
              ] as const).map((opt) => (
                <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={value.popupAction === opt.value}
                    onChange={() => onChange({ popupAction: opt.value })}
                    disabled={opt.value === "COPY_CODE" && !code}
                    className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-800">
                    {opt.label} <span className="text-gray-400">— {opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            {value.popupAction === "LINK" && (
              <input
                type="text"
                value={value.popupLink}
                onChange={(e) => onChange({ popupLink: e.target.value })}
                placeholder="/offers or https://..."
                className="mt-3 w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <p className="text-xs text-gray-500">
            The popup only shows while it is live (and, if it copies a code, while that code works in the visitor&apos;s country). If several popups are on, the most recently updated one is shown. Changing the image or action shows it once more to everyone.
          </p>
        </div>
      )}
    </div>
  );
}
