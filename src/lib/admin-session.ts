import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export type AdminStoreAccess = {
  storeIds: string[];
  isSuperAdmin: boolean;
  isGlobalAdmin: boolean;
  allowedStores: string[];
  userCountry?: string;
};

export async function getAdminSession() {
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

    return user;
  } catch {
    return null;
  }
}

export async function requireAdminSession() {
  const session = await getAdminSession();
  
  if (!session) {
    redirect('/ueadmin/login');
  }
  
  return session;
}

export async function getAdminStoreAccess(): Promise<AdminStoreAccess | null> {
  const session = await getAdminSession();
  
  if (!session) {
    return null;
  }

  const userRole = session.role;
  
  if (userRole === 'SUPERADMIN' || userRole === 'ADMIN') {
    const allStores = await prisma.store.findMany({
      where: { active: true },
      select: { id: true, code: true, country: true }
    });
    
    return {
      storeIds: allStores.map(s => s.id),
      isSuperAdmin: userRole === 'SUPERADMIN',
      isGlobalAdmin: true,
      allowedStores: allStores.map(s => s.code),
      userCountry: undefined
    };
  }

  return null;
}

export async function getAccessibleStoreIds(): Promise<string[]> {
  const access = await getAdminStoreAccess();
  return access?.storeIds || [];
}

export async function getAdminApiSession() {
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
