import { prisma } from './prisma';
import { randomBytes, pbkdf2Sync } from 'crypto';

// Secret configuration - these should be set via environment variables
const MASTER_ID = process.env.MASTER_LOCK_ID || randomBytes(32).toString('hex');
const SECRET_PATH = process.env.SECRET_LOCK_PATH || `/master-${randomBytes(16).toString('hex')}`;
const UNLOCK_TOKEN_SECRET = process.env.UNLOCK_TOKEN_SECRET || randomBytes(64).toString('hex');

// Cache for lock state to avoid DB hits on every request
let lockStateCache: { isLocked: boolean; lockedAt: Date | null; unlockToken: string } | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 seconds

/**
 * Initialize the website lock system
 * Creates initial lock state and master auth if they don't exist
 */
export async function initializeLockSystem() {
  try {
    // Check if website lock exists
    let lockState = await prisma.websiteLock.findFirst();
    
    if (!lockState) {
      // Create initial lock state (unlocked by default)
      const unlockToken = randomBytes(32).toString('hex');
      lockState = await prisma.websiteLock.create({
        data: {
          isLocked: false,
          unlockToken,
          emergencyBypassCode: randomBytes(16).toString('hex'),
        },
      });
      console.log('🔒 Website lock system initialized');
    }

    // Check if master auth exists
    const masterAuth = await prisma.masterAuth.findFirst();
    
    if (!masterAuth) {
      // Generate a secure master token
      const masterToken = randomBytes(32).toString('hex');
      const salt = randomBytes(16).toString('hex');
      const tokenHash = hashToken(masterToken, salt);
      
      await prisma.masterAuth.create({
        data: {
          masterId: MASTER_ID,
          tokenHash,
          salt,
          isActive: true,
        },
      });
      
      // Log the credentials (in production, this should be stored securely elsewhere)
      console.log('🔑 Master credentials generated');
      console.log(`📁 Secret path: ${SECRET_PATH}`);
      console.log(`🔐 Master ID: ${MASTER_ID}`);
      console.log(`🔑 Master Token: ${masterToken}`);
      console.log('⚠️  Save these credentials securely! They will not be shown again.');
    }

    return { lockState, secretPath: SECRET_PATH };
  } catch (error) {
    console.error('Failed to initialize lock system:', error);
    throw error;
  }
}

/**
 * Get current lock state with caching
 */
export async function getLockState() {
  const now = Date.now();
  
  if (lockStateCache && (now - cacheTimestamp) < CACHE_TTL) {
    return lockStateCache;
  }
  
  const lockState = await prisma.websiteLock.findFirst();
  
  if (!lockState) {
    // Initialize if not exists
    await initializeLockSystem();
    const newState = await prisma.websiteLock.findFirst();
    lockStateCache = {
      isLocked: newState?.isLocked || false,
      lockedAt: newState?.lockedAt || null,
      unlockToken: newState?.unlockToken || '',
    };
  } else {
    lockStateCache = {
      isLocked: lockState.isLocked,
      lockedAt: lockState.lockedAt,
      unlockToken: lockState.unlockToken,
    };
  }
  
  cacheTimestamp = now;
  return lockStateCache;
}

/**
 * Check if website is currently locked
 */
export async function isWebsiteLocked(): Promise<boolean> {
  const state = await getLockState();
  return state.isLocked;
}

/**
 * Lock the website
 */
export async function lockWebsite(masterId: string, ipAddress: string, userAgent?: string) {
  // Verify master authentication
  const isValid = await verifyMasterAuth(masterId);
  if (!isValid) {
    throw new Error('Invalid master credentials');
  }

  const unlockToken = randomBytes(32).toString('hex');
  
  const lockState = await prisma.websiteLock.updateMany({
    data: {
      isLocked: true,
      lockedAt: new Date(),
      lockedBy: masterId,
      lockReason: 'Manual lock via secret panel',
      unlockToken,
    },
  });

  // Clear cache
  lockStateCache = null;

  // Log the action
  await prisma.lockAuditLog.create({
    data: {
      action: 'LOCK',
      masterId,
      ipAddress,
      userAgent,
      metadata: {
        unlockToken,
        timestamp: new Date().toISOString(),
      },
    },
  });

  return { success: true, unlockToken };
}

