import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import { MainStoreLayout } from "@/components/MainStoreLayout";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClientLayout from "@/components/ClientLayout";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { GlobalLoadingOverlay } from "@/components/GlobalLoadingOverlay";
import { GTMProvider } from "@/components/GTMProvider";
import { GAProvider } from "@/components/GAProvider";
import { MetaPixelProvider } from "@/components/MetaPixelProvider";
import ContentProtection from "@/components/ContentProtection";
import ReferralTracker from "@/components/ReferralTracker";

// Self-hosted (Fontsource variable fonts, OFL) instead of next/font/google:
// the Google fetch at build time broke Vercel builds when Google changed its
// font CSS URL format, and bundled files also avoid a third-party request.
const playfairDisplay = localFont({
  variable: "--font-playfair",
  src: [
    { path: "./fonts/playfair-display-latin-wght-normal.woff2", weight: "400 900", style: "normal" },
    { path: "./fonts/playfair-display-latin-wght-italic.woff2", weight: "400 900", style: "italic" },
  ],
  display: 'swap',
});

const dmSans = localFont({
  variable: "--font-dm-sans",
  src: [
    { path: "./fonts/dm-sans-latin-wght-normal.woff2", weight: "100 1000", style: "normal" },
    { path: "./fonts/dm-sans-latin-wght-italic.woff2", weight: "100 1000", style: "italic" },
  ],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.shanfaglobal.com"),
  title: "SHANFA — Your Caring Skin Partner",
  description: "Premium Skin Care crafted with nature's finest ingredients for your natural beauty.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/logo-icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "SHANFA — Your Caring Skin Partner",
    description: "Premium Skin Care crafted with nature's finest ingredients for your natural beauty.",
    url: "https://www.shanfaglobal.com",
    siteName: "SHANFA GLOBAL",
    images: [
      {
        url: "/images/shanfa-logo-official.png",
        width: 1647,
        height: 260,
        alt: "SHANFA GLOBAL Logo",
      },
    ],
    type: "website",
  },
  verification: {
    google: "961737d60c2e9da4",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${playfairDisplay.variable} ${dmSans.variable}`}>
      <head>
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <meta httpEquiv="Permissions-Policy" content="camera=(self), microphone=(self), geolocation=()" />
      </head>
      <body className="antialiased">
        <Providers>
          <MainStoreLayout>
            <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>}>
              <GlobalLoadingOverlay />
              <ClientLayout>
                {children}
              </ClientLayout>
            </Suspense>
          </MainStoreLayout>
          <GTMProvider />
          <GAProvider />
          <MetaPixelProvider />
          <SpeedInsights />
          <Analytics />
          <ContentProtection />
          <ReferralTracker />
        </Providers>
      </body>
    </html>
  );
}