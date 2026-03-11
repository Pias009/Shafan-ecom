"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const current = theme === "system" ? systemTheme : theme;
  const isDark = current !== "light";

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      className="glass glass-3d ring-icy inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-white/90 transition hover:text-white"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? (
        isDark ? (
          <>
            <Moon className="h-4 w-4" /> Dark
          </>
        ) : (
          <>
            <Sun className="h-4 w-4" /> Light
          </>
        )
      ) : (
        <>
          <Moon className="h-4 w-4 opacity-70" /> Theme
        </>
      )}
    </button>
  );
}

