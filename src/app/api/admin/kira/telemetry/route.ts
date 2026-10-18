import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-session';
import { getKiraInsights } from '@/lib/kira/insights';

export const dynamic = 'force-dynamic';

/** Live team insights for the Agent Kira console (cached ~30s server-side). */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const insights = await getKiraInsights();
    return NextResponse.json({ success: true, ...insights }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error: any) {
    console.error('Kira insights failed:', error?.message || error);
    return NextResponse.json({ success: false, error: 'Live data is temporarily unavailable' }, { status: 503 });
  }
}
