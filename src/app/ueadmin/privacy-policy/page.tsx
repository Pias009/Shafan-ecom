"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, Eye, EyeOff, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Badge, Card, PageHeader, btn } from "../_components/ui";
import type { PolicySection, PrivacyPolicy, SectionTone } from "@/lib/privacy-policy";

// `key` is a client-only React key; `id` ("" for new sections) is the public anchor the server assigns.
type DraftSection = PolicySection & { key: string };
type Draft = Omit<PrivacyPolicy, "sections"> & { sections: DraftSection[] };
type Confirm = { kind: "section"; index: number } | { kind: "reset" } | null;

const input =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200";
const label = "mb-1.5 block text-xs font-medium text-slate-600";

let keySeq = 0;
const newKey = () => `s${++keySeq}`;

function toDraft(policy: PrivacyPolicy): Draft {
  return { ...policy, sections: policy.sections.map((s) => ({ ...s, key: newKey() })) };
}

function toPayload(draft: Draft): PrivacyPolicy {
  return {
    ...draft,
    sections: draft.sections.map((s) => ({
      id: s.id,
      title: s.title,
      intro: s.intro,
      items: s.items,
      note: s.note,
      tone: s.tone,
      visible: s.visible,
    })),
  };
}

const today = () => new Date().toISOString().slice(0, 10);

const TONES: { value: SectionTone; label: string }[] = [
  { value: "default", label: "Standard (white card)" },
  { value: "highlight", label: "Highlighted (green card)" },
  { value: "muted", label: "Subtle (grey card)" },
];

