import Link from 'next/link'
import AdminGuard from './_components/AdminGuard'

// Admin root layout: sidebar + content area
export default function UeAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-gray-50">
        <aside className="w-64 border-r border-black/5 bg-white p-4 hidden md:block">
          <div className="mb-6 text-xl font-bold">Admin Panel</div>
          <nav className="flex flex-col gap-2">
            <Link href="/ueadmin" className="px-3 py-2 rounded-lg hover:bg-black/5 font-medium">Dashboard</Link>
            <Link href="/ueadmin/users" className="px-3 py-2 rounded-lg hover:bg-black/5 font-medium">Users</Link>
            <Link href="/ueadmin/products" className="px-3 py-2 rounded-lg hover:bg-black/5 font-medium">Products</Link>
            <Link href="/ueadmin/banners" className="px-3 py-2 rounded-lg hover:bg-black/5 font-medium">Banners</Link>
            <div className="pt-2 mt-2 border-t border-black/5">
              <p className="px-3 text-[9px] font-black uppercase tracking-widest text-black/30 mb-1">Content</p>
              <Link href="/ueadmin/blog" className="block px-3 py-2 rounded-lg hover:bg-black/5 font-medium">📝 Blog / Announcements</Link>
              <Link href="/ueadmin/offer-banners" className="block px-3 py-2 rounded-lg hover:bg-black/5 font-medium">🏷️ Offer Banners</Link>
            </div>
          </nav>
        </aside>
        <main className="flex-1 p-6 w-full">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
