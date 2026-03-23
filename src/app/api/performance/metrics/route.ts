import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate the request
    if (!body.metrics || !Array.isArray(body.metrics)) {
      return NextResponse.json(
        { error: "Invalid metrics data" },
        { status: 400 }
      );
    }

    // In a production environment, you would:
    // 1. Store metrics in a time-series database
    // 2. Aggregate data for analytics
    // 3. Set up alerts for performance regressions
    
    // For now, we'll just log and store a subset of critical metrics
    const criticalMetrics = body.metrics.filter((metric: any) => {
      return [
        'lcp', 'fid', 'cls', 'fcp', 'ttfb', 'long_task', 
        'js_error', 'api_call', 'page_load'
      ].includes(metric.name);
    });

    if (criticalMetrics.length > 0) {
      // Store in database (simplified example)
      try {
        await prisma.performanceMetric.createMany({
          data: criticalMetrics.map((metric: any) => ({
            name: metric.name,
            value: metric.value,
            unit: metric.unit || 'ms',
            metadata: metric.metadata || {},
            sessionId: body.sessionId || 'unknown',
            userAgent: body.userAgent || '',
            connectionType: body.connection || '',
            timestamp: new Date(metric.timestamp || Date.now()),
          })),
        });
      } catch (dbError) {
        console.error("Failed to store performance metrics:", dbError);
        // Don't fail the request if DB storage fails
      }

      // Log performance issues
      const slowMetrics = criticalMetrics.filter((m: any) => {
        if (m.name === 'lcp' && m.value > 2500) return true; // LCP > 2.5s
        if (m.name === 'fid' && m.value > 100) return true; // FID > 100ms
        if (m.name === 'cls' && m.value > 0.1) return true; // CLS > 0.1
        if (m.name === 'long_task' && m.value > 50) return true; // Long task > 50ms
        return false;
      });

      if (slowMetrics.length > 0) {
        console.warn('Performance degradation detected:', {
          sessionId: body.sessionId,
          metrics: slowMetrics,
          userAgent: body.userAgent,
        });
      }
    }

    return NextResponse.json(
      { success: true, received: body.metrics.length, stored: criticalMetrics.length },
      { 
        headers: {
          'Cache-Control': 'no-store',
        }
      }
    );
  } catch (error) {
    console.error("Performance metrics API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  // Return performance insights (simplified)
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const metrics = await prisma.performanceMetric.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        name: true,
        value: true,
        unit: true,
        timestamp: true,
        sessionId: true,
      },
    });

    // Calculate averages
    const averages = metrics.reduce((acc: any, metric: any) => {
      if (!acc[metric.name]) {
        acc[metric.name] = { sum: 0, count: 0 };
      }
      acc[metric.name].sum += metric.value;
      acc[metric.name].count++;
      return acc;
    }, {});

    const insights = Object.entries(averages).map(([name, data]: [string, any]) => ({
      metric: name,
      average: data.count > 0 ? data.sum / data.count : 0,
      count: data.count,
    }));

    return NextResponse.json({
      metrics: metrics.slice(0, 10), // Return only recent metrics
      insights,
      total: metrics.length,
    });
  } catch (error) {
    console.error("Failed to fetch performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}