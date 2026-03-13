import Link from "next/link";

export function Footer() {
  return (
    <footer className="glass-panel-heavy mt-20 border-t border-black/5">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-display text-2xl text-black mb-3">Shafan</h3>
            <p className="font-body text-sm text-black/70 leading-relaxed">
              Premium skincare crafted with nature&apos;s finest ingredients.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-body text-sm font-bold text-black uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {[
                { href: "/", label: "Home" },
                { href: "/products", label: "All Products" },
                { href: "/brands", label: "Brands" },
                { href: "/cart", label: "Cart" },
                { href: "/account", label: "Dashboard" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="w-fit font-body text-sm text-black/60 hover:text-black transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-body text-sm font-bold text-black uppercase tracking-wider mb-4">
              Contact
            </h4>
            <p className="font-body text-sm text-black/60">hello@shafan.com</p>
            <p className="font-body text-sm text-black/60 mt-1">
              Dhaka, Bangladesh
            </p>
          </div>
        </div>

        <div className="border-t border-black/5 mt-8 pt-6 text-center">
          <p className="font-body text-xs text-black/40">
            © 2026 Shafan. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
