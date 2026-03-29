import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logSecurityAudit } from "@/lib/security-audit";

export async function POST(request: NextRequest) {
  try {
    // Enhanced security checks for developer login
    const IS_DEVELOPMENT = process.env.NODE_ENV === "development";
    const ALLOW_DEVELOPER_LOGIN = process.env.ALLOW_DEVELOPER_LOGIN === "true";
    const IS_LOCALHOST = request.headers.get("host")?.includes("localhost") ||
                         request.headers.get("host")?.includes("127.0.0.1") ||
                         request.headers.get("x-forwarded-host")?.includes("localhost");
    
    // Only allow developer login in specific conditions
    const ALLOW_ACCESS = (IS_DEVELOPMENT && IS_LOCALHOST) || ALLOW_DEVELOPER_LOGIN;
    
    if (!ALLOW_ACCESS) {
      // Log attempted unauthorized developer login
      const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
      console.error("UNAUTHORIZED DEVELOPER LOGIN ATTEMPT:", {
        ip: ipAddress,
        host: request.headers.get("host"),
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
      
      return NextResponse.json(
        { error: "Developer login is disabled in production environment" },
        { status: 403 }
      );
    }

    // Get or create a developer user
    const developerEmail = "developer@shafan.com";
    let user = await prisma.user.findUnique({
      where: { email: developerEmail },
    });

    if (!user) {
      // Create a developer user if it doesn't exist
      // Use bcrypt to hash the password "developer"
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash("developer", 10);
      
      user = await prisma.user.create({
        data: {
          email: developerEmail,
          name: "Developer",
          role: "SUPERADMIN",
          emailVerified: new Date(),
          // Set a real password hash that matches "developer"
          passwordHash: passwordHash,
        },
      });
    }

    // Reset login attempts and unlock account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockUntil: null,
        isVerified: true,
        emailVerified: new Date(),
      },
    });

    // Create a session token or return success
    // In a real implementation, you would create a NextAuth session
    // For now, we'll return a success response and let the client handle redirect
    
    // Log the developer login for security audit
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    
    console.log("DEVELOPER LOGIN: Developer bypass used", {
      userId: user.id,
      email: user.email,
      ip: ipAddress,
      userAgent: userAgent,
      timestamp: new Date().toISOString(),
    });

    // Log to security audit system
    await logSecurityAudit({
      userId: user.id,
      userEmail: user.email || "developer@shafan.com",
      userRole: user.role,
      action: "SUPERADMIN_LOGIN",
      resourceId: user.id,
      resourceType: "USER",
      details: {
        loginType: "DEVELOPER_BYPASS",
        bypassReason: "Developer mode access without verification",
        environment: process.env.NODE_ENV,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Developer login successful",
      redirectUrl: "/ueadmin",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Developer login error:", error);
    return NextResponse.json(
      { error: "Developer login failed", details: error.message },
      { status: 500 }
    );
  }
}