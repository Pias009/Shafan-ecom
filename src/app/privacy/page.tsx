import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, Info, Mail, ShieldCheck } from "lucide-react";
import { getPrivacyPolicy, type PolicySection } from "@/lib/privacy-policy";

// Content is edited at /ueadmin/privacy-policy; saving there revalidates this page.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy & Security Policy | SHANFA",
  description: "SHANFA Privacy & Security Policy - How we collect, use, and protect your data.",
};

function formatDate(iso: string) {
  if (!iso) return "";
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

const TONE_STYLES: Record<PolicySection["tone"], { card: string; check: string; note: string }> = {
  default: {
    card: "bg-white border-black/[0.06]",
    check: "bg-black text-white",
    note: "bg-amber-50 border-amber-200/70 text-amber-900",
  },
  highlight: {
    card: "bg-emerald-50/70 border-emerald-200",
    check: "bg-emerald-600 text-white",
    note: "bg-white border-emerald-200 text-emerald-900",
  },
  muted: {
    card: "bg-black/[0.03] border-transparent",
    check: "bg-black/70 text-white",
    note: "bg-white border-black/10 text-black/70",
  },
};

function TableOfContents({ sections }: { sections: PolicySection[] }) {
  return (
    <ol className="space-y-1">
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="group flex items-baseline gap-3 rounded-lg px-3 py-2 text-sm text-black/60 transition-colors hover:bg-black/[0.04] hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
          >
            <span className="w-5 shrink-0 text-xs font-bold tabular-nums text-black/30 group-hover:text-black/60">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-medium">{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export default async function PrivacyPage() {
  const policy = await getPrivacyPolicy();
  const sections = policy.sections.filter((s) => s.visible);
  const updated = formatDate(policy.lastUpdated);

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero */}
      <header className="relative overflow-hidden bg-black text-white">
        <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.06] blur-2xl" />
        <div aria-hidden className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8 md:px-8 md:pb-20 md:pt-12">
          <Link
            href="/"
            className="mb-8 inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} className="rtl:rotate-180" /> Back to Home
          </Link>
          <div className="flex items-start gap-4">
            <span className="mt-1 hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 sm:flex">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-4xl font-black tracking-tight md:text-5xl">{policy.title}</h1>
              {policy.subtitle && (
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70">{policy.subtitle}</p>
              )}
              {updated && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                  Last updated {updated}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8 md:py-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          {/* Table of contents: collapsible on mobile, sticky on desktop */}
          {sections.length > 1 && (
            <nav aria-label="On this page" className="lg:col-span-4 xl:col-span-3">
              <details className="group rounded-2xl border border-black/[0.06] bg-white p-2 lg:hidden">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-xs font-black uppercase tracking-widest text-black">
                  On this page
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="pt-1">
                  <TableOfContents sections={sections} />
                </div>
              </details>
              <div className="hidden lg:block">
                <p className="mb-3 px-3 text-[11px] font-black uppercase tracking-widest text-black/40">On this page</p>
                <TableOfContents sections={sections} />
              </div>
            </nav>
          )}

          <div className={sections.length > 1 ? "lg:col-span-8 xl:col-span-9" : "lg:col-span-12"}>
            <div className="space-y-6 md:space-y-8">
              {sections.map((section, i) => {
                const tone = TONE_STYLES[section.tone];
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    aria-labelledby={`${section.id}-title`}
                    className={`scroll-mt-28 rounded-3xl border p-6 md:p-8 ${tone.card}`}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black text-xs font-black tabular-nums text-white">
                        {i + 1}
                      </span>
                      <h2 id={`${section.id}-title`} className="text-lg font-black text-black md:text-xl">
                        {section.title}
                      </h2>
                    </div>

                    {section.intro && (
                      <p className="whitespace-pre-line text-[15px] leading-relaxed text-black/70">{section.intro}</p>
                    )}

                    {section.items.length > 0 && (
                      <ul className={`grid gap-2.5 sm:grid-cols-2 ${section.intro ? "mt-5" : ""}`}>
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 rounded-xl bg-black/[0.03] p-3">
                            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tone.check}`}>
                              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                            </span>
                            <span className="text-sm font-medium leading-relaxed text-black">{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.note && (
                      <p className={`mt-5 flex items-start gap-2.5 rounded-xl border p-3.5 text-sm leading-relaxed ${tone.note}`}>
                        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span className="whitespace-pre-line">{section.note}</span>
                      </p>
                    )}
                  </section>
                );
              })}

              {/* Contact */}
              <section className="flex flex-col gap-5 rounded-3xl bg-black p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
                <div>
                  <h2 className="text-lg font-black">Questions about your privacy?</h2>
                  <p className="mt-1 text-sm text-white/70">
                    Contact us to access, correct or delete your data, or with any privacy concern.
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  {policy.contactEmail && (
                    <a
                      href={`mailto:${policy.contactEmail}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-xs font-black uppercase tracking-widest text-black transition hover:bg-white/90"
                    >
                      <Mail className="h-4 w-4" aria-hidden /> Email us
                    </a>
                  )}
                  <Link
                    href="/contact"
                    className="inline-flex min-h-11 items-center rounded-full border border-white/30 px-5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-white/10"
                  >
                    Contact page
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
