import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-session';
import { getPausedTeams, isTeamId, setTeamsActive } from '@/lib/kira/team-state';

export const dynamic = 'force-dynamic';

/** Which Kira teams are switched off. */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json({ success: true, paused: await getPausedTeams() }, { headers: { 'Cache-Control': 'private, no-store' } });
}

/** Turn a team on or off: { team: TeamId | 'all', active: boolean }. */
export async function PUT(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  const body = await req.json().catch(() => ({}));
  if (typeof body.active !== 'boolean' || !(body.team === 'all' || isTeamId(body.team))) {
    return NextResponse.json({ success: false, error: 'Expected { team, active }' }, { status: 400 });
  }
  try {
    const paused = await setTeamsActive(body.team === 'all' ? 'all' : [body.team], body.active);
    return NextResponse.json({ success: true, paused });
  } catch (e: any) {
    console.error('Kira: team toggle failed:', e?.message || e);
    return NextResponse.json({ success: false, error: 'Could not save the team setting' }, { status: 503 });
  }
}
