import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MainStoreLayout } from "@/components/MainStoreLayout";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClientLayout from "@/components/ClientLayout";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";

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
  title: "Shafan — Radiant Skin Store",
  description: "Premium skincare crafted with nature's finest ingredients.",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfairDisplay.variable} ${dmSans.variable} antialiased`}
      >
        <WebVitalsReporter />
        <Providers>
          <ClientLayout>
            <Suspense fallback={
              <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-6">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-black/10 rounded-full"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-black" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="font-display text-2xl font-bold text-black tracking-tight">Shafan</h2>
                  <p className="font-body text-xs text-black/40 font-bold uppercase tracking-[0.2em]">Loading...</p>
                </div>
              </div>
            }>
              <MainStoreLayout>
                {children}
              </MainStoreLayout>
            </Suspense>
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
