import { prisma } from '@/lib/prisma';

export async function getAdminApiSession() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get('admin-session');

  if (!adminCookie) {
    return null;
  }

  try {
    const token = Buffer.from(adminCookie.value, 'base64').toString();
    const [userId] = token.split(':');

    if (!userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return null;
    }

    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      return null;
    }

    return { user };
  } catch {
    return null;
  }
}

export async function requireAdminApiSession() {
  const session = await getAdminApiSession();
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  return session;
}
