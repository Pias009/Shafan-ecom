import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-session";
import {
  DEFAULT_PRIVACY_POLICY,
  PRIVACY_SETTINGS_TYPE,
  bustPrivacyPolicyCache,
  getStoredPrivacyPolicy,
  parsePrivacyPolicy,
} from "@/lib/privacy-policy";

function refreshPublicPage() {
  bustPrivacyPolicyCache();
  revalidatePath("/privacy");
}

// Current policy for the editor; `isDefault` means nothing has been saved yet.
export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const stored = await getStoredPrivacyPolicy();
    return NextResponse.json({ policy: stored ?? DEFAULT_PRIVACY_POLICY, isDefault: !stored });
  } catch (error) {
    console.error("Privacy policy load error:", error);
    return NextResponse.json({ error: "Failed to load privacy policy" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const parsed = parsePrivacyPolicy(await req.json().catch(() => null));
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const data = JSON.parse(JSON.stringify(parsed.data));
    await prisma.appSettings.upsert({
      where: { type: PRIVACY_SETTINGS_TYPE },
      create: { type: PRIVACY_SETTINGS_TYPE, data },
      update: { data },
    });
    refreshPublicPage();
    return NextResponse.json({ policy: parsed.data, isDefault: false });
  } catch (error) {
    console.error("Privacy policy save error:", error);
    return NextResponse.json({ error: "Failed to save privacy policy" }, { status: 500 });
  }
}

// Deletes the saved policy; the public page goes back to the default text.
export async function DELETE() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    await prisma.appSettings.deleteMany({ where: { type: PRIVACY_SETTINGS_TYPE } });
    refreshPublicPage();
    return NextResponse.json({ policy: DEFAULT_PRIVACY_POLICY, isDefault: true });
  } catch (error) {
    console.error("Privacy policy reset error:", error);
    return NextResponse.json({ error: "Failed to reset privacy policy" }, { status: 500 });
  }
}
