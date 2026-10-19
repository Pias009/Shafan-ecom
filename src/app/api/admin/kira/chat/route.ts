import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/admin-session';
import { getKiraInsights, insightsForPrompt, type KiraInsights } from '@/lib/kira/insights';
import { TEAMS, TEAM_BY_ID, routeQuestion, type TeamId } from '@/lib/kira/teams';
import { getPausedTeams } from '@/lib/kira/team-state';

export const dynamic = 'force-dynamic';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.KIRA_MODEL || 'qwen/qwen3.8-27b';
const MAX_MESSAGE_CHARS = 2000;

/** Exact figures straight from the database, shown under the AI's prose so admins can verify it. */
function sourceLine(i: KiraInsights) {
  const o = i.overview;
  return `Live data (30 days): ${o.orders30} orders · AED ${o.revenue30.toLocaleString()} · ` +
    `${o.checkoutsStarted30} checkouts started → ${o.orders30} orders${o.checkoutToOrderRate ? ` (${o.checkoutToOrderRate})` : ''} · ` +
    `${o.toConfirm} to confirm · ${o.outOfStock} out of stock · ${o.lowStock} low-stock SKUs`;
}

/** Plain summary from the routed team, used when the AI model is unavailable. */
function fallbackReply(team: TeamId, i: KiraInsights, honorific: string, name: string) {
  const t = TEAM_BY_ID[team];
  const insight = i.teams[team];
  return `${honorific} ${name}, here is the ${t.name} team's update (AI model unavailable, so this is the live-data summary).\n\n` +
    insight.findings.map((f) => `• ${f}`).join('\n');
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').slice(0, MAX_MESSAGE_CHARS).trim();
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }
    const adminName = String(body.adminName || auth.user.name || 'Administrator').slice(0, 60);
    const adminRole = String(body.adminRole || 'Head').slice(0, 40);
    const honorific = String(body.honorific || 'Sir').slice(0, 20);
    // Accepts both { role, content } and the console's { sender, text } message shape.
    const history = (Array.isArray(body.history) ? body.history : [])
      .map((h: any) => ({
        role: h?.role === 'assistant' || h?.sender === 'kira' ? 'assistant' : 'user',
        content: String(h?.content ?? h?.text ?? ''),
      }))
      .filter((h: { content: string }) => h.content.trim());
    const voice = body.mode === 'voice';
    // The admin is answering Kira's opening "how are you?" when they open HQ.
    const greetingReply = body.stage === 'greeting-reply';
    const [insights, paused] = await Promise.all([getKiraInsights(), getPausedTeams()]);
    const activeTeams = TEAMS.filter((t) => !paused.includes(t.id));
    const explicitTeam: TeamId | null = TEAMS.some((t) => t.id === body.team) ? body.team : null;
    let team: TeamId = explicitTeam || routeQuestion(message);

    // A switched-off team doesn't work. Asked directly, say so; otherwise Kira answers herself.
    if (paused.includes(team)) {
      if (explicitTeam && !greetingReply) {
        const name = TEAM_BY_ID[team].name;
        return NextResponse.json({
          success: true,
          reply: `The ${name} team is switched off right now, so they have no report. Turn the team on and ask me again.`,
          model: 'Kira',
          liveData: sourceLine(insights),
          team,
          teamName: name,
          paused,
          timestamp: new Date().toISOString(),
        });
      }
      team = activeTeams[0]?.id ?? team;
    }

    const systemPrompt = `You are AGENT KIRA, chief of staff for the SHANFA store admin team (a skincare and beauty e-commerce business in six GCC countries).
You lead ${TEAMS.length} AI teams. Active: ${activeTeams.map((t) => t.name).join(', ') || 'none'}.${paused.length ? ` Switched off by the admin: ${paused.map((id) => TEAM_BY_ID[id].name).join(', ')} (they are not working; do not report on them, and say so if asked).` : ''} Each active team's live metrics and findings are in LIVE DATA.
This question was routed to the ${TEAM_BY_ID[team].name} team (mission: ${TEAM_BY_ID[team].mission}). Answer from that team's perspective, using other teams' data when relevant.

ADMIN: ${adminName} · ${adminRole} · address them as "${honorific} ${adminName}".
${greetingReply
  ? `\nCONTEXT: You just greeted the admin ("how are you doing?") and this message is their reply. Respond like a warm, natural human assistant: one short sentence reacting to what they said (if they ask how you are, answer briefly and kindly). Then give today's briefing: the two or three most important items across ALL teams (things that need attention first), each in one short sentence with the key number. Finish by asking what they would like to look at first. This spoken briefing may use up to 90 words.\n`
  : ''}
PERSONALITY: warm, calm and professional, like a trusted chief of staff. Speak naturally; small talk is fine, keep it brief.

RULES
- Copy numbers exactly as they appear in LIVE DATA; never round, re-derive or estimate them.
- Use ONLY the facts in LIVE DATA. Never invent metrics, rankings, percentages, product names, or actions you have taken.
- Anything listed under notConnected has no data source: say so plainly and suggest connecting one.
- You cannot change the store yourself. Recommend concrete next steps the admin can take in the panel.
${voice
  ? `- This answer will be SPOKEN ALOUD by a voice assistant. Reply in 1–3 short conversational sentences (under 60 words). No markdown, no bullet points, no emojis, no headings. Say money as "25,859 dirhams" rather than "AED 25,859". Only mention the numbers that answer the question. Do not start with a greeting or the admin's name every time.`
  : '- Be concise: at most 2–3 short paragraphs or a tight bullet list. Bold the key figures.'}

LIVE DATA (JSON)
${JSON.stringify(insightsForPrompt(insights, paused))}`;

    const base = { liveData: sourceLine(insights), team, teamName: TEAM_BY_ID[team].name, paused, timestamp: new Date().toISOString() };

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const res = await fetch(GROQ_URL, {
          method: 'POST',
          headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: voice ? 300 : 650,
            temperature: 0.2,
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.slice(-6).map((h: { role: string; content: string }) => ({
                role: h.role,
                content: h.content.slice(0, MAX_MESSAGE_CHARS),
              })),
              { role: 'user', content: message },
            ],
          }),
          signal: AbortSignal.timeout(25_000),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = String(data.choices?.[0]?.message?.content || '')
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .trim();
          if (reply) {
            return NextResponse.json({ success: true, reply, model: `${MODEL} (Groq)`, ...base });
          }
        } else {
          console.warn(`Kira: Groq returned ${res.status} for model ${MODEL}:`, (await res.text()).slice(0, 300));
        }
      } catch (groqError: any) {
        console.warn('Kira: Groq request failed, using live-data summary:', groqError?.message);
      }
    }

    return NextResponse.json({
      success: true,
      reply: fallbackReply(team, insights, honorific, adminName),
      model: 'Kira live-data summary',
      ...base,
    });
  } catch (error: any) {
    console.error('Agent Kira Chat Error:', error);
    return NextResponse.json({ success: false, error: 'Kira could not answer right now' }, { status: 500 });
  }
}
