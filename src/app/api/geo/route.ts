import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Allow testing via query parameter: /api/geo?test_country=AE
  const { searchParams } = new URL(req.url);
  const testCountry = searchParams.get('test_country');
  
  if (testCountry) {
    return NextResponse.json({ country: testCountry.toUpperCase() });
  }

  // Try to get country from Vercel headers
  const country = req.headers.get('x-vercel-ip-country') || 'KW';
  
  // Return the country code
  return NextResponse.json({ country: country.toUpperCase() });
}

