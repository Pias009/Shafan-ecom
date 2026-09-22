import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";
import {
  getVATDeliverySettings,
  mergeVATDeliverySettings,
  VAT_DELIVERY_SETTINGS_TYPE,
} from "@/lib/vat-delivery-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminApiSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getVATDeliverySettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Error fetching VAT/delivery settings:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load VAT/delivery settings" },
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
    const settings = mergeVATDeliverySettings(body);

    await (prisma as any).appSettings.upsert({
      where: { type: VAT_DELIVERY_SETTINGS_TYPE },
      update: { data: settings },
      create: { type: VAT_DELIVERY_SETTINGS_TYPE, data: settings },
    });

    return NextResponse.json({
      success: true,
      message: "VAT & delivery settings updated",
      settings,
    });
  } catch (error: any) {
    console.error("Error saving VAT/delivery settings:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save VAT/delivery settings" },
      { status: 500 }
    );
  }
}
