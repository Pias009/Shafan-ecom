import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_FALLBACK_TOKEN = 'KIRA-SEC-9842-88F1';

function normalizeToken(t: string): string {
  return t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Access token is required' },
        { status: 400 }
      );
    }

    const inputNormalized = normalizeToken(token);

    // Retrieve active token from DB
    const setting = await prisma.appSettings.findUnique({
      where: { type: 'kira_lock_security' },
    });

    const dbData = (setting?.data as Record<string, any>) || {};
    const validToken = dbData.token || DEFAULT_FALLBACK_TOKEN;
    const validNormalized = normalizeToken(validToken);

    if (inputNormalized === validNormalized) {
      return NextResponse.json({
        success: true,
        message: 'Security token verified. Welcome Commander.',
        unlockedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid security access token. Biometric & cryptographic barrier active.',
      },
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
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { type: 'kira_lock_security' },
    });
    const dbData = (setting?.data as Record<string, any>) || {};

    return NextResponse.json({
      status: 'LOCKED',
      tokenConfigured: !!dbData.token,
      hint: 'Enter your classified security access token to access Agent Kira.',
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'LOCKED', error: err.message }, { status: 500 });
  }
}
