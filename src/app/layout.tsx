import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MainStoreLayout } from "@/components/MainStoreLayout";
import { Suspense } from "react";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  preload: false,
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
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
        <Providers>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <MainStoreLayout>
              {children}
            </MainStoreLayout>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