/**
 * Unlock the website
 */
export async function unlockWebsite(masterId: string, unlockToken: string, ipAddress: string, userAgent?: string) {
  // Verify master authentication
  const isValid = await verifyMasterAuth(masterId);
  if (!isValid) {
    throw new Error('Invalid master credentials');
  }

  const lockState = await prisma.websiteLock.findFirst();
  if (!lockState) {
    throw new Error('Lock state not found');
  }

  if (lockState.unlockToken !== unlockToken) {
    // Log failed attempt
    await prisma.lockAuditLog.create({
      data: {
        action: 'UNLOCK_FAILED',
        masterId,
        ipAddress,
        userAgent,
        metadata: {
          reason: 'Invalid unlock token',
          attemptedToken: unlockToken,
        },
      },
    });
    throw new Error('Invalid unlock token');
  }

  await prisma.websiteLock.updateMany({
    data: {
      isLocked: false,
      lockedAt: null,
      lockedBy: null,
      lockReason: null,
      unlockToken: randomBytes(32).toString('hex'), // Generate new token
    },
  });

  // Clear cache
  lockStateCache = null;

  // Log the action
  await prisma.lockAuditLog.create({
    data: {
      action: 'UNLOCK',
      masterId,
      ipAddress,
      userAgent,
      metadata: {
        previousLockDuration: lockState.lockedAt ? 
          Date.now() - lockState.lockedAt.getTime() : 0,
      },
    },
  });

  return { success: true };
}

/**
 * Verify master authentication
 */
export async function verifyMasterAuth(masterId: string, token?: string): Promise<boolean> {
  try {
    const masterAuth = await prisma.masterAuth.findFirst({
      where: { masterId, isActive: true },
    });

    if (!masterAuth) {
      return false;
    }

    // If token is provided, verify it
    if (token) {
      const hash = hashToken(token, masterAuth.salt);
      return hash === masterAuth.tokenHash;
    }

    // If no token provided, just check if masterId exists
    return true;
  } catch (error) {
    console.error('Master auth verification failed:', error);
    return false;
  }
}

/**
 * Hash a token with salt
 */
function hashToken(token: string, salt: string): string {
  return pbkdf2Sync(token, salt, 10000, 64, 'sha512')
    .toString('hex');
}

/**
 * Generate a new master token
 */
export async function rotateMasterToken(masterId: string, oldToken: string): Promise<{ newToken: string }> {
  const isValid = await verifyMasterAuth(masterId, oldToken);
  if (!isValid) {
    throw new Error('Invalid master credentials');
  }

  const newToken = randomBytes(32).toString('hex');
  const salt = randomBytes(16).toString('hex');
  const tokenHash = hashToken(newToken, salt);

  await prisma.masterAuth.updateMany({
    where: { masterId },
    data: {
      tokenHash,
      salt,
      lastUsed: new Date(),
    },
  });

  // Log token rotation
  await prisma.lockAuditLog.create({
    data: {
      action: 'TOKEN_ROTATED',
      masterId,
      ipAddress: 'SYSTEM',
      metadata: {
        rotationTime: new Date().toISOString(),
      },
    },
  });

  return { newToken };
}

/**
 * Get secret path for the panel
 */
export function getSecretPath(): string {
  return SECRET_PATH;
}

/**
 * Log access attempt to secret path
 */
export async function logSecretAccess(
  path: string, 
  ipAddress: string, 
  userAgent: string | undefined, 
  success: boolean, 
  reason?: string
) {
  try {
    await prisma.secretAccessLog.create({
      data: {
        path,
        ipAddress,
        userAgent,
        success,
        reason,
      },
    });
  } catch (error) {
    // Don't throw - logging failures shouldn't break the system
    console.error('Failed to log secret access:', error);
  }
}

/**
 * Get audit logs (for admin panel)
 */
export async function getAuditLogs(limit = 100) {
  return await prisma.lockAuditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Emergency bypass check (for extreme cases)
 */
export async function checkEmergencyBypass(code: string): Promise<boolean> {
  const lockState = await prisma.websiteLock.findFirst();
  return lockState?.emergencyBypassCode === code;
}