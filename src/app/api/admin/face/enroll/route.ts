import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";
import { randomBytes, createHash } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userName, imageData, token } = body;

    // Check if this is a one-time enrollment (from the link)
    if (token) {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      
      // Verify the token
      const enrollment = await (prisma as any).faceEnrollmentToken.findUnique({
        where: { tokenHash },
      });

      if (!enrollment) {
        return NextResponse.json({ error: "Invalid enrollment link" }, { status: 400 });
      }

      if (enrollment.used) {
        return NextResponse.json({ error: "This enrollment link has already been used" }, { status: 400 });
      }

      if (new Date() > enrollment.expiresAt) {
        return NextResponse.json({ error: "This enrollment link has expired" }, { status: 400 });
      }

      // Mark token as used
      await (prisma as any).faceEnrollmentToken.update({
        where: { tokenHash },
        data: { used: true, usedAt: new Date() },
      });

      // Enroll the face
      const faceHash = randomBytes(32).toString('hex');
      await (prisma as any).faceData.upsert({
        where: { userId: enrollment.adminId },
        create: {
          userId: enrollment.adminId,
          faceData: imageData,
          faceHash,
        },
        update: {
          faceData: imageData,
          faceHash,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Face enrolled successfully",
        userId: enrollment.adminId,
      });
    }

    // Check session auth (for super admin direct enrollment)
    const session = await getAdminApiSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session as any)?.user?.role || (session as any)?.role;
    if (userRole !== "SUPERADMIN") {
      return NextResponse.json({ 
        error: "Only SUPERADMIN can enroll faces directly." 
      }, { status: 403 });
    }

    if (!imageData) {
      return NextResponse.json({ error: "Image data required" }, { status: 400 });
    }

    const faceHash = randomBytes(32).toString('hex');

    const faceData = await (prisma as any).faceData.upsert({
      where: { userId },
      update: {
        faceData: imageData,
        faceHash,
        updatedAt: new Date(),
      },
      create: {
        userId,
        faceData: imageData,
        faceHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Face enrolled successfully",
      userId,
    });
  } catch (error) {
    console.error("Face enrollment error:", error);
    return NextResponse.json(
      { error: "Failed to enroll face" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if SUPERADMIN - only super admins can delete faces
    const userRole = (session as any)?.user?.role || (session as any)?.role;
    if (userRole !== "SUPERADMIN") {
      return NextResponse.json({ 
        error: "Only SUPERADMIN can delete face enrollments." 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await (prisma as any).faceData.delete({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: "Face enrollment deleted",
    });
  } catch (error) {
    console.error("Face deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete face" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminApiSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session as any)?.user?.role || (session as any)?.role;
    
    // Only SUPERADMIN can see all enrolled users
    if (userRole !== "SUPERADMIN") {
      return NextResponse.json({ 
        enrolled: 0,
        users: [],
        message: "Regular admins cannot view face enrollment list"
      });
    }

    const users = await (prisma as any).faceData.findMany({
      select: {
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      enrolled: users.length,
      users,
    });
  } catch (error) {
    console.error("Get face data error:", error);
    return NextResponse.json(
      { error: "Failed to get face data" },
      { status: 500 }
    );
  }
}