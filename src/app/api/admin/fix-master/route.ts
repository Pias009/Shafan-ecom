import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    // Simple security check - could be improved with a secret token
    const authHeader = req.headers.get("authorization");
    const expectedToken = process.env.ADMIN_FIX_TOKEN || "emergency-fix-2024";
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const MASTER_ADMIN_EMAIL = "pvs178380@gmail.com";
    const MASTER_ADMIN_PASSWORD = "pias900";
    
    console.log("🛠️ Fixing master admin account...");
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: MASTER_ADMIN_EMAIL },
    });
    
    const passwordHash = await bcrypt.hash(MASTER_ADMIN_PASSWORD, 10);
    
    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          email: MASTER_ADMIN_EMAIL,
          name: "Master Admin",
          role: "SUPERADMIN",
          passwordHash,
          loginAttempts: 0,
          lockUntil: null,
          mfaEnabled: true,
          isVerified: true,
        },
      });
      console.log("✅ Master admin created");
    } else {
      // Update user
      user = await prisma.user.update({
        where: { email: MASTER_ADMIN_EMAIL },
        data: {
          passwordHash,
          role: "SUPERADMIN",
          loginAttempts: 0,
          lockUntil: null,
          mfaEnabled: true,
          name: "Master Admin",
        },
      });
      console.log("✅ Master admin updated");
    }
    
    // Test password verification
    const passwordMatch = await bcrypt.compare(MASTER_ADMIN_PASSWORD, passwordHash);
    
    return NextResponse.json({
      success: true,
      message: "Master admin account fixed",
      user: {
        email: user.email,
        role: user.role,
        loginAttempts: user.loginAttempts,
        lockUntil: user.lockUntil,
      },
      passwordVerification: passwordMatch ? "OK" : "FAILED",
      credentials: {
        email: MASTER_ADMIN_EMAIL,
        password: MASTER_ADMIN_PASSWORD,
      },
      instructions: "Use these credentials at /ueadmin/login",
    });
    
  } catch (error: any) {
    console.error("❌ Error fixing master admin:", error);
    return NextResponse.json(
      { 
        error: "Failed to fix master admin",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET(req: Request) {
  return NextResponse.json({
    message: "Master admin fix endpoint",
    usage: "POST with Authorization: Bearer <ADMIN_FIX_TOKEN>",
    note: "Set ADMIN_FIX_TOKEN environment variable for security",
    defaultToken: "emergency-fix-2024",
  });
}