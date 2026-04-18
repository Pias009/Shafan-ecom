"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, Package, Shield, LayoutDashboard, MapPin } from "lucide-react";
import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

export function AccountNav() {
  const pathname = usePathname();
  const { data } = useSession();
  const role = (data?.user as any)?.role;
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  let links = [
    { href: "/account", label: t.account.overview, icon: LayoutDashboard },
    { href: "/account/profile", label: t.account.profile, icon: User },
    { href: "/account/address", label: t.account.address, icon: MapPin },
    { href: "/account/orders", label: t.account.orders, icon: Package },
  ];
  
  if (!data?.user) {
    links = [
      { href: "/account", label: t.account.overview, icon: LayoutDashboard },
      { href: "/account/address", label: t.account.address, icon: MapPin },
    ];
  }

  return (
    <nav className="glass-panel-heavy border border-black/5 rounded-3xl p-1.5 md:p-4 h-fit shadow-xl w-full md:w-auto">
      <div className="hidden md:block mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-black/30">
        {t.account.settings}
      </div>
      <div className="flex md:flex-col gap-1.5 md:gap-1 overflow-x-auto md:overflow-visible pb-1.5 md:pb-0 w-full">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 md:gap-3 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 text-[10px] md:text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                isActive
                  ? "bg-black text-white shadow-lg shadow-black/20 md:translate-x-1"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
              }`}
            >
              <link.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
              <span className="md:hidden">{link.label.split(' ')[0]}</span>
              <span className="hidden md:inline">{link.label}</span>
            </Link>
          );
        })}
      </div>
      
      {(role === "ADMIN" || role === "SUPERADMIN") && (
        <Link
          href="/ueadmin"
          className={`mt-2 md:mt-4 flex items-center gap-2 md:gap-3 rounded-xl md:rounded-2xl px-3 md:px-4 py-2 text-xs md:text-sm font-bold transition-all border border-black/5 bg-black/[0.02] ${
            pathname?.startsWith("/ueadmin")
                ? "bg-black text-white"
                : "text-black/80 hover:bg-black/5"
          }`}
        >
          <Shield className="h-4 w-4 flex-shrink-0" />
          <span className="hidden md:inline">{t.account.adminPanel}</span>
          <span className="md:hidden">Admin</span>
        </Link>
      )}
    </nav>
  );
}
