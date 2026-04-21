import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const SYNC_SUPER_SECRET = process.env.SYNC_SUPER_SECRET || "shanfa-sync-secret-2024";

function verifySyncSecret(req: Request): boolean {
  const secret = req.headers.get("x-sync-secret");
  return secret === SYNC_SUPER_SECRET;
}

export async function GET(req: Request) {
  // Verify secret key
  if (!verifySyncSecret(req)) {
    return NextResponse.json({ error: "Unauthorized - invalid secret key" }, { status: 401 });
  }
  
  try {
    // Use environment variables for super admin credentials
    const email = process.env.DEMO_SUPERADMIN_EMAIL || "superadmin@example.com";
    const password = process.env.DEMO_SUPERADMIN_PASSWORD || "superadmin123";
    
    if (!email || !password) {
      return NextResponse.json(
        { error: "Super admin credentials not configured" },
        { status: 500 }
      );
    }
    
    const hashed = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hashed,
        role: "SUPERADMIN",
        isVerified: true,
        approvedBySuperAdmin: true
      },
      create: {
        email,
        name: "Super Admin",
        passwordHash: hashed,
        role: "SUPERADMIN",
        isVerified: true,
        approvedBySuperAdmin: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Credentials sync successful.",
      email: user.email,
      role: user.role
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
