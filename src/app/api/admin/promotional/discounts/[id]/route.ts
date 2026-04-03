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

// GET /api/admin/promotional/discounts/[id] - Get a single discount by ID
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
    const discount = await prisma.discount.findUnique({
      where: { id },
      include: {
        productDiscounts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                priceCents: true,
                discountCents: true,
                mainImage: true,
              },
            },
          },
        },
        categoryDiscounts: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        banners: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            active: true,
          },
        },
        _count: {
          select: {
            productDiscounts: true,
            categoryDiscounts: true,
            banners: true,
          },
        },
      },
    });

    if (!discount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    return NextResponse.json(discount);
  } catch (error) {
    console.error("Error fetching discount:", error);
    return NextResponse.json(
      { error: "Failed to fetch discount" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/promotional/discounts/[id] - Update a discount
export async function PUT(
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
    const {
      code,
      name,
      description,
      discountType,
      value,
      applyToAll,
      minimumOrderValue,
      startDate,
      endDate,
      maxUses,
      active,
      autoApply,
      uses,
      productIds,
      categoryIds,
      countries,
    } = body;

    // Check if discount exists
    const existingDiscount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    // Validate countries if provided
    const validCountries = ["AE", "KW", "BH", "SA", "OM", "QA"];
    if (countries && countries.length > 0) {
      const invalidCountries = countries.filter((c: string) => !validCountries.includes(c));
      if (invalidCountries.length > 0) {
        return NextResponse.json(
          { error: `Invalid countries: ${invalidCountries.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validate value if provided
    if (value !== undefined) {
      const discountTypeToUse = discountType || existingDiscount.discountType;
      if (discountTypeToUse === "PERCENTAGE" && (value < 0 || value > 100)) {
        return NextResponse.json(
          { error: "Percentage value must be between 0 and 100" },
          { status: 400 }
        );
      }
      if (discountTypeToUse === "FIXED_AMOUNT" && value < 0) {
        return NextResponse.json(
          { error: "Fixed amount must be positive" },
          { status: 400 }
        );
      }
    }

    // Check if code is unique (if changing code)
    if (code && code !== existingDiscount.code) {
      const existingWithCode = await prisma.discount.findUnique({
        where: { code },
      });
      if (existingWithCode) {
        return NextResponse.json(
          { error: "Discount code already exists" },
          { status: 400 }
        );
      }
    }

    // Parse dates if provided
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    // Validate date logic if both dates are provided
    if (startDateObj && endDateObj && startDateObj >= endDateObj) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (discountType !== undefined) updateData.discountType = discountType;
    if (value !== undefined) updateData.value = value;
    if (applyToAll !== undefined) updateData.applyToAll = applyToAll;
    if (minimumOrderValue !== undefined) updateData.minimumOrderValue = minimumOrderValue;
    if (startDateObj !== undefined) updateData.startDate = startDateObj;
    if (endDateObj !== undefined) updateData.endDate = endDateObj;
    if (maxUses !== undefined) updateData.maxUses = maxUses;
    if (active !== undefined) {
      updateData.active = active;
      updateData.status = active ? "ACTIVE" : "DRAFT";
      if (active && !existingDiscount.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (autoApply !== undefined) updateData.autoApply = autoApply;
    if (uses !== undefined) updateData.uses = uses;
    if (countries !== undefined) updateData.countries = countries.length > 0 ? countries : validCountries;

    // Handle product connections if provided
    let productConnectDisconnect: any = undefined;
    if (productIds !== undefined) {
      productConnectDisconnect = {
        productDiscounts: {
          deleteMany: {}, // Remove all existing connections
          create: productIds.map((productId: string) => ({ productId })),
        },
      };
    }

    // Handle category connections if provided
    let categoryConnectDisconnect: any = undefined;
    if (categoryIds !== undefined) {
      categoryConnectDisconnect = {
        categoryDiscounts: {
          deleteMany: {}, // Remove all existing connections
          create: categoryIds.map((categoryId: string) => ({ categoryId })),
        },
      };
    }

    // Update the discount
    const updatedDiscount = await prisma.discount.update({
      where: { id },
      data: {
        ...updateData,
        ...productConnectDisconnect,
        ...categoryConnectDisconnect,
      },
      include: {
        productDiscounts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        categoryDiscounts: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedDiscount);
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json(
      { error: "Failed to update discount" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/promotional/discounts/[id] - Delete a discount
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
    // Check if discount exists
    const existingDiscount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return NextResponse.json({ error: "Discount not found" }, { status: 404 });
    }

    // Check if discount is used in any banners
    const bannersUsingDiscount = await prisma.enhancedOfferBanner.count({
      where: { discountId: id },
    });

    if (bannersUsingDiscount > 0) {
      return NextResponse.json(
        { 
          error: "Cannot delete discount that is used in banners",
          bannersCount: bannersUsingDiscount,
          suggestion: "Deactivate the discount instead or update the banners first"
        },
        { status: 400 }
      );
    }

    // Delete the discount (this will cascade to ProductDiscount and CategoryDiscount due to relations)
    await prisma.discount.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Discount deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting discount:", error);
    return NextResponse.json(
      { error: "Failed to delete discount" },
      { status: 500 }
    );
  }
}