import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MainStoreLayout } from "@/components/MainStoreLayout";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClientLayout from "@/components/ClientLayout";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";
import { GlobalLoadingOverlay } from "@/components/GlobalLoadingOverlay";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: 'swap',
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "SHANFA — Your Caring Skin Partner",
  description: "Premium Skin Care crafted with nature's finest ingredients for your natural beauty.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://stats.pusher.com" />
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
          <SpeedInsights />
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}