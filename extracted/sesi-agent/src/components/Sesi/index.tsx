"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSesi } from "./useSesi";
import SesiIcon from "./SesiIcon";
import SesiPanel from "./SesiPanel";
import SesiVote from "./SesiVote";

export default function Sesi() {
  const pathname = usePathname();
  const { enabled, isOpen, setOpen } = useSesi();

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
      {isOpen && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[9999]">
          <SesiVote />
        </div>
      )}
      <SesiPanel />
    </>
  );
}
