"use client";

import Link from "next/link";
import { useAdminSession } from "./useAdminSession";
import { usePathname } from "next/navigation";
import {
  BarChart3, Users, Package,
  BookOpen,
  Tag, Image as ImageIcon, Briefcase,
  Terminal, Bell as BellIcon, Settings as SettingsIcon,
  Zap, Flame, ScanFace
} from "lucide-react";

export function AdminSidebar() {
  const { data: session } = useAdminSession();
  const pathname = usePathname();

  const links = [
    { 
      label: "Dashboard", 
      href: "/ueadmin/dashboard", 
      icon: BarChart3, 
      show: true
    },
    { 
      label: "Users", 
      href: "/ueadmin/users", 
      icon: Users, 
      show: true 
}, 
    { 
      label: "Products", 
      href: "/ueadmin/products", 
      icon: Package, 
      show: true 
    },
    { 
      label: "Brands", 
      href: "/ueadmin/brands", 
      icon: Tag, 
      show: true 
    },
{ 
      label: "Orders", 
      href: "/ueadmin/orders", 
      icon: Briefcase, 
      show: true 
    },
    { 
      label: "Face Login", 
      href: "/ueadmin/super/face", 
      icon: ScanFace, 
      show: (session?.role === 'SUPERADMIN') 
    },
  ];

  return (
    <aside className="w-80 h-full border-r border-black/5 bg-white p-10 flex flex-col space-y-12 shrink-0 glass-panel overflow-y-auto custom-scrollbar">
       <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-black/20 group-hover:rotate-12 transition-transform">S</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-xs uppercase tracking-widest text-black">SHANFA Admin</h2>
              <button 
                onClick={() => window.location.reload()}
                className="p-2 hover:bg-black/5 rounded-lg text-black/40 hover:text-black transition-colors"
                title="Sync Data Now"
              >
                <BarChart3 size={14} className="animate-pulse" />
              </button>
            </div>
            <p className="text-[10px] font-bold text-black/60 uppercase tracking-[0.2em]">Admin Panel</p>
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
                 prefetch={true}
                 className={`flex items-center gap-4 px-6 py-4 rounded-3xl transition-all font-black text-[11px] uppercase tracking-widest ${
                   active 
                     ? "bg-black text-white shadow-xl shadow-black/10 scale-105 border border-black/20" 
                     : "hover:bg-black/5 text-slate-600 hover:text-slate-900"
                 }`}
               >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}

<div className="pt-8 space-y-4">
               <div className="px-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Promotions</div>
               <Link
                  href="/ueadmin/discounts"
                  prefetch={true}
                  className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
               >
                  <Tag size={18} /> Offers & Discounts
               </Link>
<Link
                   href="/ueadmin/flash-sales"
                   prefetch={true}
                   className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
                >
                   <Zap size={18} /> Flash Sales
                </Link>
                <Link
                   href="/ueadmin/fresh-from-shelf"
                   prefetch={true}
                   className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
                >
                   <Package size={18} /> Fresh From Shelf
                </Link>
                <Link
                   href="/ueadmin/trending"
                   prefetch={true}
                   className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
                >
                   <Flame size={18} /> Trending Now
                </Link>
               <Link
                  href="/ueadmin/banners"
                  prefetch={true}
                  className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
               >
                  <ImageIcon size={18} /> Hero Banners
               </Link>
               <Link
                  href="/ueadmin/banners/slider"
                  prefetch={true}
                  className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
               >
                  <ImageIcon size={18} /> Products Slider
               </Link>
               <Link
                  href="/ueadmin/banners/products"
                  prefetch={true}
                  className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
               >
                  <ImageIcon size={18} /> Products Banners
               </Link>
               <Link
                  href="/ueadmin/notices"
                  prefetch={true}
                  className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
               >
                  <BellIcon size={18} /> Notice Board
               </Link>

               <div className="pt-8 space-y-4">
                  <div className="px-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">System Configuration</div>
                  <Link
                     href="/ueadmin/settings/shipping"
                     prefetch={true}
                     className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
                  >
                     <SettingsIcon size={18} /> Shipping Settings
                  </Link>
<Link
                     href="/ueadmin/blog"
                     prefetch={true}
                     className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
                   >
                      <BookOpen size={18} /> Blog
                   </Link>
                  <Link
                    href="/ueadmin/email-test"
                    prefetch={true}
                     className="flex items-center gap-4 px-6 py-4 rounded-3xl hover:bg-black/5 text-slate-600 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-widest"
                  >
                     <Terminal size={18} /> Email Test
                  </Link>
               </div>
           </div>
        </nav>

       <div className="p-6 bg-black/[0.02] rounded-[2rem] border border-black/5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center font-black text-[10px]">P</div>
             <div className="min-w-0">
                 <div className="font-black text-[10px] uppercase tracking-tighter truncate">{session?.email}</div>
                 <div className="text-[8px] font-bold text-slate-600 uppercase">{session?.role}</div>
             </div>
          </div>
       </div>
    </aside>
  );
}
