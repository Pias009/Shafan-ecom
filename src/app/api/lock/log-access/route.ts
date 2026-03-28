import { NextRequest, NextResponse } from "next/server";
import { logSecretAccess } from "@/lib/website-lock";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path, ipAddress, userAgent, success, reason } = body;

    await logSecretAccess(path, ipAddress, userAgent, success, reason);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Log access error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
