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
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <CustomToaster position="bottom-center" />
        {children}
      </NextThemesProvider>
    </SessionProvider>
  );
}

