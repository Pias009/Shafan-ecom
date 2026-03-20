import { NextResponse, NextRequest } from 'next/server'

import { getToken } from 'next-auth/jwt'

// Simple store resolution middleware based on visitor country
export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // --- ADMIN PANEL PROTECTION ---
  if (pathname.startsWith('/ueadmin')) {
    // 1. Check if admin panels are active
    const activeAdmin = process.env.ACTIVE_ADMIN_PANELS === 'true'
    if (!activeAdmin) {
      return new NextResponse("Admin Panles are currently deactivated.", { status: 403 })
    }

    // 2. Allow auth pages
    const isAuthPage = pathname.startsWith('/ueadmin/login') || 
                       pathname.startsWith('/ueadmin/verify') || 
                       pathname.startsWith('/ueadmin/setup')

    if (!isAuthPage) {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
      
      // No bypass: MUST have session and role must be correct
      if (!token) {
        url.pathname = '/ueadmin/login'
        return NextResponse.redirect(url)
      }

      const role = token.role as string
      if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
        return new NextResponse("Unauthorized Access", { status: 401 })
      }

      // NO BYPASS: Must be MFA verified
      if (!token.mfaVerified) {
         url.pathname = '/ueadmin/login'
         return NextResponse.redirect(url)
      }
    }

  }

  // --- STORE RESOLUTION LOGIC ---
  const cookies = req.cookies
  const hasStore = cookies.get('store_code')
  
  // If store already decided, just continue (but still check admin rules above)
  if (hasStore) return NextResponse.next()

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
  return res
}


// Note: the edge-matcher config can be added here if needed in the future.
