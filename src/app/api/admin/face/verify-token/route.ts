import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const tokenHash = createHash('sha256').update(token).digest('hex');

    // Find the token
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

    return NextResponse.json({
      valid: true,
      adminId: enrollment.adminId,
      adminName: enrollment.adminName,
    });
  } catch (error) {
    console.error("Verify token error:", error);
    return NextResponse.json({ error: "Failed to verify token" }, { status: 500 });
  }
}