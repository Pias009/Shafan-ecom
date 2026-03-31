import { NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = session.user.role;
    
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // SUPERADMIN doesn't have a country restriction
    if (userRole === 'SUPERADMIN') {
      return NextResponse.json({ 
        country: null,
        isSuperAdmin: true 
      });
    }

    // For ADMIN, get their country assignment
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { country: true }
    });

    return NextResponse.json({ 
      country: user?.country || null,
      isSuperAdmin: false
    });
  } catch (error) {
    console.error('Error fetching admin country:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
