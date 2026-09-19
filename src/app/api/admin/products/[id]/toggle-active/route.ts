import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { id: true, active: true, name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: { active: !existing.active },
      select: { id: true, active: true, name: true },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
