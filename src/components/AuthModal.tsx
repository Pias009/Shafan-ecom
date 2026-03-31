"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Globe } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useLanguageStore } from "@/lib/language-store";
import { useCurrencyStore, SUPPORTED_CURRENCIES } from "@/lib/currency-store";
import { translations } from "@/lib/translations";

type Mode = "sign-in" | "sign-up";

// Shared country list for Saudi/Kuwait/etc.
const COUNTRIES = [
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "KW", name: "Kuwait", currency: "KWD" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR" },
  { code: "BH", name: "Bahrain", currency: "BHD" },
  { code: "QA", name: "Qatar", currency: "QAR" },
  { code: "OM", name: "Oman", currency: "OMR" },
  { code: "US", name: "United States", currency: "USD" },
];

export function AuthModal({
  open,
  onClose,
  defaultMode = "sign-in",
}: {
  open: boolean;
  onClose: () => void;
  defaultMode?: Mode;
}) {
  const { data: session, status } = useSession();
  const { currentLanguage } = useLanguageStore();
  
  // Don't show modal if user is admin
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPERADMIN";
  if (isAdmin) return null;
  const { currentCurrency, setCurrency } = useCurrencyStore();
  const t = translations[currentLanguage.code as keyof typeof translations];

  const [mode, setMode] = useState<Mode>(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-detect based on current currency code
  useEffect(() => {
    if (!open) return;
    if (mode === "sign-up" && !country) {
        const found = COUNTRIES.find(c => c.currency === currentCurrency.code);
        if (found) setCountry(found.name);
    }
  }, [open, mode, currentCurrency.code, country]);

  useEffect(() => {
    if (!open) return;
    setMode(defaultMode);
    setError(null);
    setLoading(false);
  }, [open, defaultMode]);

  useEffect(() => {
    if (status === "authenticated" && open) onClose();
  }, [status, open, onClose]);

  const title = useMemo(() => {
    return mode === "sign-in" ? t.auth.signIn : t.auth.signUp;
  }, [mode, t.auth.signIn, t.auth.signUp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "sign-up") {
        const r = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password, country }),
        });
        if (!r.ok) {
          const msg = (await r.json().catch(() => null)) as { error?: string } | null;
          throw new Error(msg?.error ?? "Registration failed.");
        }
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) throw new Error("Invalid email or password.");

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="bg-white shadow-2xl relative w-full max-w-md overflow-hidden rounded-3xl border border-black"
          >
            <div className="flex items-center justify-between gap-3 border-b border-black px-6 py-4">
              <div className="text-xl font-bold tracking-tight text-black">{title}</div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-black hover:bg-black/20 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("sign-in")}
                  className={`h-10 rounded-2xl text-sm font-bold transition-all ${
                    mode === "sign-in"
                      ? "bg-black text-white shadow-lg"
                      : "bg-black/5 text-black/60 hover:bg-black/10"
                  }`}
                >
                    {t.auth.signIn}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("sign-up")}
                  className={`h-10 rounded-2xl text-sm font-bold transition-all ${
                    mode === "sign-up"
                      ? "bg-black text-white shadow-lg"
                      : "bg-black/5 text-black/60 hover:bg-black/10"
                  }`}
                >
                  {t.auth.signUp}
                </button>
              </div>

              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                {mode === "sign-up" && (
                  <>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      type="text"
                      placeholder={t.auth.name}
                      className="h-11 w-full rounded-2xl bg-white border border-black px-4 text-sm font-semibold text-black placeholder:text-black/60 outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                    
                    <div className="relative group z-50">
                        <Globe size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/60 group-focus-within:text-black transition-colors" />
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            required
                            className="h-11 w-full rounded-2xl bg-white border border-black pl-10 pr-4 text-sm font-semibold text-black outline-none focus:ring-2 focus:ring-black appearance-none relative"
                        >
                            <option value="" disabled>{t.auth.selectCountry}</option>
                            {COUNTRIES.map(c => (
                                <option key={c.code} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                  </>
                )}

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder={t.auth.email}
                  className="h-11 w-full rounded-2xl bg-white border border-black px-4 text-sm font-semibold text-black placeholder:text-black/60 outline-none focus:ring-2 focus:ring-black"
                  required
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder={t.auth.password}
                  className="h-11 w-full rounded-2xl bg-white border border-black px-4 text-sm font-semibold text-black placeholder:text-black/60 outline-none focus:ring-2 focus:ring-black"
                  required
                  minLength={6}
                />

                {mode === "sign-in" && (
                  <div className="flex justify-end -mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.location.href = "/auth/forgot-password";
                      }}
                      className="text-[10px] font-bold text-black/40 hover:text-black transition-colors"
                    >
                      {t.auth.forgotPassword}
                    </button>
                  </div>
                )}

                {error ? <div className="text-sm text-red-600 font-medium">{error}</div> : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
                >
                  {loading ? t.auth.pleaseWait : mode === "sign-in" ? t.auth.signIn : t.auth.createAccount}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button 
                    onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
                    className="text-xs font-bold text-black/40 hover:text-black transition-colors"
                >
                    {mode === "sign-in" ? t.auth.noAccount : t.auth.hasAccount}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
