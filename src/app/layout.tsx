import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { MainStoreLayout } from "@/components/MainStoreLayout";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import ClientLayout from "@/components/ClientLayout";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  title: "SHANFA — Radiant Skin Store",
  description: "Premium Skin Care crafted with nature's finest ingredients.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning style={{ scrollBehavior: 'smooth' }}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body
        className={`${playfairDisplay.variable} ${dmSans.variable} antialiased overflow-x-hidden max-w-full`}
      >
        <SpeedInsights />
        <Providers>
          <ClientLayout>
            <Suspense fallback={null}>
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
