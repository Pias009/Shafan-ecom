import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  let dbStatus = "unknown";
  let dbError = null;

  try {
    // Quick pulse check on the database
    await prisma.$runCommandRaw({ ping: 1 });
    dbStatus = "connected";
  } catch (e: any) {
    dbStatus = "error";
    dbError = e.message;
  }

  const getBaseUrl = () => {
    let url = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.shanfaglobal.com");
    if (!url.startsWith("http")) url = `https://${url}`;
    return url.replace(/\/$/, "");
  };

  return NextResponse.json({
    status: "online",
    database: dbStatus,
    database_error: dbError,
    timestamp: new Date().toISOString(),
    config: {
      TAMARA_API_URL: process.env.TAMARA_API_URL || "NOT_SET",
      TAMARA_ACCESS_TOKEN_SET: !!process.env.TAMARA_ACCESS_TOKEN,
      TAMARA_ACCESS_TOKEN_PREFIX: process.env.TAMARA_ACCESS_TOKEN?.substring(0, 15) || "NONE",
      RESOLVED_BASE_URL: getBaseUrl(),
      NODE_ENV: process.env.NODE_ENV
    },
    supported_gcc_countries: ["AE", "SA", "KW", "BH", "QA", "OM"]
  });
}
