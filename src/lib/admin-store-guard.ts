import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export type AdminStoreAccess = {
  storeIds: string[];
  isSuperAdmin: boolean;
  isGlobalAdmin: boolean;
  allowedStores: string[];
  userCountry?: string;
};

/**
 * Get admin store access permissions for the current session
 * SUPERADMIN: has access to all stores
 * ADMIN with country assignment: only stores in their country
 * ADMIN without assignment: no store access
 */
export async function getAdminStoreAccess(): Promise<AdminStoreAccess | null> {
  const session = await getServerAuthSession();
  
  if (!session?.user) {
    return null;
  }

  const userRole = session.user.role;
  const userId = session.user.id;
  
  // SUPERADMIN has access to all stores
  if (userRole === 'SUPERADMIN') {
    const allStores = await prisma.store.findMany({
      where: { active: true },
      select: { id: true, code: true, country: true }
    });
    
    return {
      storeIds: allStores.map(s => s.id),
      isSuperAdmin: true,
      isGlobalAdmin: true,
      allowedStores: allStores.map(s => s.code),
      userCountry: undefined
    };
  }

  // ADMIN role - all admins now have global access
  if (userRole === 'ADMIN') {
    const allStores = await prisma.store.findMany({
      where: { active: true },
      select: { id: true, code: true, country: true }
    });
    
    return {
      storeIds: allStores.map(s => s.id),
      isSuperAdmin: false,
      isGlobalAdmin: true,
      allowedStores: allStores.map(s => s.code),
      userCountry: undefined
    };
  }

  // Not an admin
  return null;
}

/**
 * Check if admin has access to a specific store
 */
export async function canAccessStore(storeCode: string): Promise<boolean> {
  const access = await getAdminStoreAccess();
  if (!access) return false;
  
  if (access.isSuperAdmin) return true;
  
  // Case-insensitive comparison
  const normalizedStoreCode = storeCode.toUpperCase();
  return access.allowedStores.some(store => store.toUpperCase() === normalizedStoreCode);
}

/**
 * Get store IDs that the admin can access for database queries
 */
export async function getAccessibleStoreIds(): Promise<string[]> {
  const access = await getAdminStoreAccess();
  return access?.storeIds || [];
}

/**
 * Get the admin's country code
 */
export async function getAdminCountry(): Promise<string | null> {
  const access = await getAdminStoreAccess();
  return access?.userCountry || null;
}

/**
 * Server-side guard to ensure admin has access to a specific store
 * Redirects to unauthorized page if access is denied
 */
export async function requireStoreAccess(storeCode: string): Promise<void> {
  const hasAccess = await canAccessStore(storeCode);
  
  if (!hasAccess) {
    redirect('/ueadmin/unauthorized');
  }
}

/**
 * Server-side guard - validates admin role (global access)
 */
export async function requireUAEAccess(): Promise<void> {
  const session = await getServerAuthSession();
  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes((session.user as any)?.role)) {
    redirect('/ueadmin/unauthorized');
  }
}

/**
 * Get store information by code with access check
 */
export async function getAccessibleStore(storeCode: string) {
  const hasAccess = await canAccessStore(storeCode);
  
  if (!hasAccess) {
    return null;
  }
  
  // Try to find store with case-insensitive match
  const stores = await prisma.store.findMany({
    where: {
      code: {
        equals: storeCode,
        mode: 'insensitive'
      }
    }
  });
  
  return stores[0] || null;
}