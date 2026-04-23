import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminApiSession } from "@/lib/admin-session";
import { randomBytes, createHash } from "crypto";

const TOKEN_EXPIRY_HOURS = 24;

export async function POST(request: NextRequest) {
  try {
    console.log("=== Face Enrollment Link API ===");
    
    const session = await getAdminApiSession();
    console.log("Session:", session);
    
    if (!session) {
      console.log("No session - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session as any)?.user?.role || (session as any)?.role;
    console.log("Session:", JSON.stringify(session));
    console.log("User role:", userRole);
    
    if (userRole !== "SUPERADMIN") {
      console.log("Not super admin - returning 403");
      return NextResponse.json({ 
        error: "Only SUPERADMIN can generate enrollment links." 
      }, { status: 403 });
    }

    const body = await request.json();
    const { adminId, adminName } = body;
    console.log("adminId:", adminId, "adminName:", adminName);

    if (!adminId || !adminName) {
      return NextResponse.json({ error: "adminId and adminName required" }, { status: 400 });
    }

    // Generate one-time token
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    console.log("Creating token in database...");
    
    // Store the enrollment token
    const enrollment = await (prisma as any).faceEnrollmentToken.create({
      data: {
        tokenHash,
        adminId,
        adminName,
        expiresAt,
        used: false,
      },
    });

    console.log("Token created:", enrollment.id);

    // Generate the one-time link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const enrollmentLink = `${baseUrl}/face-enroll?token=${token}`;

    return NextResponse.json({
      success: true,
      enrollmentLink,
      expiresAt: expiresAt.toISOString(),
      adminId,
      adminName,
    });
  } catch (error: any) {
    console.error("ERROR in face enrollment link API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate link", details: error.stack },
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
    if (userRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all pending enrollment requests
    const tokens = await (prisma as any).faceEnrollmentToken.findMany({
      where: {
        used: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ tokens });
  } catch (error) {
    console.error("Get tokens error:", error);
    return NextResponse.json(
      { error: "Failed to get tokens" },
      { status: 500 }
    );
  }
}