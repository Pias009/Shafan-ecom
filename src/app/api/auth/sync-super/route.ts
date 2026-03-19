import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    const email = "pvs178380@gmail.com";
    const password = "superadmin123";
    const hashed = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash: hashed,
        role: "SUPERADMIN",
        isVerified: true
      },
      create: {
        email,
        name: "Super Admin",
        passwordHash: hashed,
        role: "SUPERADMIN",
        isVerified: true
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
