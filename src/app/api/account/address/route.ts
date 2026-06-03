import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AddressSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(5).max(20),
  email: z.string().email(),
  country: z.string().trim().min(1),
  // Support both new and legacy field names
  city: z.string().trim().optional(),
  city_name: z.string().trim().optional(),
  address1: z.string().trim().optional(),
  address2: z.string().trim().optional().or(z.literal("")),
  street_road: z.string().trim().optional(),
  house_building: z.string().trim().optional().or(z.literal("")),
  area_name: z.string().trim().optional(),
  postalCode: z.string().trim().optional().or(z.literal("")),
}).transform((data) => ({
  fullName: data.fullName,
  phone: data.phone,
  email: data.email || "",
  country: data.country,
  city: data.city_name || data.city || "",
  address1: data.street_road || data.address1 || "",
  address2: data.house_building || data.address2 || "",
  area_name: data.area_name || "",
  postalCode: data.postalCode || "",
}));

export async function PUT(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = AddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
  }

  try {
    const { area_name, ...prismaData } = parsed.data;
    const address = await prisma.address.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        ...prismaData,
      },
      update: prismaData,
    });

    return NextResponse.json({ ok: true, address });
  } catch (error) {
    console.error("Address update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const address = await prisma.address.findUnique({
      where: { userId: session.user.id },
    });
    if (address) {
      const { address1, address2, city, ...rest } = address;
      return NextResponse.json({
        ...rest,
        address1,
        address2: address2 || "",
        city,
        street_road: address1,
        house_building: address2 || "",
        city_name: city,
        area_name: (address as any).area_name || "",
      });
    }
    return NextResponse.json(null);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
