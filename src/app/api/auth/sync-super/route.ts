import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
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
