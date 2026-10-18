import { prisma, prismaWithRetry } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { cache } from 'react';
import { ADMIN_COOKIE, verifyAdminToken } from '@/lib/admin-token';

export type AdminStoreAccess = {
  storeIds: string[];
  isSuperAdmin: boolean;
  isGlobalAdmin: boolean;
  allowedStores: string[];
  userCountry?: string;
};

export type AdminUser = {
  id: string;
  email: string | null;
  name: string | null;
  role: 'ADMIN' | 'SUPERADMIN';
};

// Warm serverless instances reuse these maps, so most admin API calls skip the
// user/store lookups entirely. TTLs are short so role changes apply quickly.
const USER_TTL_MS = 20_000;
/** If the database is briefly unreachable, keep trusting a recently verified admin this long. */
const USER_STALE_OK_MS = 15 * 60_000;
const STORES_TTL_MS = 60_000;
const userCache = new Map<string, { user: AdminUser | null; expires: number; verifiedAt: number }>();

/** The admin's token is valid but the database could not be reached to check the account. */
export class AdminSessionUnavailableError extends Error {
  constructor(cause?: unknown) {
    super('Admin session could not be verified: database temporarily unavailable');
    this.name = 'AdminSessionUnavailableError';
    (this as any).cause = cause;
  }
}
let storesCache: { stores: { id: string; code: string }[]; expires: number } | null = null;

function isAdminRole(role: unknown): role is AdminUser['role'] {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

async function readToken(): Promise<string | null> {
  try {
    const authHeader = (await headers()).get('authorization');
    if (authHeader?.startsWith('Bearer ')) return authHeader.substring(7).trim();
  } catch {}
  try {
    return (await cookies()).get(ADMIN_COOKIE)?.value ?? null;
  } catch {}
  return null;
}

async function loadAdminUser(userId: string): Promise<AdminUser | null> {
  const hit = userCache.get(userId);
  if (hit && hit.expires > Date.now()) return hit.user;

  let user;
  try {
    user = await prismaWithRetry(
      () => prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, role: true },
      }),
      2,
    );
  } catch (error) {
    // Database blip: keep a recently verified admin signed in instead of logging them out.
    if (hit?.user && Date.now() - hit.verifiedAt < USER_STALE_OK_MS) {
      console.warn('[admin-session] user lookup failed; using recently verified session:', (error as Error)?.message?.split('\n').pop());
      return hit.user;
    }
    throw new AdminSessionUnavailableError(error);
  }
  const admin = user && isAdminRole(user.role) ? (user as AdminUser) : null;

  if (userCache.size > 500) userCache.clear();
  const now = Date.now();
  userCache.set(userId, { user: admin, expires: now + USER_TTL_MS, verifiedAt: now });
  return admin;
}

/** Drop a cached admin lookup, e.g. after changing a user's role. */
export function invalidateAdminUser(userId: string) {
  userCache.delete(userId);
}

// Deduplicated per request: layouts, pages and helpers can all call this freely.
const resolveAdmin = cache(async (): Promise<AdminUser | null> => {
  const payload = await verifyAdminToken(await readToken());
  if (payload) {
    // Throws AdminSessionUnavailableError on a database outage: a valid login must not
    // be treated as "logged out" just because the account could not be checked.
    const user = await loadAdminUser(payload.uid);
    if (user) return user;
  }

  // Storefront NextAuth session belonging to an admin.
  try {
    const { getServerAuthSession } = await import('@/lib/auth');
    const authSession = await getServerAuthSession();
    if (authSession?.user && isAdminRole(authSession.user.role)) {
      return authSession.user as AdminUser;
    }
  } catch {}

  return null;
});

export async function getAdminSession() {
  return resolveAdmin();
}

export async function requireAdminSession() {
  const session = await resolveAdmin();
  if (!session) redirect('/ueadmin/login');
  return session;
}

export async function getAdminApiSession() {
  const user = await resolveAdmin();
  return user ? { user } : null;
}

/**
 * Guard for admin route handlers.
 *   const auth = await requireAdminApi();
 *   if (auth instanceof NextResponse) return auth;
 */
export async function requireAdminApi(opts: { superAdmin?: boolean } = {}) {
  let user: AdminUser | null;
  try {
    user = await resolveAdmin();
  } catch (error) {
    if (error instanceof AdminSessionUnavailableError) {
      return NextResponse.json({ error: 'Temporarily unavailable, please retry' }, { status: 503, headers: { 'Retry-After': '5' } });
    }
    throw error;
  }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (opts.superAdmin && user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { user };
}

async function getActiveStores() {
  if (storesCache && storesCache.expires > Date.now()) return storesCache.stores;
  const stores = await prisma.store.findMany({
    where: { active: true },
    select: { id: true, code: true },
  });
  storesCache = { stores, expires: Date.now() + STORES_TTL_MS };
  return stores;
}

export const getAdminStoreAccess = cache(async (): Promise<AdminStoreAccess | null> => {
  const session = await resolveAdmin();
  if (!session) return null;

  const allStores = await getActiveStores();
  return {
    storeIds: allStores.map((s) => s.id),
    isSuperAdmin: session.role === 'SUPERADMIN',
    isGlobalAdmin: true,
    allowedStores: allStores.map((s) => s.code),
    userCountry: undefined,
  };
});

export async function getAccessibleStoreIds(): Promise<string[]> {
  const access = await getAdminStoreAccess();
  return access?.storeIds || [];
}
