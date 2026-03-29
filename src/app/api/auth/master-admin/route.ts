import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityAudit } from "@/lib/security-audit";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

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
    // We need to create a proper NextAuth session
    // For master admin, we'll create a session with mfaVerified: true
    
    console.log("MASTER ADMIN LOGIN SUCCESS:", {
      userId: user.id,
      email: user.email,
      ip: ipAddress,
      timestamp: new Date().toISOString(),
    });

    // Instead of returning JSON, we'll redirect to a special endpoint
    // that creates the session using NextAuth's signIn
    // But we can't call signIn from server-side API route
    
    // Alternative: Set a temporary cookie and redirect to NextAuth callback
    const response = NextResponse.json({
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
      // Include a token that can be used to create session
      sessionToken: `master-admin-${Date.now()}-${user.id}`,
    });

    // Set a cookie that middleware can recognize
    // This is a temporary workaround until proper session is created
    response.cookies.set({
      name: 'master_admin_auth',
      value: JSON.stringify({
        userId: user.id,
        email: user.email,
        role: user.role,
        mfaVerified: true,
        timestamp: Date.now(),
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error: any) {
    console.error("Master admin login error:", error);
    return NextResponse.json(
      { error: "Master admin login failed", details: error.message },
      { status: 500 }
    );
  }
}