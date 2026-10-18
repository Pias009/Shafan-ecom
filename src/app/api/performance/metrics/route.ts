import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// Real-user speed (Core Web Vitals) and JS errors from the storefront
// (src/components/SiteHealthReporter.tsx). Read by Kira's Engineering team.
const ACCEPTED = new Set(["lcp", "inp", "fid", "cls", "fcp", "ttfb", "long_task", "js_error", "api_call", "page_load"]);
const MAX_PER_REQUEST = 50;
const MAX_METADATA_BYTES = 2000;

function cleanMetadata(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const json = JSON.stringify(raw);
  if (json.length <= MAX_METADATA_BYTES) return raw as Record<string, unknown>;
  // Too big: keep only short string fields.
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 8)) {
    out[k.slice(0, 40)] = typeof v === "string" ? v.slice(0, 300) : typeof v === "number" || typeof v === "boolean" ? v : null;
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.metrics)) {
      return NextResponse.json({ error: "Invalid metrics data" }, { status: 400 });
    }

    const now = Date.now();
    const metrics = body.metrics
      .slice(0, MAX_PER_REQUEST)
      .filter((m: any) => m && ACCEPTED.has(String(m.name)) && Number.isFinite(Number(m.value)))
      .map((m: any) => {
        const ts = Number(m.timestamp);
        return {
          name: String(m.name),
          value: Math.max(0, Math.min(Number(m.value), 600_000)),
          unit: String(m.unit || "ms").slice(0, 12),
          metadata: cleanMetadata(m.metadata) as object,
          sessionId: String(body.sessionId || "unknown").slice(0, 80),
          userAgent: String(body.userAgent || "").slice(0, 200),
          connectionType: String(body.connection || "").slice(0, 20),
          // Ignore client clocks that are wildly off.
          timestamp: new Date(Number.isFinite(ts) && Math.abs(ts - now) < 86_400_000 ? ts : now),
        };
      });

    if (metrics.length > 0) {
      try {
        await prisma.performanceMetric.createMany({ data: metrics });
      } catch (dbError) {
        console.error("Failed to store performance metrics:", dbError);
      }
    }

    return NextResponse.json(
      { success: true, received: body.metrics.length, stored: metrics.length },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Performance metrics API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  // Admin-only: summaries of real-user metrics.
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "100", 10) || 100, 1), 1000);

    const metrics = await prisma.performanceMetric.findMany({
      take: limit,
      orderBy: { timestamp: "desc" },
      select: { id: true, name: true, value: true, unit: true, timestamp: true, sessionId: true },
    });

    const averages = metrics.reduce((acc: Record<string, { sum: number; count: number }>, m) => {
      acc[m.name] ||= { sum: 0, count: 0 };
      acc[m.name].sum += m.value;
      acc[m.name].count++;
      return acc;
    }, {});

    return NextResponse.json({
      metrics: metrics.slice(0, 10),
      insights: Object.entries(averages).map(([name, d]) => ({ metric: name, average: d.count ? d.sum / d.count : 0, count: d.count })),
      total: metrics.length,
    });
  } catch (error) {
    console.error("Failed to fetch performance metrics:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
