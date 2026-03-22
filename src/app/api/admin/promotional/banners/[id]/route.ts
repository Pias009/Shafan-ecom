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

// Helper function to validate banner ID
function validateBannerId(id: string) {
  if (!id || id.length !== 24) {
    return false;
  }
  return true;
}

// GET /api/admin/promotional/banners/[id] - Get a single banner by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  if (!validateBannerId(id)) {
    return NextResponse.json({ error: "Invalid banner ID" }, { status: 400 });
  }

  try {
    const banner = await prisma.enhancedOfferBanner.findUnique({
      where: { id },
      include: {
        discount: {
          select: {
            id: true,
            name: true,
            code: true,
            discountType: true,
            value: true,
            description: true,
            startDate: true,
            endDate: true,
            active: true,
          },
        },
      },
    });

    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json(banner);
  } catch (error) {
    console.error("Error fetching banner:", error);
    return NextResponse.json(
      { error: "Failed to fetch banner" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/promotional/banners/[id] - Update a banner
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  if (!validateBannerId(id)) {
    return NextResponse.json({ error: "Invalid banner ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const {
      imageUrl,
      title,
      subtitle,
      offerText,
      ctaText,
      backgroundColor,
      textColor,
      backgroundImage,
      startDate,
      endDate,
      active,
      link,
      discountId,
      sortOrder,
      priority,
      clicks,
      conversions,
    } = body;

    // Check if banner exists
    const existingBanner = await prisma.enhancedOfferBanner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // Validate priority if provided
    if (priority !== undefined && (priority < 1 || priority > 3)) {
      return NextResponse.json(
        { error: "Priority must be between 1 and 3" },
        { status: 400 }
      );
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
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (offerText !== undefined) updateData.offerText = offerText;
    if (ctaText !== undefined) updateData.ctaText = ctaText;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (backgroundImage !== undefined) updateData.backgroundImage = backgroundImage;
    if (startDateObj !== undefined) updateData.startDate = startDateObj;
    if (endDateObj !== undefined) updateData.endDate = endDateObj;
    if (active !== undefined) updateData.active = active;
    if (link !== undefined) updateData.link = link;
    if (discountId !== undefined) updateData.discountId = discountId;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (priority !== undefined) updateData.priority = priority;
    if (clicks !== undefined) updateData.clicks = clicks;
    if (conversions !== undefined) updateData.conversions = conversions;

    // Update the banner
    const updatedBanner = await prisma.enhancedOfferBanner.update({
      where: { id },
      data: updateData,
      include: {
        discount: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(updatedBanner);
  } catch (error) {
    console.error("Error updating banner:", error);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/promotional/banners/[id] - Delete a banner
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  if (!validateBannerId(id)) {
    return NextResponse.json({ error: "Invalid banner ID" }, { status: 400 });
  }

  try {
    // Check if banner exists
    const existingBanner = await prisma.enhancedOfferBanner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // Delete the banner
    await prisma.enhancedOfferBanner.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Banner deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}