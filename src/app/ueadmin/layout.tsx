import { AdminSidebar } from './_components/AdminSidebar'
import AdminGuard from './_components/AdminGuard'

export default function UeAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-[#FAF9F6] selection:bg-black selection:text-white">
        <div className="fixed inset-y-0 left-0 hidden lg:block">
           <AdminSidebar />
        </div>
        
        <main className="flex-1 lg:pl-80 w-full min-h-screen flex flex-col pt-12 pr-12 pl-12">
          <div className="flex-1">
             {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}
