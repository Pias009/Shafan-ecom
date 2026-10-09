import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";
import {
  getPickupSettings,
  mergePickupSettings,
  PICKUP_SETTINGS_TYPE,
} from "@/lib/pickup-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getPickupSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Error fetching pickup settings:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load pickup settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const settings = mergePickupSettings(body);

    await prisma.appSettings.upsert({
      where: { type: PICKUP_SETTINGS_TYPE },
      update: { data: settings as any },
      create: { type: PICKUP_SETTINGS_TYPE, data: settings as any },
    });

    return NextResponse.json({
      success: true,
      message: "Pickup settings updated",
      settings,
    });
  } catch (error: any) {
    console.error("Error saving pickup settings:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save pickup settings" },
      { status: 500 }
    );
  }
}
