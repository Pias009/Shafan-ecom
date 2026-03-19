import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    // Find the user who is an ADMIN but has NO passwordHash (invited)
    const user = await prisma.user.findFirst({
      where: {
        email,
        role: 'ADMIN',
        passwordHash: null
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invitation not found or already verified' }, { status: 404 });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update the user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isVerified: true,
      }
    });

    // Optional: Log the activity
    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_SETUP_COMPLETE',
        actorId: user.id,
        details: `Admin account initialized for ${email}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('ADMIN_SETUP_FATAL:', error);
    return NextResponse.json({ error: 'Server error during setup' }, { status: 500 });
  }
}
