import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await getAdminApiSession();
  if (!session) {
    return null;
  }
  return session;
}

// Helper function to validate discount ID
function validateDiscountId(id: string) {
  if (!id || id.length !== 24) {
    return false;
  }
  return true;
}

// GET /api/admin/promotional/discounts/[id]/categories - Get categories associated with a discount
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!validateDiscountId(id)) {
    return NextResponse.json({ error: "Invalid discount ID" }, { status: 400 });
  }

  try {
    // Check if discount exists
    const discount = await prisma.discount.findUnique({
      where: { id },
      select: { id: true, applyToAll: true },
    });

    if (!discount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    // Get categories associated with this discount
    const categoriesData = await prisma.categoryDiscount.findMany({
      where: { discountId: id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            _count: {
              select: {
                products: true,
              },
            },
          },
        },
      },
      orderBy: { category: { name: "asc" } },
    });

    const categories = categoriesData.map(cd => cd.category);

    return NextResponse.json({
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Error fetching discount categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount categories" },
      { status: 500 }
    );
  }
}

// POST /api/admin/promotional/discounts/[id]/categories - Add categories to a discount
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!validateDiscountId(id)) {
    return NextResponse.json({ error: "Invalid discount ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { categoryIds } = body;

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json(
        { error: "categoryIds array is required" },
        { status: 400 }
      );
    }

    // Check if discount exists
    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    // Validate all category IDs exist
    const existingCategories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
      },
      select: { id: true },
    });

    const existingCategoryIds = existingCategories.map(c => c.id);
    const invalidCategoryIds = categoryIds.filter(id => !existingCategoryIds.includes(id));

    if (invalidCategoryIds.length > 0) {
      return NextResponse.json(
        { 
          error: "Some category IDs are invalid",
          invalidCategoryIds,
          validCategoryIds: existingCategoryIds,
        },
        { status: 400 }
      );
    }

    // Connect categories to discount using CategoryDiscount join table
    const updatedDiscount = await prisma.discount.update({
      where: { id },
      data: {
        categoryDiscounts: {
          create: categoryIds.map((categoryId: string) => ({ categoryId })),
        },
      },
      include: {
        categoryDiscounts: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          take: 10,
        },
        _count: {
          select: {
            categoryDiscounts: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Added ${categoryIds.length} category(s) to discount`,
      discount: updatedDiscount,
    });
  } catch (error) {
    console.error("Error adding categories to discount:", error);
    return NextResponse.json(
      { error: "Failed to add categories to discount" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/promotional/discounts/[id]/categories - Remove categories from a discount
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!validateDiscountId(id)) {
    return NextResponse.json({ error: "Invalid discount ID" }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const removeAll = searchParams.get("removeAll") === "true";

    // Check if discount exists
    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    if (removeAll) {
      // Remove all categories from discount
      await prisma.categoryDiscount.deleteMany({
        where: { discountId: id },
      });

      return NextResponse.json({
        success: true,
        message: "Removed all categories from discount",
      });
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "categoryId query parameter is required when removeAll is false" },
        { status: 400 }
      );
    }

    // Remove specific category from discount using composite key
    await prisma.categoryDiscount.delete({
      where: {
        categoryId_discountId: {
          categoryId,
          discountId: id,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Removed category from discount",
      categoryId,
    });
  } catch (error) {
    console.error("Error removing categories from discount:", error);
    return NextResponse.json(
      { error: "Failed to remove categories from discount" },
      { status: 500 }
    );
  }
}