import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerAuthSession();
  const isAdmin = session && ["ADMIN", "SUPERADMIN"].includes((session.user as any)?.role);
  
  if (!session || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await prisma.appSettings.findFirst({
      where: { type: "contact" }
    });

    return NextResponse.json(settings?.data || {});
  } catch (error) {
    console.error("Get contact settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerAuthSession();
  const isAdmin = session && ["ADMIN", "SUPERADMIN"].includes((session.user as any)?.role);
  
  if (!session || !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    const existing = await prisma.appSettings.findFirst({
      where: { type: "contact" }
    });

    if (existing) {
      await prisma.appSettings.update({
        where: { id: existing.id },
        data: { data }
      });
    } else {
      await prisma.appSettings.create({
        data: {
          type: "contact",
          data
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save contact settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}