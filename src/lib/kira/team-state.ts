import prisma, { prismaWithRetry } from '@/lib/prisma';
import { TEAMS, type TeamId } from './teams';

// Which of Kira's teams an admin has switched off. Stored in the
// `kira_team_state` AppSettings row so every admin sees the same roster.

const SETTING_TYPE = 'kira_team_state';
const TTL_MS = 10_000;

let cache: { paused: TeamId[]; at: number } | null = null;

const isTeamId = (v: unknown): v is TeamId => TEAMS.some((t) => t.id === v);

export async function getPausedTeams(): Promise<TeamId[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.paused;
  try {
    const row = await prismaWithRetry(() => prisma.appSettings.findUnique({ where: { type: SETTING_TYPE } }), 2);
    const raw = (row?.data as { paused?: unknown } | null)?.paused;
    const paused = Array.isArray(raw) ? raw.filter(isTeamId) : [];
    cache = { paused, at: Date.now() };
    return paused;
  } catch (e: any) {
    console.warn('Kira: could not read team state, treating all teams as active:', e?.message);
    return cache?.paused ?? [];
  }
}

/** Turn one team (or every team) on or off. Returns the new paused list. */
export async function setTeamsActive(teams: TeamId[] | 'all', active: boolean): Promise<TeamId[]> {
  const ids = teams === 'all' ? TEAMS.map((t) => t.id) : teams;
  cache = null;
  const current = new Set(await getPausedTeams());
  ids.forEach((id) => (active ? current.delete(id) : current.add(id)));
  const paused = TEAMS.map((t) => t.id).filter((id) => current.has(id));
  await prismaWithRetry(
    () => prisma.appSettings.upsert({
      where: { type: SETTING_TYPE },
      create: { type: SETTING_TYPE, data: { paused } },
      update: { data: { paused } },
    }),
    2,
  );
  cache = { paused, at: Date.now() };
  return paused;
}

export { isTeamId };
