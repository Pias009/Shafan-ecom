"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ContentProtection() {
  const pathname = usePathname();

  useEffect(() => {
    // Disable protection for admin panel
    if (pathname?.startsWith("/ueadmin")) return;
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Disable certain keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable Ctrl+C, Ctrl+V, Ctrl+U, Ctrl+S, Ctrl+P, F12, Ctrl+Shift+I
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "u" || e.key === "s" || e.key === "p")) ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.metaKey && e.shiftKey && e.key === "C") // Mac inspect
      ) {
        e.preventDefault();
      }
    };

    // Disable image drag (redundant with CSS but good for safety)
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === "IMG") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null;
}