export default function PrivacyPolicyAdminPage() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const dirty = !!draft && JSON.stringify(toPayload(draft)) !== saved;

  const apply = useCallback((policy: PrivacyPolicy, fromDefault: boolean) => {
    setDraft(toDraft(policy));
    setSaved(JSON.stringify(policy));
    setIsDefault(fromDefault);
  }, []);

  useEffect(() => {
    fetch("/api/admin/privacy-policy")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        apply(data.policy, data.isDefault);
      })
      .catch((e) => toast.error(e.message || "Failed to load privacy policy"))
      .finally(() => setLoading(false));
  }, [apply]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const updateSection = (index: number, patch: Partial<PolicySection>) =>
    setDraft((d) => (d ? { ...d, sections: d.sections.map((s, i) => (i === index ? { ...s, ...patch } : s)) } : d));
  const moveSection = (index: number, dir: -1 | 1) =>
    setDraft((d) => {
      if (!d) return d;
      const target = index + dir;
      if (target < 0 || target >= d.sections.length) return d;
      const sections = [...d.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...d, sections };
    });

  function addSection() {
    const key = newKey();
    setDraft((d) =>
      d
        ? {
            ...d,
            sections: [
              ...d.sections,
              { key, id: "", title: "New section", intro: "", items: [], note: "", tone: "default", visible: true },
            ],
          }
        : d
    );
    setOpen(key);
  }

  async function save() {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/privacy-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(draft)),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      apply(data.policy, false);
      setOpen(null);
      toast.success("Privacy policy saved — the live page is updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function confirmAction() {
    if (!confirm || !draft) return;
    if (confirm.kind === "section") {
      const title = draft.sections[confirm.index]?.title;
      setDraft({ ...draft, sections: draft.sections.filter((_, i) => i !== confirm.index) });
      setConfirm(null);
      toast.success(`"${title}" removed — save to publish`);
      return;
    }
    setConfirm(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/privacy-policy", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset");
      apply(data.policy, true);
      setOpen(null);
      toast.success("Saved policy deleted — the default text is live again");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to reset");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !draft) {
    return <div className="py-20 text-center text-sm text-slate-500">{loading ? "Loading privacy policy…" : "Could not load the privacy policy."}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <Toaster position="top-right" />
      <PageHeader
        title="Privacy policy"
        description={
          <>
            Edit what customers see on{" "}
            <Link href="/privacy" target="_blank" className="font-medium text-slate-700 underline underline-offset-2">
              /privacy
            </Link>
            . Changes go live as soon as you save.
          </>
        }
        actions={
          <>
            <Link href="/privacy" target="_blank" className={btn.secondary}>
              <ExternalLink className="h-4 w-4" /> View page
            </Link>
            <button type="button" onClick={save} disabled={!dirty || saving} className={btn.primary}>
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      />

      {isDefault && (
        <p className="mb-5 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          The page is showing the built-in default text. Edit anything below and save to replace it.
        </p>
      )}

      <Card title="Page header" className="mb-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="pp-title">Page title</label>
            <input id="pp-title" className={input} value={draft.title} maxLength={200} onChange={(e) => update({ title: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="pp-subtitle">Subtitle</label>
            <textarea id="pp-subtitle" rows={2} className={input} value={draft.subtitle} maxLength={2000} onChange={(e) => update({ subtitle: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="pp-updated">Last updated</label>
            <div className="flex gap-2">
              <input id="pp-updated" type="date" className={input} value={draft.lastUpdated} onChange={(e) => update({ lastUpdated: e.target.value })} />
              <button type="button" className={btn.secondary} onClick={() => update({ lastUpdated: today() })}>
                Today
              </button>
            </div>
          </div>
          <div>
            <label className={label} htmlFor="pp-email">Privacy contact email (optional)</label>
            <input
              id="pp-email"
              type="email"
              className={input}
              placeholder="privacy@example.com"
              value={draft.contactEmail}
              onChange={(e) => update({ contactEmail: e.target.value })}
            />
          </div>
        </div>
      </Card>

      <Card
        title={`Sections (${draft.sections.length})`}
        description="Reorder with the arrows, hide a section without deleting it, or open one to edit."
        action={
          <button type="button" onClick={addSection} className={btn.secondary}>
            <Plus className="h-4 w-4" /> Add section
          </button>
        }
        bodyClassName="divide-y divide-slate-100"
      >
        {draft.sections.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate-500">No sections yet. Add one to get started.</p>
        )}
        {draft.sections.map((section, i) => {
          const isOpen = open === section.key;
          return (
            <div key={section.key} className={section.visible ? "" : "bg-slate-50/70"}>
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : section.key)}
                  aria-expanded={isOpen}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-slate-600">
                    {i + 1}
                  </span>
                  <span className={`truncate text-sm font-medium ${section.visible ? "text-slate-900" : "text-slate-400"}`}>
                    {section.title || "Untitled section"}
                  </span>
                  {!section.visible && <Badge tone="gray">Hidden</Badge>}
                  {section.tone === "highlight" && <Badge tone="green">Highlighted</Badge>}
                  <ChevronDown className={`ml-auto h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <div className="flex shrink-0 items-center">
                  <button type="button" className={btn.ghost} onClick={() => moveSection(i, -1)} disabled={i === 0} aria-label={`Move "${section.title}" up`}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={btn.ghost}
                    onClick={() => moveSection(i, 1)}
                    disabled={i === draft.sections.length - 1}
                    aria-label={`Move "${section.title}" down`}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={btn.ghost}
                    onClick={() => updateSection(i, { visible: !section.visible })}
                    aria-label={section.visible ? `Hide "${section.title}"` : `Show "${section.title}"`}
                    title={section.visible ? "Hide from page" : "Show on page"}
                  >
                    {section.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    className={`${btn.ghost} hover:bg-rose-50 hover:text-rose-600`}
                    onClick={() => setConfirm({ kind: "section", index: i })}
                    aria-label={`Delete "${section.title}"`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="grid gap-4 px-5 pb-5 pt-1 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor={`${section.key}-title`}>Section title</label>
                    <input
                      id={`${section.key}-title`}
                      className={input}
                      value={section.title}
                      maxLength={200}
                      onChange={(e) => updateSection(i, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor={`${section.key}-tone`}>Style</label>
                    <select
                      id={`${section.key}-tone`}
                      className={input}
                      value={section.tone}
                      onChange={(e) => updateSection(i, { tone: e.target.value as SectionTone })}
                    >
                      {TONES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label} htmlFor={`${section.key}-intro`}>Intro paragraph</label>
                    <textarea
                      id={`${section.key}-intro`}
                      rows={3}
                      className={input}
                      value={section.intro}
                      maxLength={2000}
                      onChange={(e) => updateSection(i, { intro: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label} htmlFor={`${section.key}-items`}>Bullet points — one per line</label>
                    <textarea
                      id={`${section.key}-items`}
                      rows={Math.max(3, section.items.length + 1)}
                      className={`${input} font-mono text-[13px]`}
                      value={section.items.join("\n")}
                      onChange={(e) => updateSection(i, { items: e.target.value.split("\n") })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={label} htmlFor={`${section.key}-note`}>Note box (optional)</label>
                    <textarea
                      id={`${section.key}-note`}
                      rows={2}
                      className={input}
                      value={section.note}
                      maxLength={2000}
                      onChange={(e) => updateSection(i, { note: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>

      <div className="mt-8 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Delete saved policy</p>
          <p className="text-xs text-slate-500">Removes everything saved here and puts the built-in default text back on the page.</p>
        </div>
        <button type="button" className={btn.danger} onClick={() => setConfirm({ kind: "reset" })} disabled={isDefault || saving}>
          <RotateCcw className="h-4 w-4" /> Reset to default
        </button>
      </div>

      {/* Sticky save bar while there are unsaved edits */}
      {dirty && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm text-slate-600">You have unsaved changes.</p>
            <div className="flex gap-2">
              <button type="button" className={btn.secondary} onClick={() => apply(JSON.parse(saved), isDefault)} disabled={saving}>
                Discard
              </button>
              <button type="button" className={btn.primary} onClick={save} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="pp-confirm-title">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 id="pp-confirm-title" className="text-base font-semibold text-slate-900">
              {confirm.kind === "reset" ? "Reset to the default policy?" : `Delete "${draft.sections[confirm.index]?.title}"?`}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {confirm.kind === "reset"
                ? "Your saved policy is deleted and the default text goes live immediately. This can't be undone."
                : "The section is removed from the editor. It disappears from the live page when you save."}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className={btn.secondary} onClick={() => setConfirm(null)} autoFocus>
                Cancel
              </button>
              <button type="button" className={btn.danger} onClick={confirmAction}>
                {confirm.kind === "reset" ? "Reset" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
