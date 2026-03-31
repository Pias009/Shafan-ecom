import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    console.log("Health check - trying to connect...");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log("DATABASE_URL prefix:", process.env.DATABASE_URL?.substring(0, 30));
    
    const count = await prisma.product.count();
    const users = await prisma.user.count();
    
    return NextResponse.json({
      status: "ok",
      database: "connected",
      products: count,
      users: users,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Health check error:", error.message);
    console.error("Error code:", error.code);
    
    return NextResponse.json({
      status: "error",
      database: "disconnected",
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
