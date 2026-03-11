"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

type Mode = "sign-in" | "sign-up";

export function AuthModal({
  open,
  onClose,
  defaultMode = "sign-in",
}: {
  open: boolean;
  onClose: () => void;
  defaultMode?: Mode;
}) {
  const { status } = useSession();
  const [mode, setMode] = useState<Mode>(defaultMode);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    return mode === "sign-in" ? "Sign in" : "Sign up";
  }, [mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "sign-up") {
        const r = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password }),
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
          className="fixed inset-0 z-[70] grid place-items-center p-4"
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
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="glass glass-3d ring-icy relative w-full max-w-md overflow-hidden rounded-3xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
              <div className="text-base font-semibold tracking-tight text-white">{title}</div>
              <button
                type="button"
                onClick={onClose}
                className="glass glass-3d ring-icy inline-flex h-10 w-10 items-center justify-center rounded-full text-white/85 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode("sign-in")}
                  className={`h-10 rounded-2xl text-sm font-semibold ring-1 ring-white/10 ${
                    mode === "sign-in"
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/85 hover:bg-white/10"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("sign-up")}
                  className={`h-10 rounded-2xl text-sm font-semibold ring-1 ring-white/10 ${
                    mode === "sign-up"
                      ? "bg-white text-black"
                      : "bg-white/5 text-white/85 hover:bg-white/10"
                  }`}
                >
                  Sign up
                </button>
              </div>

              <form onSubmit={onSubmit} className="mt-4 grid gap-3">
                {mode === "sign-up" ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder="Name"
                    className="h-11 w-full rounded-2xl bg-white/5 px-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 outline-none focus:ring-white/25"
                  />
                ) : null}

                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email"
                  className="h-11 w-full rounded-2xl bg-white/5 px-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 outline-none focus:ring-white/25"
                  required
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Password (min 6)"
                  className="h-11 w-full rounded-2xl bg-white/5 px-3 text-sm text-white placeholder:text-white/40 ring-1 ring-white/10 outline-none focus:ring-white/25"
                  required
                  minLength={6}
                />

                {error ? <div className="text-sm text-rose-200">{error}</div> : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-black shadow-lg shadow-black/20 transition hover:translate-y-[-1px] disabled:opacity-60"
                >
                  {loading ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

