import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityAudit } from "@/lib/security-audit";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing email or password" },
        { status: 400 }
      );
    }

    // Verify master admin credentials from environment
    const MASTER_ADMIN_ENABLED = process.env.MASTER_ADMIN_ENABLED === "true";
    const MASTER_ADMIN_EMAIL = process.env.MASTER_ADMIN_EMAIL;
    const MASTER_ADMIN_PASSWORD = process.env.MASTER_ADMIN_PASSWORD;

    if (!MASTER_ADMIN_ENABLED) {
      return NextResponse.json(
        { error: "Master admin login is disabled" },
        { status: 403 }
      );
    }

    if (email !== MASTER_ADMIN_EMAIL || password !== MASTER_ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid master admin credentials" },
        { status: 401 }
      );
    }

    // Find or create master admin user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create master admin user if doesn't exist
      user = await prisma.user.create({
        data: {
          email,
          name: "Master Admin",
          role: "SUPERADMIN",
          emailVerified: new Date(),
          approvedBySuperAdmin: true,
          isVerified: true,
          mfaEnabled: false, // Master admin doesn't need MFA
          passwordHash: await bcrypt.hash(password, 10),
        },
      });
    }

    // Reset login attempts and unlock account - only update fields that definitely exist
    await (prisma.user as any).update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockUntil: null,
        isVerified: true,
        mfaEnabled: false, // Master admin doesn't need MFA
      },
    });

    // Log security audit for master admin login
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await logSecurityAudit({
      userId: user.id,
      userEmail: user.email || email,
      userRole: user.role,
      action: "MASTER_ADMIN_LOGIN",
      resourceId: user.id,
      resourceType: "USER",
      details: {
        loginType: "MASTER_ADMIN_BYPASS",
        bypassReason: "Master admin credentials used",
        environment: process.env.NODE_ENV,
        ipAddress,
        userAgent,
      },
      ipAddress,
      userAgent,
    });

    // Create a session for the user
    // In a real implementation, you would create a NextAuth session
    // For now, we'll return success and let the client handle the redirect
    
    console.log("MASTER ADMIN LOGIN SUCCESS:", {
      userId: user.id,
      email: user.email,
      ip: ipAddress,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Master admin login successful",
      redirectUrl: "/ueadmin",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      masterAdminBypass: true,
    });
  } catch (error: any) {
    console.error("Master admin login error:", error);
    return NextResponse.json(
      { error: "Master admin login failed", details: error.message },
      { status: 500 }
    );
  }
}