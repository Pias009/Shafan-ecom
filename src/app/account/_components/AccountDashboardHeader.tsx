"use client";

import { useLanguageStore } from "@/lib/language-store";
import { translations } from "@/lib/translations";

export function AccountDashboardHeader() {
  const { currentLanguage } = useLanguageStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  return (
    <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-black italic">
            {t.account.dashboard}
        </h1>
        <p className="mt-2 text-sm text-black/40 font-bold uppercase tracking-widest">
            {t.account.manageSubtitle}
        </p>
    </div>
  );
}
