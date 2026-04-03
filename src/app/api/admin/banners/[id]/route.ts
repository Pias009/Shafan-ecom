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

function validateBannerId(id: string) {
  if (!id || id.length !== 24) {
    return false;
  }
  return true;
}

// GET /api/admin/banners/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!validateBannerId(id)) {
    return NextResponse.json({ error: "Invalid banner ID" }, { status: 400 });
  }

  try {
    const banner = await prisma.banner.findUnique({
      where: { id },
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

// PUT /api/admin/banners/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!validateBannerId(id)) {
    return NextResponse.json({ error: "Invalid banner ID" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      imageUrl,
      ctaText,
      ctaLink,
      backgroundColor,
      textColor,
      position,
      displayOn,
      countries,
      startDate,
      endDate,
      active,
      sortOrder,
      priority,
      desktopHeight,
      mobileHeight,
    } = body;

    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
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

    // Parse dates if provided
    const startDateObj = startDate ? new Date(startDate) : undefined;
    const endDateObj = endDate ? new Date(endDate) : undefined;

    // Validate date logic if both provided
    if (startDateObj && endDateObj && startDateObj >= endDateObj) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (ctaText !== undefined) updateData.ctaText = ctaText;
    if (ctaLink !== undefined) updateData.ctaLink = ctaLink;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (position !== undefined) updateData.position = position;
    if (displayOn !== undefined) updateData.displayOn = displayOn;
    if (countries !== undefined) {
      updateData.countries = countries.length > 0 ? countries : validCountries;
    }
    if (startDateObj !== undefined) updateData.startDate = startDateObj;
    if (endDateObj !== undefined) updateData.endDate = endDateObj;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (priority !== undefined) updateData.priority = priority;
    if (desktopHeight !== undefined) updateData.desktopHeight = desktopHeight;
    if (mobileHeight !== undefined) updateData.mobileHeight = mobileHeight;
    if (active !== undefined) {
      updateData.active = active;
      updateData.status = active ? "ACTIVE" : "DRAFT";
      if (active && !existingBanner.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const updatedBanner = await prisma.banner.update({
      where: { id },
      data: updateData,
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

// DELETE /api/admin/banners/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdminAuth();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (!validateBannerId(id)) {
    return NextResponse.json({ error: "Invalid banner ID" }, { status: 400 });
  }

  try {
    const existingBanner = await prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting banner:", error);
    return NextResponse.json(
      { error: "Failed to delete banner" },
      { status: 500 }
    );
  }
}
