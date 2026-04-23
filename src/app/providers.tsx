"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { GlobalInitializer } from "@/components/GlobalInitializer";
import { CustomToaster } from "@/components/CustomToaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GlobalInitializer />
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <CustomToaster position="top-center" />
        {children}
      </NextThemesProvider>
    </SessionProvider>
  );
}