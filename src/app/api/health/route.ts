import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Simple health check for MongoDB
    await prisma.user.findFirst({ take: 1 });
    
    const responseTime = Date.now() - startTime;
    
    const response = {
      status: 'healthy',
      message: 'Database connection successful',
      timestamp: new Date().toISOString(),
      responseTime,
      service: "ecommerce-next",
      version: "1.0.0",
      uptime: process.uptime(),
    };
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Health-Check': 'true',
      },
    });
  } catch (error: any) {
    const responseTime = Date.now();
    
    return NextResponse.json({
      status: 'unhealthy',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      responseTime,
      service: "ecommerce-next",
      version: "1.0.0",
      uptime: process.uptime(),
    }, {
      status: 503,
    });
  }
}

// Allow HEAD requests for health checks
export async function HEAD() {
  try {
    await prisma.user.findFirst({ take: 1 });
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Health-Status': 'healthy',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}