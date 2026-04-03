import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

// GET single skin tone by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminApiSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const skinTone = await prisma.skinTone.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!skinTone) {
      return NextResponse.json(
        { error: "Skin tone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(skinTone);
  } catch (error) {
    console.error("Error fetching skin tone:", error);
    return NextResponse.json(
      { error: "Failed to fetch skin tone" },
      { status: 500 }
    );
  }
}

// PUT update skin tone
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminApiSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, hexColor } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Skin tone name is required" },
        { status: 400 }
      );
    }

    // Check if skin tone exists
    const existingSkinTone = await prisma.skinTone.findUnique({
      where: { id },
    });

    if (!existingSkinTone) {
      return NextResponse.json(
        { error: "Skin tone not found" },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another skin tone
    const nameConflict = await prisma.skinTone.findUnique({
      where: { name },
    });

    if (nameConflict && nameConflict.id !== id) {
      return NextResponse.json(
        { error: "Another skin tone with this name already exists" },
        { status: 409 }
      );
    }

    const updatedSkinTone = await prisma.skinTone.update({
      where: { id },
      data: {
        name,
        description,
        hexColor,
      },
    });

    return NextResponse.json(updatedSkinTone);
  } catch (error) {
    console.error("Error updating skin tone:", error);
    return NextResponse.json(
      { error: "Failed to update skin tone" },
      { status: 500 }
    );
  }
}

// DELETE skin tone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAdminApiSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if skin tone exists
    const skinTone = await prisma.skinTone.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!skinTone) {
      return NextResponse.json(
        { error: "Skin tone not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if skin tone has products
    if (skinTone._count.products > 0) {
      return NextResponse.json(
        { error: "Cannot delete skin tone with associated products" },
        { status: 400 }
      );
    }

    await prisma.skinTone.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Skin tone deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting skin tone:", error);
    return NextResponse.json(
      { error: "Failed to delete skin tone" },
      { status: 500 }
    );
  }
}