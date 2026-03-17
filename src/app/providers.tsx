"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { GlobalInitializer } from "@/components/GlobalInitializer";

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
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#18181b",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "999px",
            },
          }}
        />
        {children}
      </NextThemesProvider>
    </SessionProvider>
  );
}

