import { NextResponse, NextRequest } from 'next/server'

// Simple store resolution middleware based on visitor country
export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const cookies = req.cookies

  // If store already decided, skip
  if (cookies.get('store_code')) return NextResponse.next()

  // Try to determine country from Vercel header
  const country = req.headers.get('x-vercel-ip-country') ?? 'GLOB'

  // Kuwait country code
  const KUWAIT_CODE = 'KUW'
  const isKuwait = country === 'KW' // ISO code for Kuwait

  // Choose store code based on country
  const storeCode = isKuwait ? KUWAIT_CODE : 'GLOBAL'

  // Persist choice in a cookie for subsequent requests
  const res = NextResponse.next()
  res.cookies.set('store_code', storeCode, { path: '/' })
  // Optionally redirect to a store-specific slug path
  // If you want automatic URL redirect, uncomment the line below:
  // url.pathname = isKuwait ? '/store/kuwait' : '/store/global'
  // return NextResponse.redirect(url)
  return res
}

// Note: the edge-matcher config can be added here if needed in the future.
