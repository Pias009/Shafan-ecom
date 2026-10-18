import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

function normalizeToken(t: string): string {
  return t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/** KIRA_ACCESS_TOKEN env wins; otherwise the `kira_lock_security` AppSettings row. No built-in default. */
async function getConfiguredToken(): Promise<string | null> {
  if (process.env.KIRA_ACCESS_TOKEN) return process.env.KIRA_ACCESS_TOKEN;
  const setting = await prisma.appSettings.findUnique({ where: { type: 'kira_lock_security' } });
  const token = (setting?.data as Record<string, unknown> | null)?.token;
  return typeof token === 'string' && token.trim() ? token : null;
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Access token is required' },
        { status: 400 }
      );
    }

    const configured = await getConfiguredToken();
    if (!configured) {
      return NextResponse.json(
        { success: false, message: 'No Kira access token is configured. Set KIRA_ACCESS_TOKEN or the kira_lock_security setting.' },
        { status: 503 }
      );
    }

    const input = Buffer.from(normalizeToken(token));
    const expected = Buffer.from(normalizeToken(configured));
    if (input.length === expected.length && timingSafeEqual(input, expected)) {
      return NextResponse.json({
        success: true,
        message: 'Security token verified. Welcome Commander.',
        unlockedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid access token.' },
      { status: 401 }
    );
  } catch (err: any) {
    console.error('Error verifying Kira access token:', err);
    return NextResponse.json(
      { success: false, message: 'Internal verification fault' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    return NextResponse.json({
      status: 'LOCKED',
      tokenConfigured: !!(await getConfiguredToken()),
      hint: 'Enter your access token to open Agent Kira.',
    });
  } catch {
    return NextResponse.json({ status: 'LOCKED', error: 'Status check failed' }, { status: 500 });
  }
}
