import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET all skin tones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skinTones = await prisma.skinTone.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(skinTones);
  } catch (error) {
    console.error("Error fetching skin tones:", error);
    return NextResponse.json(
      { error: "Failed to fetch skin tones" },
      { status: 500 }
    );
  }
}

// POST create new skin tone
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, hexColor } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Skin tone name is required" },
        { status: 400 }
      );
    }

    const existingSkinTone = await prisma.skinTone.findUnique({
      where: { name },
    });

    if (existingSkinTone) {
      return NextResponse.json(
        { error: "Skin tone with this name already exists" },
        { status: 409 }
      );
    }

    const skinTone = await prisma.skinTone.create({
      data: {
        name,
        description,
        hexColor,
      },
    });

    return NextResponse.json(skinTone, { status: 201 });
  } catch (error) {
    console.error("Error creating skin tone:", error);
    return NextResponse.json(
      { error: "Failed to create skin tone" },
      { status: 500 }
    );
  }
}