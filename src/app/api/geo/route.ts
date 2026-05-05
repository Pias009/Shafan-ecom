import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Try to get country from Vercel headers
  const country = req.headers.get('x-vercel-ip-country') || 'KW';
  
  // Return the country code
  return NextResponse.json({ country: country.toUpperCase() });
}
