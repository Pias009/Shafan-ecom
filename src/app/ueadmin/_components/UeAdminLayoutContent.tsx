"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from './AdminSidebar'
import AdminGuard from './AdminGuard'
import { OrderAlertListener } from './OrderAlertListener'
import { StuckOrdersProvider } from './StuckOrdersProvider'
import { AIAssistant } from '@/components/AIAssistant'

export function UeAdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/ueadmin/login") ||
                     pathname?.startsWith("/ueadmin/verify") ||
                     pathname?.startsWith("/ueadmin/setup") ||
                     pathname?.startsWith("/ueadmin/unauthorized");

  if (isAuthPage) {
    return (
      <AdminGuard>
        <div className="min-h-screen flex bg-[#FAF9F6] selection:bg-black selection:text-white">
          <main className="flex-1 w-full min-h-screen flex flex-col">
            {children}
          </main>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <OrderAlertListener />
      <StuckOrdersProvider />
      <AIAssistant />
      <div className="min-h-screen flex bg-[#FAF9F6] selection:bg-black selection:text-white">
        <div className="fixed inset-y-0 left-0 hidden lg:block">
           <AdminSidebar />
        </div>
        
        <main className="flex-1 lg:pl-80 w-full min-h-screen flex flex-col pt-12 px-8 lg:px-12 overflow-y-auto">
          <div className="flex-1">
             {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
