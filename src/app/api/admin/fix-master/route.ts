import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";

export async function POST(req: Request) {
  try {
    // Disabled unless every emergency variable is explicitly configured.
    const expectedToken = process.env.ADMIN_FIX_TOKEN;
    const MASTER_ADMIN_EMAIL = process.env.DEMO_SUPERADMIN_EMAIL;
    const MASTER_ADMIN_PASSWORD = process.env.DEMO_SUPERADMIN_PASSWORD;
    if (!expectedToken || expectedToken.length < 24 || !MASTER_ADMIN_EMAIL || !MASTER_ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const provided = Buffer.from(req.headers.get("authorization") || "");
    const expected = Buffer.from(`Bearer ${expectedToken}`);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🛠️ Fixing super admin account...");
    
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
      instructions: "Sign in at /ueadmin/login with the DEMO_SUPERADMIN_* credentials",
    });
    
  } catch (error: any) {
    console.error("❌ Error fixing master admin:", error);
    return NextResponse.json(
      { 
        error: "Failed to fix master admin",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
