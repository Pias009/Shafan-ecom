import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

// Privacy policy content for /privacy, edited at /ueadmin/privacy-policy.
// Stored as one AppSettings row; until an admin saves, DEFAULT_PRIVACY_POLICY is shown.

export const PRIVACY_SETTINGS_TYPE = "privacy_policy";
const CACHE_TAG = "privacy-policy";

export type SectionTone = "default" | "highlight" | "muted";

export interface PolicySection {
  id: string;
  title: string;
  intro: string;
  items: string[];
  note: string;
  tone: SectionTone;
  visible: boolean;
}

export interface PrivacyPolicy {
  title: string;
  subtitle: string;
  lastUpdated: string; // YYYY-MM-DD
  contactEmail: string;
  sections: PolicySection[];
}

export const DEFAULT_PRIVACY_POLICY: PrivacyPolicy = {
  title: "Privacy & Security Policy",
  subtitle: "We are committed to protecting your personal data and ensuring a safe shopping experience.",
  lastUpdated: "2026-11-05",
  contactEmail: "",
  sections: [
    {
      id: "information-we-collect",
      title: "Information We Collect",
      intro: "We may collect the following information:",
      items: [
        "Name, phone number, email address",
        "Billing and shipping address",
        "Order and transaction details",
        "Device and browser information (IP address, cookies)",
      ],
      note: "",
      tone: "default",
      visible: true,
    },
    {
      id: "how-we-use-your-information",
      title: "How We Use Your Information",
      intro: "We use your data to:",
      items: [
        "Process and deliver orders",
        "Provide customer support",
        "Improve website performance",
        "Prevent fraud and unauthorized activity",
      ],
      note: "",
      tone: "default",
      visible: true,
    },
    {
      id: "data-protection",
      title: "Data Protection",
      intro: "We implement strict security measures to protect your data from:",
      items: ["Unauthorized access", "Misuse or alteration", "Loss or disclosure"],
      note: "However, no online system is 100% secure.",
      tone: "highlight",
      visible: true,
    },
    {
      id: "cookies",
      title: "Cookies",
      intro: "Our website uses cookies to:",
      items: ["Improve user experience", "Remember login and preferences", "Enhance checkout process"],
      note: "You may disable cookies in your browser settings.",
      tone: "default",
      visible: true,
    },
    {
      id: "data-sharing",
      title: "Data Sharing",
      intro: "We do not sell or rent personal data. We may share limited information with:",
      items: ["Payment gateways", "Delivery partners", "Fraud prevention services"],
      note: "",
      tone: "default",
      visible: true,
    },
    {
      id: "your-rights",
      title: "Your Rights",
      intro: "You may request:",
      items: ["Access to your personal data", "Correction or deletion of data", "Export of stored information"],
      note: "",
      tone: "default",
      visible: true,
    },
    {
      id: "third-party-services",
      title: "Third-Party Services",
      intro:
        "External embedded content (e.g., videos or links) may collect data according to their own privacy policies.",
      items: [],
      note: "",
      tone: "muted",
      visible: true,
    },
  ],
};

const LIMITS = { sections: 40, items: 50, short: 200, long: 2000, item: 500 };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "section"
  );
}

/** Validates and normalises an admin-submitted policy. */
export function parsePrivacyPolicy(raw: unknown): { data: PrivacyPolicy } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "Invalid policy" };
  const body = raw as Record<string, unknown>;

  const title = str(body.title, LIMITS.short);
  if (!title) return { error: "Page title is required" };

  const lastUpdated = str(body.lastUpdated, 10);
  if (lastUpdated && !/^\d{4}-\d{2}-\d{2}$/.test(lastUpdated)) return { error: "Invalid 'last updated' date" };

  const contactEmail = str(body.contactEmail, LIMITS.short);
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { error: "Invalid contact email" };

  if (!Array.isArray(body.sections)) return { error: "Sections are missing" };
  if (body.sections.length > LIMITS.sections) return { error: `At most ${LIMITS.sections} sections` };

  const seen = new Set<string>();
  const sections: PolicySection[] = [];
  for (const [i, rawSection] of body.sections.entries()) {
    const s = (rawSection || {}) as Record<string, unknown>;
    const sectionTitle = str(s.title, LIMITS.short);
    if (!sectionTitle) return { error: `Section ${i + 1} needs a title` };

    const items = (Array.isArray(s.items) ? s.items : [])
      .map((item) => str(item, LIMITS.item))
      .filter(Boolean);
    if (items.length > LIMITS.items) return { error: `"${sectionTitle}": at most ${LIMITS.items} points` };

    // Ids double as page anchors (#data-sharing), so keep them unique and URL-safe.
    let id = slugify(str(s.id, 60) || sectionTitle);
    while (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);

    sections.push({
      id,
      title: sectionTitle,
      intro: str(s.intro, LIMITS.long),
      items,
      note: str(s.note, LIMITS.long),
      tone: s.tone === "highlight" || s.tone === "muted" ? s.tone : "default",
      visible: s.visible !== false,
    });
  }

  return {
    data: { title, subtitle: str(body.subtitle, LIMITS.long), lastUpdated, contactEmail, sections },
  };
}

/** Stored policy, or null when the admin hasn't saved one yet. */
export async function getStoredPrivacyPolicy(): Promise<PrivacyPolicy | null> {
  const row = await prisma.appSettings.findUnique({ where: { type: PRIVACY_SETTINGS_TYPE } });
  if (!row) return null;
  const parsed = parsePrivacyPolicy(row.data);
  return "data" in parsed ? parsed.data : null;
}

/** Policy for the public page (cached; falls back to the default text). */
export const getPrivacyPolicy = unstable_cache(
  async (): Promise<PrivacyPolicy> => {
    try {
      return (await getStoredPrivacyPolicy()) ?? DEFAULT_PRIVACY_POLICY;
    } catch (error) {
      console.error("Privacy policy fetch error:", error);
      return DEFAULT_PRIVACY_POLICY;
    }
  },
  ["privacy-policy"],
  { revalidate: 3600, tags: [CACHE_TAG] }
);

export function bustPrivacyPolicyCache() {
  revalidateTag(CACHE_TAG, { expire: 0 });
}
