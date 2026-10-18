"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminSession } from "./useAdminSession";

export default function SuperGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useAdminSession();
  const router = useRouter();
  const isSuper = session?.role === "SUPERADMIN";

  useEffect(() => {
    if (!isSuper) router.replace("/ueadmin/dashboard");
  }, [isSuper, router]);

  return isSuper ? <>{children}</> : null;
}
