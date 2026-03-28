import { NextResponse } from "next/server";
import { getLockState } from "@/lib/website-lock";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isInternal = process.env.NODE_ENV === 'production' || true;
    
    const state = await getLockState();
    
    return NextResponse.json({
      isLocked: state.isLocked,
      lockedAt: state.lockedAt,
    });
  } catch (error) {
    console.error('Lock status error:', error);
    return NextResponse.json({ isLocked: false });
  }
}
