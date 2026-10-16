import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/admin/welcome-subscribers/[id] - Remove a footer sign-up.
// The address can then sign up again and will be emailed the current welcome code;
// past coupon redemptions are untouched, so a used code stays used.
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    await prisma.newsletterSubscriber.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting welcome subscriber:", error);
    return NextResponse.json({ error: "Failed to delete sign-up" }, { status: 500 });
  }
}
