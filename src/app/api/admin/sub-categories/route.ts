import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET all sub-categories with their parent categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const where = categoryId ? { categoryId } : {};

    const subCategories = await prisma.subCategory.findMany({
      where,
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
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(subCategories);
  } catch (error) {
    console.error("Error fetching sub-categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch sub-categories" },
      { status: 500 }
    );
  }
}

// POST create new sub-category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, categoryId } = body;

    if (!name || !categoryId) {
      return NextResponse.json(
        { error: "Sub-category name and parent category are required" },
        { status: 400 }
      );
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Parent category not found" },
        { status: 404 }
      );
    }

    const existingSubCategory = await prisma.subCategory.findUnique({
      where: { name },
    });

    if (existingSubCategory) {
      return NextResponse.json(
        { error: "Sub-category with this name already exists" },
        { status: 409 }
      );
    }

    const subCategory = await prisma.subCategory.create({
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

    return NextResponse.json(subCategory, { status: 201 });
  } catch (error) {
    console.error("Error creating sub-category:", error);
    return NextResponse.json(
      { error: "Failed to create sub-category" },
      { status: 500 }
    );
  }
}