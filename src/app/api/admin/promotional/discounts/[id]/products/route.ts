import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "SUPERADMIN"].includes((session.user as any)?.role)) {
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

// GET /api/admin/promotional/discounts/[id]/products - Get products associated with a discount
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

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

    // If discount applies to all products, return empty array with a note
    if (discount.applyToAll) {
      return NextResponse.json({
        products: [],
        appliesToAll: true,
        message: "Discount applies to all products",
      });
    }

    // Get products associated with this discount
    const products = await prisma.product.findMany({
      where: {
        discounts: {
          some: { id },
        },
      },
      select: {
        id: true,
        name: true,
        priceCents: true,
        discountCents: true,
        mainImage: true,
        active: true,
        stockQuantity: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      products,
      appliesToAll: false,
      count: products.length,
    });
  } catch (error) {
    console.error("Error fetching discount products:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount products" },
      { status: 500 }
    );
  }
}

// POST /api/admin/promotional/discounts/[id]/products - Add products to a discount
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  if (!validateDiscountId(id)) {
    return NextResponse.json({ error: "Invalid discount ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { productIds } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "productIds array is required" },
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

    // If discount applies to all, we shouldn't add specific products
    if (discount.applyToAll) {
      return NextResponse.json(
        { 
          error: "Cannot add specific products to a discount that applies to all products",
          suggestion: "Set applyToAll to false first, then add specific products"
        },
        { status: 400 }
      );
    }

    // Validate all product IDs exist
    const existingProducts = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: { id: true },
    });

    const existingProductIds = existingProducts.map(p => p.id);
    const invalidProductIds = productIds.filter(id => !existingProductIds.includes(id));

    if (invalidProductIds.length > 0) {
      return NextResponse.json(
        { 
          error: "Some product IDs are invalid",
          invalidProductIds,
          validProductIds: existingProductIds,
        },
        { status: 400 }
      );
    }

    // Connect products to discount
    const updatedDiscount = await prisma.discount.update({
      where: { id },
      data: {
        products: {
          connect: productIds.map(productId => ({ id: productId })),
        },
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
          take: 10,
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Added ${productIds.length} product(s) to discount`,
      discount: updatedDiscount,
    });
  } catch (error) {
    console.error("Error adding products to discount:", error);
    return NextResponse.json(
      { error: "Failed to add products to discount" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/promotional/discounts/[id]/products - Remove products from a discount
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  if (!validateDiscountId(id)) {
    return NextResponse.json({ error: "Invalid discount ID" }, { status: 400 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const removeAll = searchParams.get("removeAll") === "true";

    // Check if discount exists
    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    if (removeAll) {
      // Remove all products from discount
      await prisma.discount.update({
        where: { id },
        data: {
          products: {
            set: [],
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Removed all products from discount",
      });
    }

    if (!productId) {
      return NextResponse.json(
        { error: "productId query parameter is required when removeAll is false" },
        { status: 400 }
      );
    }

    // Remove specific product from discount
    await prisma.discount.update({
      where: { id },
      data: {
        products: {
          disconnect: { id: productId },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Removed product from discount",
      productId,
    });
  } catch (error) {
    console.error("Error removing products from discount:", error);
    return NextResponse.json(
      { error: "Failed to remove products from discount" },
      { status: 500 }
    );
  }
}