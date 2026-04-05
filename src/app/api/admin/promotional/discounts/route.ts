import { NextRequest, NextResponse } from "next/server";
import { getAdminApiSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function checkAdminAuth() {
  const session = await getAdminApiSession();
  if (!session) {
    return null;
  }
  return session;
}

// GET /api/admin/promotional/discounts - Get all discounts with filtering and pagination
export async function GET(req: NextRequest) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const type = searchParams.get("type"); // PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
  const skip = (page - 1) * limit;

  // Build where clause based on filters
  const where: any = {};
  
  if (status === "active") {
    where.active = true;
    where.OR = [
      { startDate: null, endDate: null },
      {
        AND: [
          { OR: [{ startDate: null }, { startDate: { lte: new Date() } }] },
          { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
        ],
      },
    ];
  } else if (status === "scheduled") {
    where.active = true;
    where.startDate = { gt: new Date() };
  } else if (status === "expired") {
    where.OR = [
      { active: false },
      {
        AND: [
          { endDate: { not: null } },
          { endDate: { lt: new Date() } },
        ],
      },
    ];
  } else if (status === "exhausted") {
    where.AND = [
      { maxUses: { not: null } },
    ];
  }

  // Filter by discount type
  if (type && ["PERCENTAGE", "FIXED_AMOUNT", "FREE_SHIPPING"].includes(type)) {
    where.discountType = type;
  }

  try {
    // Get total count for pagination
    const total = await prisma.discount.count({ where });

    // Get discounts with pagination
    const discounts = await prisma.discount.findMany({
      where,
      orderBy: [
        { createdAt: "desc" },
        { startDate: "asc" },
      ],
      skip,
      take: limit,
      include: {
        productDiscounts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
          take: 3, // Limit to 3 products for preview
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
          take: 3, // Limit to 3 categories for preview
        },
        banners: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
          },
          take: 2, // Limit to 2 banners for preview
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

    return NextResponse.json({
      discounts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching discounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch discounts" },
      { status: 500 }
    );
  }
}

// POST /api/admin/promotional/discounts - Create a new discount
export async function POST(req: NextRequest) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      code,
      name,
      description,
      discountType = "PERCENTAGE",
      value,
      applyToAll = false,
      minimumOrderValue,
      startDate,
      endDate,
      maxUses,
      active = true,
      autoApply = false,
      productIds = [],
      categoryIds = [],
      countries = [],
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    if (value === undefined || value === null) {
      return NextResponse.json(
        { error: "value is required" },
        { status: 400 }
      );
    }

    // Validate countries
    const validCountries = ["AE", "KW", "BH", "SA", "OM", "QA"];
    if (countries.length > 0) {
      const invalidCountries = countries.filter((c: string) => !validCountries.includes(c));
      if (invalidCountries.length > 0) {
        return NextResponse.json(
          { error: `Invalid countries: ${invalidCountries.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validate value based on discount type
    if (discountType === "PERCENTAGE" && (value < 0 || value > 100)) {
      return NextResponse.json(
        { error: "Percentage value must be between 0 and 100" },
        { status: 400 }
      );
    }

    if (discountType === "FIXED_AMOUNT" && value < 0) {
      return NextResponse.json(
        { error: "Fixed amount must be positive" },
        { status: 400 }
      );
    }

    // Parse dates if provided
    const startDateObj = startDate ? new Date(startDate) : null;
    const endDateObj = endDate ? new Date(endDate) : null;

    // Validate date logic
    if (startDateObj && endDateObj && startDateObj >= endDateObj) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Check if code is unique (if provided)
    if (code) {
      const existingDiscount = await prisma.discount.findUnique({
        where: { code },
      });
      if (existingDiscount) {
        return NextResponse.json(
          { error: "Discount code already exists" },
          { status: 400 }
        );
      }
    }

    // Create the discount
    const discount = await prisma.discount.create({
      data: {
        code,
        name,
        description,
        discountType,
        value,
        applyToAll,
        minimumOrderValue,
        startDate: startDateObj,
        endDate: endDateObj,
        maxUses,
        active,
        autoApply,
        uses: 0,
        countries: countries.length > 0 ? countries : validCountries,
        status: active ? "ACTIVE" : "DRAFT",
        publishedAt: active ? new Date() : null,
        createdBy: (session.user as any)?.email,
        // Connect products using join table if provided
        productDiscounts: {
          create: productIds.map((id: string) => ({ productId: id })),
        },
        // Connect categories using join table if provided
        categoryDiscounts: {
          create: categoryIds.map((id: string) => ({ categoryId: id })),
        },
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

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error("Error creating discount:", error);
    return NextResponse.json(
      { error: "Failed to create discount" },
      { status: 500 }
    );
  }
}