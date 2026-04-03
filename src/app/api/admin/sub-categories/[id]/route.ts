import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

// GET single sub-category by ID
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

    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!subCategory) {
      return NextResponse.json(
        { error: "Sub-category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(subCategory);
  } catch (error) {
    console.error("Error fetching sub-category:", error);
    return NextResponse.json(
      { error: "Failed to fetch sub-category" },
      { status: 500 }
    );
  }
}

// PUT update sub-category
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
    const { name, description, categoryId } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: "Sub-category name and parent category are required" },
        { status: 400 }
      );
    }

    // Check if sub-category exists
    const existingSubCategory = await prisma.subCategory.findUnique({
      where: { id },
    });

    if (!existingSubCategory) {
      return NextResponse.json(
        { error: "Sub-category not found" },
        { status: 404 }
      );
    }

    // Check if parent category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Parent category not found" },
        { status: 404 }
      );
    }

    // Check if new name conflicts with another sub-category
    const nameConflict = await prisma.subCategory.findUnique({
      where: { name },
    });

    if (nameConflict && nameConflict.id !== id) {
      return NextResponse.json(
        { error: "Another sub-category with this name already exists" },
        { status: 409 }
      );
    }

    const updatedSubCategory = await prisma.subCategory.update({
      where: { id },
      data: {
        name,
        description,
        categoryId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSubCategory);
  } catch (error) {
    console.error("Error updating sub-category:", error);
    return NextResponse.json(
      { error: "Failed to update sub-category" },
      { status: 500 }
    );
  }
}

// DELETE sub-category
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

    // Check if sub-category exists
    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!subCategory) {
      return NextResponse.json(
        { error: "Sub-category not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if sub-category has products
    if (subCategory._count.products > 0) {
      return NextResponse.json(
        { error: "Cannot delete sub-category with associated products" },
        { status: 400 }
      );
    }

    await prisma.subCategory.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Sub-category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting sub-category:", error);
    return NextResponse.json(
      { error: "Failed to delete sub-category" },
      { status: 500 }
    );
  }
}