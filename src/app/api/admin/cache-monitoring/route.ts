import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ success: false, message: 'Redis monitoring disabled' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ success: false, message: 'Redis monitoring disabled' }, { status: 404 });
}