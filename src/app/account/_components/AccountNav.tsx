"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { User, ShoppingCart, Package, Shield, LayoutDashboard, MapPin } from "lucide-react";

const links = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/address", label: "Address", icon: MapPin },
  { href: "/account/orders", label: "Orders", icon: Package },
];

export function AccountNav() {
  const pathname = usePathname();
  const { data } = useSession();
  const role = (data?.user as any)?.role;

  return (
    <nav className="glass-panel-heavy border border-black/5 grid gap-1 rounded-3xl p-4 h-fit sticky top-24 shadow-xl">
      <div className="mb-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-black/30">
        Account Settings
      </div>
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300 ${
              isActive
                ? "bg-black text-white shadow-lg shadow-black/20 translate-x-1"
                : "text-black/60 hover:bg-black/5 hover:text-black"
            }`}
          >
            <link.icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
            {link.label}
          </Link>
        );
      })}
      
      {(role === "ADMIN" || role === "SUPERADMIN") && (
        <Link
          href="/ueadmin"
          className={`mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all border border-black/5 bg-black/[0.02] ${
            pathname.startsWith("/ueadmin")
              ? "bg-black text-white"
              : "text-black/80 hover:bg-black/5"
          }`}
        >
          <Shield className="h-4 w-4" />
          Admin Panel
        </Link>
      )}
    </nav>
  );
}
