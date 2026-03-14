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
            <Link href="/ueadmin" className="px-3 py-2 rounded-lg hover:bg-black/5">Dashboard</Link>
            <Link href="/ueadmin/users" className="px-3 py-2 rounded-lg hover:bg-black/5">Users</Link>
            <Link href="/ueadmin/products" className="px-3 py-2 rounded-lg hover:bg-black/5">Products</Link>
            <Link href="/ueadmin/banners" className="px-3 py-2 rounded-lg hover:bg-black/5">Banners</Link>
          </nav>
        </aside>
        <main className="flex-1 p-6 w-full">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
