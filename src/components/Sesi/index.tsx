"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSesi } from "./useSesi";
import SesiIcon from "./SesiIcon";
import SesiPanel from "./SesiPanel";

export default function Sesi() {
  const pathname = usePathname();
  const { enabled, setOpen } = useSesi();

  const isAdminRoute = pathname?.startsWith("/ueadmin") || pathname?.startsWith("/admin");

  useEffect(() => {
    if (isAdminRoute) {
      setOpen(false);
    }
  }, [isAdminRoute, pathname, setOpen]);

  if (!enabled || isAdminRoute) return null;

  return (
    <>
      <SesiIcon />
      <SesiPanel />
    </>
  );
}
