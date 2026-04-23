import { AdminSidebar } from './_components/AdminSidebar'
import AdminGuard from './_components/AdminGuard'
import { OrderAlertListener } from './_components/OrderAlertListener'
import { StuckOrdersProvider } from './_components/StuckOrdersProvider'
import { AIAssistant } from '@/components/AIAssistant'

export default function UeAdminLayout({ children }: { children: React.ReactNode }) {
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
  )
}