import { NextRequest, NextResponse } from 'next/server';
import { 
  getLockState, 
  lockWebsite, 
  unlockWebsite, 
  verifyMasterAuth, 
  getSecretPath,
  logSecretAccess,
  getAuditLogs,
  rotateMasterToken,
  checkEmergencyBypass
} from '@/lib/website-lock';
import crypto from 'crypto';

// Rate limiting store
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(ip);
  
  if (!record) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (now > record.resetTime) {
    rateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function GET(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const path = req.nextUrl.pathname;
   
  // Check rate limiting
  if (!checkRateLimit(ipAddress)) {
    await logSecretAccess(path, ipAddress, userAgent, false, 'Rate limit exceeded');
    return new NextResponse('Too many requests', { status: 429 });
  }
  
  // Check if this is the correct secret path
  const secretPath = getSecretPath();
  if (path !== secretPath) {
    await logSecretAccess(path, ipAddress, userAgent, false, 'Invalid secret path');
    // Return 404 to not reveal existence
    return new NextResponse('Not Found', { status: 404 });
  }
  
  // Check for authentication token
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    await logSecretAccess(path, ipAddress, userAgent, false, 'No authentication token');
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    );
  }
  
  // Verify the token
  const masterId = process.env.MASTER_LOCK_ID;
  if (!masterId) {
    await logSecretAccess(path, ipAddress, userAgent, false, 'Master ID not configured');
    return NextResponse.json({ error: 'System misconfigured' }, { status: 500 });
  }
  
  const isValid = await verifyMasterAuth(masterId, token);
  if (!isValid) {
    await logSecretAccess(path, ipAddress, userAgent, false, 'Invalid authentication token');
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 403 });
  }
  
  // Authentication successful
  await logSecretAccess(path, ipAddress, userAgent, true, 'Authenticated access');
  
  // Get current lock state and audit logs
  const lockState = await getLockState();
  const auditLogs = await getAuditLogs(50);
  
  return NextResponse.json({
    success: true,
    panel: 'Super Secret Developer Panel',
    lockState: {
      isLocked: lockState.isLocked,
      lockedAt: lockState.lockedAt,
      unlockToken: lockState.isLocked ? lockState.unlockToken : undefined,
    },
    auditLogs: auditLogs.slice(0, 10), // Return only recent logs
    actions: {
      lock: `${req.nextUrl.origin}${path}?action=lock`,
      unlock: `${req.nextUrl.origin}${path}?action=unlock`,
      rotateToken: `${req.nextUrl.origin}${path}?action=rotateToken`,
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const path = req.nextUrl.pathname;
  
  // Check rate limiting
  if (!checkRateLimit(ipAddress)) {
    await logSecretAccess(path, ipAddress, userAgent, false, 'Rate limit exceeded');
    return new NextResponse('Too many requests', { status: 429 });
  }
  
  // Check if this is the correct secret path
  const secretPath = getSecretPath();
  if (path !== secretPath) {
    await logSecretAccess(path, ipAddress, userAgent, false, 'Invalid secret path');
    return new NextResponse('Not Found', { status: 404 });
  }
  
  // Check for authentication token
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  
  if (!token) {
    await logSecretAccess(path, ipAddress, userAgent, false, 'No authentication token');
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } }
    );
  }
  
  // Verify the token
  const masterId = process.env.MASTER_LOCK_ID;
  if (!masterId) {
    await logSecretAccess(path, ipAddress, userAgent, false, 'Master ID not configured');
    return NextResponse.json({ error: 'System misconfigured' }, { status: 500 });
  }
  
  const isValid = await verifyMasterAuth(masterId, token);
  if (!isValid) {
    await logSecretAccess(path, ipAddress, userAgent, false, 'Invalid authentication token');
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 403 });
  }
  
  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  
  const { action, unlockToken, emergencyCode } = body;
  
  // Handle different actions
  switch (action) {
    case 'lock':
      try {
        const result = await lockWebsite(masterId, ipAddress, userAgent);
        await logSecretAccess(path, ipAddress, userAgent, true, 'Website locked');
        return NextResponse.json({
          success: true,
          message: 'Website locked successfully',
          unlockToken: result.unlockToken,
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        await logSecretAccess(path, ipAddress, userAgent, false, `Lock failed: ${error.message}`);
        return NextResponse.json(
          { error: 'Failed to lock website', details: error.message },
          { status: 500 }
        );
      }
      
    case 'unlock':
      if (!unlockToken) {
        return NextResponse.json(
          { error: 'Unlock token required' },
          { status: 400 }
        );
      }
      
      try {
        await unlockWebsite(masterId, unlockToken, ipAddress, userAgent);
        await logSecretAccess(path, ipAddress, userAgent, true, 'Website unlocked');
        return NextResponse.json({
          success: true,
          message: 'Website unlocked successfully',
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        await logSecretAccess(path, ipAddress, userAgent, false, `Unlock failed: ${error.message}`);
        return NextResponse.json(
          { error: 'Failed to unlock website', details: error.message },
          { status: 400 }
        );
      }
      
    case 'rotateToken':
      try {
        const result = await rotateMasterToken(masterId, token);
        await logSecretAccess(path, ipAddress, userAgent, true, 'Token rotated');
        return NextResponse.json({
          success: true,
          message: 'Token rotated successfully',
          newToken: result.newToken,
          warning: 'Save this token securely! It will not be shown again.',
          timestamp: new Date().toISOString(),
        });
      } catch (error: any) {
        await logSecretAccess(path, ipAddress, userAgent, false, `Token rotation failed: ${error.message}`);
        return NextResponse.json(
          { error: 'Failed to rotate token', details: error.message },
          { status: 400 }
        );
      }
      
    case 'emergencyBypass':
      if (!emergencyCode) {
        return NextResponse.json(
          { error: 'Emergency code required' },
          { status: 400 }
        );
      }
      
      const isValidCode = await checkEmergencyBypass(emergencyCode);
      if (!isValidCode) {
        await logSecretAccess(path, ipAddress, userAgent, false, 'Invalid emergency code');
        return NextResponse.json(
          { error: 'Invalid emergency code' },
          { status: 403 }
        );
      }
      
      // Emergency bypass granted - return current lock state
      const lockState = await getLockState();
      await logSecretAccess(path, ipAddress, userAgent, true, 'Emergency bypass granted');
      return NextResponse.json({
        success: true,
        emergencyAccess: true,
        lockState: {
          isLocked: lockState.isLocked,
          lockedAt: lockState.lockedAt,
          unlockToken: lockState.unlockToken,
        },
        warning: 'Emergency access granted. Use with extreme caution.',
        timestamp: new Date().toISOString(),
      });
      
    default:
      return NextResponse.json(
        { error: 'Invalid action', validActions: ['lock', 'unlock', 'rotateToken', 'emergencyBypass'] },
        { status: 400 }
      );
  }
}

// Handle other HTTP methods
export async function PUT(req: NextRequest) {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function DELETE(req: NextRequest) {
  return new NextResponse('Method Not Allowed', { status: 405 });
}

export async function PATCH(req: NextRequest) {
  return new NextResponse('Method Not Allowed', { status: 405 });
}