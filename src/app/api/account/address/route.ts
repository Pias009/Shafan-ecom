import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const AddressSchema = z.object({
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(5).max(20),
  email: z.string().email().optional().or(z.literal("")),
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  address1: z.string().trim().min(1),
  address2: z.string().trim().optional(),
  postalCode: z.string().trim().optional().or(z.literal("")),
});

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
    const address = await prisma.address.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email || "",
        country: parsed.data.country,
        city: parsed.data.city,
        address1: parsed.data.address1,
        address2: parsed.data.address2 || "",
        postalCode: parsed.data.postalCode || "",
      },
      update: {
        fullName: parsed.data.fullName,
        phone: parsed.data.phone,
        email: parsed.data.email || "",
        country: parsed.data.country,
        city: parsed.data.city,
        address1: parsed.data.address1,
        address2: parsed.data.address2 || "",
        postalCode: parsed.data.postalCode || "",
      },
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
    return NextResponse.json(address || null);
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
