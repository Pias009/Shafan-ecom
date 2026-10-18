import Link from "next/link";
import type { ReactNode } from "react";

export const btn = {
  primary:
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50",
  secondary:
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-50",
  danger:
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-700 disabled:pointer-events-none disabled:opacity-50",
  ghost:
    "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
};

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className = "",
  bodyClassName = "p-5",
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-900">
      {children}
    </Link>
  );
}

const TONES = {
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  violet: "bg-violet-50 text-violet-700 ring-violet-200",
  cyan: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  orange: "bg-orange-50 text-orange-800 ring-orange-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
} as const;

export type Tone = keyof typeof TONES;

export function Badge({ tone = "gray", dot = false, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export const ORDER_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "Pending", tone: "gray" },
  ORDER_RECEIVED: { label: "Received", tone: "amber" },
  ORDER_CONFIRMED: { label: "Confirmed", tone: "blue" },
  PROCESSING: { label: "Processing", tone: "indigo" },
  READY_FOR_PICKUP: { label: "Ready for pickup", tone: "violet" },
  ORDER_PICKED_UP: { label: "Picked up", tone: "orange" },
  IN_TRANSIT: { label: "In transit", tone: "cyan" },
  DELIVERED: { label: "Delivered", tone: "green" },
  CANCELLED: { label: "Cancelled", tone: "red" },
  REFUNDED: { label: "Refunded", tone: "gray" },
};

export const PAYMENT_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  PAID: { label: "Paid", tone: "green" },
  PENDING: { label: "Pending", tone: "amber" },
  UNPAID: { label: "Unpaid", tone: "red" },
  CANCELLED: { label: "Cancelled", tone: "red" },
  REFUNDED: { label: "Refunded", tone: "gray" },
  FAILED: { label: "Failed", tone: "red" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const meta = ORDER_STATUS_META[status] || { label: status.replace(/_/g, " ").toLowerCase(), tone: "gray" as Tone };
  return <Badge tone={meta.tone} dot>{meta.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string | null | undefined }) {
  const meta = (status && PAYMENT_STATUS_META[status]) || { label: status || "Unknown", tone: "gray" as Tone };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      {icon && <div className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-500">{icon}</div>}
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function formatMoney(amount: number | null | undefined, currency?: string | null) {
  const code = (currency || "AED").toUpperCase();
  const decimals = ["KWD", "BHD", "OMR"].includes(code) ? 3 : 2;
  return `${code} ${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export function initials(name?: string | null, email?: string | null) {
  const src = (name || email || "A").trim();
  const parts = src.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] || "A") + (parts[1]?.[0] || "")).toUpperCase();
}
