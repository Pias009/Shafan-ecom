import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type AdminStoreAccess = {
  storeIds: string[];
  isSuperAdmin: boolean;
  isGlobalAdmin: boolean;
  allowedStores: string[];
};

/**
 * Get admin store access permissions for the current session
 * SUPERADMIN: has access to all stores
 * ADMIN with store assignments: only assigned stores
 * ADMIN without assignments: no store access (should be assigned)
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
      select: { id: true, code: true }
    });
    
    return {
      storeIds: allStores.map(s => s.id),
      isSuperAdmin: true,
      isGlobalAdmin: true,
      allowedStores: allStores.map(s => s.code)
    };
  }

  // ADMIN role - check store assignments
  if (userRole === 'ADMIN') {
    // For now, we'll implement a simple country-based assignment
    // In a real system, you'd have a AdminStoreAssignment model
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true }
    });

    if (!user?.country) {
      // Admin without country assignment - no access
      return {
        storeIds: [],
        isSuperAdmin: false,
        isGlobalAdmin: false,
        allowedStores: []
      };
    }

    // Find stores in the admin's country
    const stores = await prisma.store.findMany({
      where: { 
        country: user.country.toUpperCase(),
        active: true 
      },
      select: { id: true, code: true }
    });

    return {
      storeIds: stores.map(s => s.id),
      isSuperAdmin: false,
      isGlobalAdmin: user.country === 'UAE', // UAE admins are global
      allowedStores: stores.map(s => s.code)
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
  
  return access.allowedStores.includes(storeCode);
}

/**
 * Get store IDs that the admin can access for database queries
 */
export async function getAccessibleStoreIds(): Promise<string[]> {
  const access = await getAdminStoreAccess();
  return access?.storeIds || [];
}

/**
 * Middleware-like function to protect admin API routes
 */
export async function requireAdminStoreAccess(requiredStoreCode?: string) {
  const session = await getServerAuthSession();
  
  if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role)) {
    throw new Error('Unauthorized: Admin access required');
  }

  const access = await getAdminStoreAccess();
  if (!access) {
    throw new Error('Unauthorized: No store access');
  }

  if (requiredStoreCode && !access.allowedStores.includes(requiredStoreCode)) {
    throw new Error(`Forbidden: No access to store ${requiredStoreCode}`);
  }

  return {
    user: session.user,
    storeAccess: access
  };
}

/**
 * Helper to add store filtering to Prisma queries
 */
export function withStoreFilter(storeIds: string[]) {
  if (storeIds.length === 0) {
    return { storeId: { in: [] } }; // No access
  }
  return { storeId: { in: storeIds } };
}