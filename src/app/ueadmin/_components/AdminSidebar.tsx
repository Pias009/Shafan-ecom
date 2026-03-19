"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { 
  BarChart3, Store, Users, Package, 
  Settings, ShieldAlert, BookOpen, 
  Tag, Image as ImageIcon, Briefcase,
  Terminal, LayoutGrid
} from "lucide-react";

export function AdminSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isSuper = session?.user?.email === "pvs178380@gmail.com";
  const isKuwaitContext = pathname?.startsWith("/ueadmin/kuwait");

  // Filter links based on role and path context
  const links = [
    { 
      label: "Global Overview", 
      href: "/ueadmin/dashboard", 
      icon: BarChart3, 
      show: !isKuwaitContext 
    },
    { 
      label: "Kuwait Terminal", 
      href: "/ueadmin/kuwait", 
      icon: Store, 
      show: isKuwaitContext 
    },
    { 
      label: "User Base", 
      href: "/ueadmin/users", 
      icon: Users, 
      show: !isKuwaitContext 
    },
    { 
      label: "Global Catalog", 
      href: "/ueadmin/products", 
      icon: Package, 
      show: !isKuwaitContext 
    },
    { 
      label: isKuwaitContext ? "Local Inventory" : "Global Inventory", 
      href: isKuwaitContext ? "/ueadmin/kuwait/inventory" : "/ueadmin/products", 
      icon: Package, 
      show: isKuwaitContext 
    },
    { 
      label: "Orders Flow", 
      href: isKuwaitContext ? "/ueadmin/kuwait/orders" : "/ueadmin/orders", 
      icon: Briefcase, 
      show: true 
    },
  ];

  return (
    <aside className="w-80 h-full border-r border-black/5 bg-white p-10 flex flex-col space-y-12 shrink-0 glass-panel">
       <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-black/20 group-hover:rotate-12 transition-transform">S</div>
          <div>
            <h2 className="font-black text-xs uppercase tracking-widest text-black">Shafan Admin</h2>
            <p className="text-[10px] font-bold text-black/30 uppercase tracking-[0.2em]">{isKuwaitContext ? "Kuwait Hub" : "Global Control"}</p>
          </div>
       </div>

       <nav className="flex-1 space-y-2">
          {links.filter(l => l.show).map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={`flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-black text-[11px] uppercase tracking-widest ${
                  active ? "bg-black text-white shadow-xl shadow-black/10 scale-105" : "hover:bg-black/5 text-black/40 hover:text-black"
                }`}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}

          <div className="pt-8 space-y-4">
             <div className="px-6 text-[9px] font-black uppercase tracking-[0.3em] text-black/20">System Configuration</div>
             <Link 
                href="/ueadmin/blog" 
                className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-black/40 hover:text-black transition-all font-black text-[11px] uppercase tracking-widest"
             >
                <BookOpen size={18} /> Announcements
             </Link>
             <Link 
                href="/ueadmin/offer-banners" 
                className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-black/40 hover:text-black transition-all font-black text-[11px] uppercase tracking-widest"
             >
                <Tag size={18} /> Marketing Ops
             </Link>
          </div>
       </nav>

       <div className="p-6 bg-black/[0.02] rounded-[2rem] border border-black/5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center font-black text-[10px]">P</div>
             <div className="min-w-0">
                <div className="font-black text-[10px] uppercase tracking-tighter truncate">{session?.user?.email}</div>
                <div className="text-[8px] font-bold text-black/30 uppercase">{session?.user?.role}</div>
             </div>
          </div>
       </div>
    </aside>
  );
}
