import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAdminStoreAccess as getStoreAccess } from '@/lib/admin-store-guard';

export type AdminStoreAccess = {
  storeIds: string[];
  isSuperAdmin: boolean;
  isGlobalAdmin: boolean;
  allowedStores: string[];
};

/**
 * @deprecated Use getAdminStoreAccess from admin-store-guard.ts instead
 * This function is kept for backward compatibility
 */
export async function getAdminStoreAccess(): Promise<AdminStoreAccess | null> {
  return getStoreAccess();
}

/**
 * @deprecated Use getAccessibleStoreIds from admin-store-guard.ts instead
 * This function is kept for backward compatibility
 */
export async function getAccessibleStoreIds(): Promise<string[]> {
  const access = await getStoreAccess();
  return access?.storeIds || [];
}

/**
 * @deprecated Use canAccessStore from admin-store-guard.ts instead
 * This function is kept for backward compatibility
 */
export async function canAccessStore(storeCode: string): Promise<boolean> {
  const access = await getStoreAccess();
  if (!access) return false;
  
  if (access.isSuperAdmin) return true;
  
  return access.allowedStores.includes(storeCode);
}

/**
 * Server-side guard to ensure admin has access
 * Returns user and store access information
 * @throws Error if not authenticated or not an admin
 */
export async function requireAdminStoreAccess() {
  const session = await getServerAuthSession();
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const userRole = session.user.role;
  
  if (!['ADMIN', 'SUPERADMIN'].includes(userRole)) {
    throw new Error('Forbidden: Admin access required');
  }

  const storeAccess = await getStoreAccess();
  
  if (!storeAccess) {
    throw new Error('Unauthorized: No store access');
  }

  return {
    user: session.user,
    storeAccess
  };
}

/**
 * Helper function to add store filtering to Prisma queries
 * @param baseQuery - The base Prisma query object
 * @returns Query object with store filtering applied
 */
export function withStoreFilter<T extends Record<string, any>>(baseQuery: T): T {
  // This is a placeholder for future use
  // In practice, you would use getAccessibleStoreIds() and add the filter
  return baseQuery;
}
