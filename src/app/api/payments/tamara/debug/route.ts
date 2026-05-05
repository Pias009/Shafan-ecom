import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "online",
    timestamp: new Date().toISOString(),
    env: {
      TAMARA_API_URL: process.env.TAMARA_API_URL || "NOT_SET",
      TAMARA_ACCESS_TOKEN_SET: !!process.env.TAMARA_ACCESS_TOKEN,
      TAMARA_ACCESS_TOKEN_PREFIX: process.env.TAMARA_ACCESS_TOKEN?.substring(0, 15) || "NONE",
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "NOT_SET",
      VERCEL_URL: process.env.VERCEL_URL || "NOT_SET",
      NODE_ENV: process.env.NODE_ENV
    }
  });
}
