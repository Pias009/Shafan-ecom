import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderStatus } from '@prisma/client';
import { requireAdminApi } from '@/lib/admin-session';
import { convertToAED } from '@/lib/currency-rates';

export const dynamic = 'force-dynamic';

function vitalValue(avg: Record<string, number>, names: string[], fmt: (v: number) => string) {
  const key = names.find((n) => typeof avg[n] === 'number');
  return key ? fmt(avg[key]) : null;
}

// Shared across admins/tabs on a warm instance; the console polls every 45s.
const CACHE_MS = 30_000;
let cached: { body: unknown; expires: number } | null = null;

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof NextResponse) return auth;

  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached.body, { headers: { 'X-Kira-Cache': 'HIT' } });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      // 1. Sales & Products Telemetry
      topSellingOrders,
      allProducts,
      hotProductsCount,
      freshShelfCount,
      trendingCount,

      // 2. Stock & Inventory Telemetry
      criticalInventory,
      outOfStockProducts,

      // 3. Drop-offs & Client Exit Telemetry
      pendingCheckouts,
      cancelledOrdersCount,
      cancelRequestsCount,

      // 4. Performance & UX Telemetry
      performanceMetrics,

      // 5. Customer Sentiment & Marketing Telemetry
      reviewRatings,
      activeDiscounts,
      recentAdminLogs,

      // 6. User Tracking & Performance Forensics (Agent VELOX)
      trackingLogsCount,
      trackingLogsGrouped,
    ] = await Promise.all([
      // Top Selling Orders with items
      prisma.order.findMany({
        where: {
          NOT: { status: OrderStatus.CANCELLED },
          createdAt: { gte: thirtyDaysAgo },
        },
        select: {
          id: true,
          total: true,
          currency: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              unitPrice: true,
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  price: true,
                  stockQuantity: true,
                  sku: true,
                },
              },
            },
          },
        },
        take: 80,
      }),

      // Products Count & Summary
      prisma.product.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          price: true,
          stockQuantity: true,
          trending: true,
          freshFromShelf: true,
          hot: true,
          slug: true,
        },
        take: 50,
      }),

      // Hot / Flash Sale Products
      prisma.product.count({ where: { hot: true, active: true } }),
      // Fresh From Shelf (Homepage)
      prisma.product.count({ where: { freshFromShelf: true, active: true } }),
      // Trending (Homepage)
      prisma.product.count({ where: { trending: true, active: true } }),

      // Critical low stock (StoreInventory <= 5)
      prisma.storeInventory.findMany({
        where: { quantity: { lte: 5 } },
        select: {
          id: true,
          quantity: true,
          productId: true,
          store: { select: { code: true, name: true } },
          product: { select: { id: true, name: true, sku: true, price: true } },
        },
        take: 10,
      }),

      // Out of stock in main catalog
      prisma.product.findMany({
        where: { stockQuantity: { lte: 0 }, active: true },
        select: { id: true, name: true, sku: true, price: true },
        take: 10,
      }),

      // Pending Checkouts (Cart Drop-offs / Why clients left)
      prisma.pendingCheckout.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: {
          id: true,
          status: true,
          paymentMethod: true,
          total: true,
          createdAt: true,
          shippingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),

      // Cancelled orders
      prisma.order.count({ where: { status: OrderStatus.CANCELLED, createdAt: { gte: thirtyDaysAgo } } }),
      // Cancel requests pending
      prisma.order.count({ where: { cancelRequest: true } }),

      // Real-user performance metrics, if the site is reporting any (last 7 days)
      prisma.performanceMetric.groupBy({
        by: ['name'],
        where: { timestamp: { gte: sevenDaysAgo } },
        _avg: { value: true },
        _count: { _all: true },
      }),

      // Customer sentiment from published reviews (4–5 happy, 3 okay, 1–2 sad)
      Promise.all([
        prisma.review.count({ where: { active: true, rating: { gte: 4 } } }),
        prisma.review.count({ where: { active: true, rating: 3 } }),
        prisma.review.count({ where: { active: true, rating: { lte: 2 } } }),
        prisma.review.count({ where: { active: true } }),
      ]),

      // Active Discounts
      prisma.discount.findMany({
        where: {
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        },
        select: { id: true, code: true, discountType: true, value: true, uses: true },
        take: 6,
      }),

      // Admin Activity Logs
      prisma.adminActivityLog.findMany({
        select: {
          id: true,
          action: true,
          resource: true,
          storeCode: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),

      // Tracking events, last 30 days
      prisma.trackingLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),

      // Tracking events by type, last 30 days (funnel)
      prisma.trackingLog.groupBy({
        by: ['eventType'],
        where: { createdAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    // Aggregate Product Sales Velocity
    const productSalesMap = new Map<string, { name: string; unitsSold: number; revenue: number; stock: number; sku: string }>();
    topSellingOrders.forEach((o: any) => {
      (o.items || []).forEach((item: any) => {
        if (!item.product) return;
        const current = productSalesMap.get(item.product.id) || {
          name: item.product.name,
          unitsSold: 0,
          revenue: 0,
          stock: item.product.stockQuantity || 0,
          sku: item.product.sku || 'N/A',
        };
        current.unitsSold += item.quantity || 1;
        current.revenue += (item.unitPrice || 0) * (item.quantity || 1);
        productSalesMap.set(item.product.id, current);
      });
    });

    const topSellingProducts = Array.from(productSalesMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 6);

    // Analyze Client Drop-offs (Why clients left)
    const dropOffReasons: Record<string, number> = {
      'Payment Gateway Step (Tabby/Tamara/Stripe)': 0,
      'Shipping Address Form Abandonment': 0,
      'Cart Review Stage Exit': 0,
      'COD Verification Drop-off': 0,
    };

    pendingCheckouts.forEach((pc: any) => {
      const pm = (pc.paymentMethod || '').toUpperCase();
      if (pm.includes('TABBY') || pm.includes('TAMARA') || pm.includes('STRIPE')) {
        dropOffReasons['Payment Gateway Step (Tabby/Tamara/Stripe)'] += 1;
      } else if (!pc.shippingAddress) {
        dropOffReasons['Shipping Address Form Abandonment'] += 1;
      } else if (pm.includes('COD')) {
        dropOffReasons['COD Verification Drop-off'] += 1;
      } else {
        dropOffReasons['Cart Review Stage Exit'] += 1;
      }
    });

    // Customer Sentiment
    const [happy, okay, sad, totalVotes] = reviewRatings;
    const satisfactionRate = totalVotes > 0 ? Math.round(((happy * 1 + okay * 0.5) / totalVotes) * 100) : null;

    // 6. Real-user speed metrics and funnel obstacles (Agent VELOX)
    const eventCount = (type: string) =>
      (trackingLogsGrouped as any[]).find((g: any) => g.eventType === type)?._count?.id || 0;
    const beginCheckoutCount = eventCount('begin_checkout');
    const purchaseCount = eventCount('purchase');
    const droppedCheckoutCount = Math.max(0, beginCheckoutCount - purchaseCount);

    const perfAvg: Record<string, number> = {};
    for (const m of performanceMetrics as any[]) perfAvg[String(m.name).toUpperCase()] = m._avg.value ?? 0;
    const hasVitals = Object.keys(perfAvg).length > 0;
    const ms = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`);

    const speedTeam = {
      connected: hasVitals,
      speedScore: null,
      mobileSpeedScore: null,
      desktopSpeedScore: null,
      coreWebVitals: {
        lcp: { value: vitalValue(perfAvg, ['LCP'], ms), benchmark: '< 2.5s', metricName: 'Largest Contentful Paint' },
        fid: { value: vitalValue(perfAvg, ['INP', 'FID'], ms), benchmark: '< 200ms', metricName: 'Interaction to Next Paint (INP)' },
        cls: { value: vitalValue(perfAvg, ['CLS'], (v) => v.toFixed(3)), benchmark: '< 0.1', metricName: 'Cumulative Layout Shift' },
        ttfb: { value: vitalValue(perfAvg, ['TTFB'], ms), benchmark: '< 800ms', metricName: 'Time to First Byte' },
      },
      nextjsAssetOptimization: null,
      apiLatencies: [],
      userIssues: {
        totalTrackedUserEvents: trackingLogsCount,
        beginCheckoutCount,
        purchaseCount,
        droppedCheckoutCount,
        cartDropoffRate: beginCheckoutCount > 0 ? `${((droppedCheckoutCount / beginCheckoutCount) * 100).toFixed(1)}%` : null,
        searchEventsCount: eventCount('search'),
        viewItemCount: eventCount('view_item'),
        addToCartCount: eventCount('add_to_cart'),
        unhandledRuntimeErrors: null,
      },
      topEventBreakdown: (trackingLogsGrouped as any[]).map((g: any) => ({
        eventType: g.eventType,
        count: g._count.id,
      })),
      suggestedFixes: [
        beginCheckoutCount > 0
          ? `Only ${purchaseCount} of ${beginCheckoutCount} started checkouts completed in 30 days. Walk through checkout on mobile for each payment method.`
          : 'No checkout events tracked in 30 days. Check that GTM events reach /api tracking.',
        hasVitals ? 'Review the slowest pages in the performance log.' : 'No real-user speed data is being recorded. Connect Vercel Speed Insights or report web-vitals to PerformanceMetric.',
      ],
    };

    // Exact store-wide counts for the console's "Live signals" panel.
    const [orders30, toConfirm, openCheckouts, lowStockCount, outOfStockCount] = await Promise.all([
      prisma.order.findMany({
        where: { NOT: { status: OrderStatus.CANCELLED }, createdAt: { gte: thirtyDaysAgo } },
        select: { total: true, currency: true },
      }),
      prisma.order.count({ where: { status: OrderStatus.ORDER_RECEIVED } }),
      prisma.pendingCheckout.count({ where: { status: 'OPEN' } }),
      prisma.storeInventory.count({ where: { quantity: { lte: 5 } } }),
      prisma.product.count({ where: { stockQuantity: { lte: 0 }, active: true } }),
    ]);
    const overview = {
      orders30: orders30.length,
      revenue30: Math.round(orders30.reduce((sum, o) => sum + convertToAED(o.total || 0, o.currency), 0)),
      toConfirm,
      openCheckouts,
      lowStockCount,
      outOfStockCount,
      cancelRequests: cancelRequestsCount,
      checkoutToPurchaseRate: beginCheckoutCount > 0 ? `${((purchaseCount / beginCheckoutCount) * 100).toFixed(1)}%` : null,
    };

    const body = {
      overview,
      success: true,
      timestamp: new Date().toISOString(),
      agent: {
        name: 'Agent Kira',
        role: 'Chief Head of 24/7 Autonomous Operations',
        status: 'ONLINE_ACTIVE',
        activeTeamsCount: 8,
      },
      salesTeam: {
        topSellingProducts,
        totalCatalogActive: allProducts.length,
        hotProductsCount,
        freshShelfCount,
        trendingCount,
        recentOrdersSample: topSellingOrders.length,
      },
      devTeam: {
        totalPendingCheckouts: pendingCheckouts.length,
        dropOffReasons,
        performanceMetrics: (performanceMetrics as any[]).map((p: any) => ({
          name: p.name,
          value: `${Math.round(p._avg.value ?? 0)} (avg of ${p._count._all})`,
        })),
        cancelledOrdersCount,
        cancelRequestsCount,
        suggestedFixes: [
          'Review where open checkouts stall (payment vs address step) using the drop-off breakdown',
          'Consider an abandoned-checkout reminder for open checkout sessions',
        ],
      },
      seoTeam: {
        connected: false,
        middleEastRankings: [],
        averageRankGCC: null,
        visibilityScore: null,
      },
      stockTeam: {
        criticalItemsCount: criticalInventory.length + outOfStockProducts.length,
        criticalInventory: criticalInventory.map((i: any) => ({
          productName: i.product?.name || 'Item',
          sku: i.product?.sku || 'N/A',
          quantity: i.quantity,
          store: i.store?.code || 'MAIN',
          urgency: i.quantity <= 2 ? 'CRITICAL_URGENT' : 'LOW_ALERT',
        })),
        outOfStockCount: outOfStockProducts.length,
        outOfStockProducts: outOfStockProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
        })),
      },
      marketingTeam: {
        activeDiscounts,
        customerSatisfactionRate: satisfactionRate,
        happyVotes: happy,
        okayVotes: okay,
        sadVotes: sad,
        totalVotes,
        recentAdminActions: recentAdminLogs.map((l: any) => ({
          action: l.action,
          adminEmail: l.user?.email || 'Admin',
          timestamp: l.createdAt,
        })),
      },
      speedTeam,
    };
    cached = { body, expires: Date.now() + CACHE_MS };
    return NextResponse.json(body);
  } catch (error: any) {
    console.error('Error fetching Agent Kira telemetry:', error);
    return NextResponse.json(
      { success: false, error: 'Telemetry failure' },
      { status: 500 }
    );
  }
}
