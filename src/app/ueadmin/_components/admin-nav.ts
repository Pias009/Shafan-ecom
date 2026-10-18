import {
  LayoutDashboard, LineChart, Sparkles, ShoppingBag, Package, Tag, Layers, FolderTree, Users,
  Home, Gift, Zap, Leaf, Flame, Palette, Image as ImageIcon, GalleryHorizontal, Megaphone,
  Bell, Percent, Mail, Activity, Truck, Receipt, ShoppingCart, Store, BookOpen, FlaskConical,
  ShieldCheck, UserCog, KeyRound, Boxes, ScanFace, Droplets, Brush, Plus, type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Extra words the command palette should match. */
  keywords?: string;
  superOnly?: boolean;
  /** Match only the exact path (for parents whose children are separate items). */
  exact?: boolean;
};

export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/ueadmin/dashboard", icon: LayoutDashboard, keywords: "home overview stats" },
      { label: "Analytics", href: "/ueadmin/analytics", icon: LineChart, keywords: "reports revenue traffic" },
      { label: "Agent Kira", href: "/ueadmin/kira", icon: Sparkles, keywords: "ai assistant chat operations" },
    ],
  },
  {
    title: "Commerce",
    items: [
      { label: "Orders", href: "/ueadmin/orders", icon: ShoppingBag, keywords: "sales fulfilment shipping" },
      { label: "Products", href: "/ueadmin/products", icon: Package, keywords: "catalog inventory stock" },
      { label: "Brands", href: "/ueadmin/brands", icon: Tag },
      { label: "Categories", href: "/ueadmin/categories", icon: Layers, exact: true },
      { label: "Sub-categories", href: "/ueadmin/sub-categories", icon: FolderTree },
      { label: "Skin tones", href: "/ueadmin/skin-tones", icon: Droplets },
      { label: "Customers", href: "/ueadmin/users", icon: Users, keywords: "users accounts" },
    ],
  },
  {
    title: "Storefront",
    items: [
      { label: "Homepage sections", href: "/ueadmin/home-sections", icon: Home, keywords: "add new on homepage" },
      { label: "Offer sections", href: "/ueadmin/offer-sections", icon: Gift },
      { label: "Flash sales", href: "/ueadmin/flash-sales", icon: Zap },
      { label: "Fresh from shelf", href: "/ueadmin/fresh-from-shelf", icon: Leaf },
      { label: "Trending now", href: "/ueadmin/trending", icon: Flame },
      { label: "Routine", href: "/ueadmin/routine", icon: Brush },
      { label: "Refresh your mind", href: "/ueadmin/rejuvenate-section", icon: Sparkles, keywords: "rejuvenate" },
      { label: "Herbal haircare", href: "/ueadmin/haircare-section", icon: Palette },
      { label: "Hero banners", href: "/ueadmin/banners", icon: ImageIcon, exact: true },
      { label: "Home banner", href: "/ueadmin/banners/home", icon: ImageIcon },
      { label: "Offer banners", href: "/ueadmin/banners/offers", icon: Megaphone },
      { label: "Product slider", href: "/ueadmin/banners/slider", icon: GalleryHorizontal },
      { label: "Product banners", href: "/ueadmin/banners/products", icon: ImageIcon },
      { label: "Notice board", href: "/ueadmin/notices", icon: Bell },
      { label: "Blog", href: "/ueadmin/blog", icon: BookOpen },
    ],
  },
  {
    title: "Marketing",
    items: [
      { label: "Discounts & coupons", href: "/ueadmin/discounts", icon: Percent, keywords: "offers promo codes" },
      { label: "Welcome subscribers", href: "/ueadmin/welcome-subscribers", icon: Mail, keywords: "newsletter leads" },
      { label: "Tracking & pixels", href: "/ueadmin/tracking", icon: Activity, keywords: "gtm meta google analytics" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Shipping", href: "/ueadmin/settings/shipping", icon: Truck, keywords: "couriers rates" },
      { label: "VAT & delivery", href: "/ueadmin/settings/vat-delivery", icon: Receipt, keywords: "tax minimum order" },
      { label: "Store pickup", href: "/ueadmin/settings/pickup", icon: Store },
      { label: "Email test", href: "/ueadmin/email-test", icon: FlaskConical },
    ],
  },
  {
    title: "Super admin",
    items: [
      { label: "Admin team", href: "/ueadmin/super/admins", icon: UserCog, superOnly: true, keywords: "invite roles" },
      { label: "Login approvals", href: "/ueadmin/super/approvals", icon: KeyRound, superOnly: true },
      { label: "Store inventory", href: "/ueadmin/super/inventory", icon: Boxes, superOnly: true },
      { label: "Face login", href: "/ueadmin/super/face", icon: ScanFace, superOnly: true },
      { label: "Security overview", href: "/ueadmin/super", icon: ShieldCheck, superOnly: true, exact: true },
    ],
  },
];

export const QUICK_ACTIONS: NavItem[] = [
  { label: "Create order", href: "/ueadmin/orders/create", icon: Plus, keywords: "new manual order" },
  { label: "Add product", href: "/ueadmin/products/add", icon: Plus, keywords: "new product" },
  { label: "Bulk edit products", href: "/ueadmin/products/bulk", icon: Package, keywords: "import" },
  { label: "New discount", href: "/ueadmin/discounts/new", icon: Percent, keywords: "coupon" },
  { label: "New homepage section", href: "/ueadmin/home-sections/new", icon: Home },
  { label: "New offer section", href: "/ueadmin/offer-sections/new", icon: Gift },
  { label: "Minimum order value", href: "/ueadmin/settings/vat-delivery#min-order", icon: ShoppingCart },
];

export function visibleGroups(isSuper: boolean): NavGroup[] {
  return NAV_GROUPS
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.superOnly || isSuper) }))
    .filter((g) => g.items.length > 0);
}

export function isActive(item: NavItem, pathname: string | null): boolean {
  if (!pathname) return false;
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

const ALL_ITEMS = [...NAV_GROUPS.flatMap((g) => g.items), ...QUICK_ACTIONS];

const SEGMENT_LABELS: Record<string, string> = {
  ueadmin: "Admin", add: "Add", new: "New", edit: "Edit", create: "Create", bulk: "Bulk edit",
  stats: "Stats", settings: "Settings", super: "Super admin", banners: "Banners",
};

/** Breadcrumb trail for the current path, using nav labels where they exist. */
export function breadcrumbsFor(pathname: string): { label: string; href: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  for (let i = 1; i < parts.length; i++) {
    const href = "/" + parts.slice(0, i + 1).join("/");
    const known = ALL_ITEMS.find((it) => it.href === href);
    const seg = decodeURIComponent(parts[i]);
    const label = known?.label
      ?? SEGMENT_LABELS[seg]
      ?? (/^[a-f0-9]{24}$/i.test(seg) ? `#${seg.slice(-8).toUpperCase()}` : seg.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase()));
    crumbs.push({ label, href });
  }
  return crumbs;
}
