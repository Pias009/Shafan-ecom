import { NextResponse, NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const SECRET_PATH = process.env.SECRET_LOCK_PATH || `/master-${Math.random().toString(36).substring(2, 18)}`;

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname
  const ipAddress = req.headers.get('x-forwarded-for') ||
                   req.headers.get('x-real-ip') ||
                   'unknown'
  const userAgent = req.headers.get('user-agent')

  const isSecretPath = pathname.startsWith(SECRET_PATH)
  const isStaticAsset = pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)
  const isApi = pathname.startsWith('/api/')

  // --- WEBSITE LOCK ENFORCEMENT (Edge-safe) ---
  if (!isSecretPath && !isStaticAsset) {
    try {
      // Use fetch to check lock status from API instead of direct DB access
      const lockCheckRes = await fetch(`${req.nextUrl.origin}/api/lock/status`, {
        headers: { 'x-internal': 'true' },
        cache: 'no-store'
      });
      
      if (lockCheckRes.ok) {
        const lockData = await lockCheckRes.json();
        if (lockData.isLocked) {
          if (isApi) {
            return new NextResponse(
              JSON.stringify({
                error: 'Website locked',
                message: 'Website is currently locked. Please contact the Mastermind for assistance.'
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            )
          } else {
            return new NextResponse(getLockedPage(), {
              status: 503,
              headers: { 'Content-Type': 'text/html' }
            })
          }
        }
      }
    } catch (error) {
      // If lock check fails, allow request
      console.error('Failed to check lock state:', error)
    }
  }

  // --- LOG SECRET ACCESS (Edge-safe) ---
  if (isSecretPath) {
    fetch(`${req.nextUrl.origin}/api/lock/log-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, ipAddress, userAgent, success: false, reason: 'Access attempt' })
    }).catch(() => {});
  }

  // --- ADMIN PANEL PROTECTION ---
  if (pathname.startsWith('/ueadmin')) {
    const activeAdmin = process.env.ACTIVE_ADMIN_PANELS === 'true'
    if (!activeAdmin) {
      console.log('MIDDLEWARE: Admin panels deactivated, ACTIVE_ADMIN_PANELS=', process.env.ACTIVE_ADMIN_PANELS)
      return new NextResponse("Admin Panels are currently deactivated.", { status: 403 })
    }

    const isAuthPage = pathname.startsWith('/ueadmin/login') ||
                       pathname.startsWith('/ueadmin/verify') ||
                       pathname.startsWith('/ueadmin/setup')

    if (!isAuthPage) {
      // Try to get token with explicit cookie name for production
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token'
      })
      
      // Debug logging
      console.log('MIDDLEWARE: Admin route accessed', {
        pathname,
        hasToken: !!token,
        tokenKeys: token ? Object.keys(token) : null,
        role: token?.role,
        mfaVerified: token?.mfaVerified,
        NODE_ENV: process.env.NODE_ENV,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL?.substring(0, 20) + '...',
        cookieName: process.env.NODE_ENV === 'production'
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token'
      })
      
      if (!token) {
        console.log('MIDDLEWARE: No token found, redirecting to login')
        url.pathname = '/ueadmin/login'
        return NextResponse.redirect(url)
      }

      const role = token.role as string
      if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
        console.log('MIDDLEWARE: Invalid role', role)
        return new NextResponse("Unauthorized Access", { status: 401 })
      }

      // Allow SUPERADMIN to bypass MFA in development for easier testing
      // Also allow master admin bypass in production (handled by master admin API)
      const isDevelopment = process.env.NODE_ENV === 'development';
      const isSuperAdmin = role === 'SUPERADMIN';
      
      // Check for master admin bypass flag in token
      const isMasterAdminBypass = token.masterAdminBypass === true;
      
      if (!token.mfaVerified && !(isDevelopment && isSuperAdmin) && !isMasterAdminBypass) {
         console.log('MIDDLEWARE: MFA not verified', {
           mfaVerified: token.mfaVerified,
           isDevelopment,
           isSuperAdmin,
           masterAdminBypass: isMasterAdminBypass
         })
         url.pathname = '/ueadmin/login'
         return NextResponse.redirect(url)
      }
      
      console.log('MIDDLEWARE: Admin access granted for', role, { masterAdminBypass: isMasterAdminBypass })
    }
  }

  // --- STORE RESOLUTION LOGIC ---
  const cookies = req.cookies
  const hasStore = cookies.get('store_code')
  
  if (hasStore) return NextResponse.next()

  const country = req.headers.get('x-vercel-ip-country') ?? 'GLOB'
  const KUWAIT_CODE = 'KUW'
  const isKuwait = country === 'KW'
  const storeCode = isKuwait ? KUWAIT_CODE : 'GLOBAL'

  const res = NextResponse.next()
  res.cookies.set('store_code', storeCode, { path: '/' })
  return res
}

// HTML for locked website overlay
function getLockedPage(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Website Locked</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .lock-container {
            text-align: center;
            padding: 3rem;
            max-width: 600px;
            width: 90%;
            background: rgba(30, 41, 59, 0.8);
            backdrop-filter: blur(10px);
            border-radius: 1.5rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            position: relative;
            z-index: 10;
        }
        
        .lock-icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
            color: #ef4444;
            animation: pulse 2s infinite;
        }
        
        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(90deg, #ef4444, #f97316);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 2rem;
            color: #cbd5e1;
        }
        
        .contact-info {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-top: 2rem;
        }
        
        .contact-info h3 {
            color: #fca5a5;
            margin-bottom: 0.5rem;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
        
        .bg-pattern {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
                radial-gradient(circle at 20% 80%, rgba(239, 68, 68, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.1) 0%, transparent 50%);
            z-index: 1;
        }
        
        .emergency-note {
            font-size: 0.9rem;
            color: #94a3b8;
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
    </style>
</head>
<body>
    <div class="bg-pattern"></div>
    <div class="lock-container">
        <div class="lock-icon">🔒</div>
        <h1>Website Locked</h1>
        <p>The website is currently locked for maintenance, security reasons, or emergency procedures.</p>
        <p>All access has been temporarily suspended. Please contact the Mastermind for assistance.</p>
        
        <div class="contact-info">
            <h3>Contact Information</h3>
            <p>If you are an authorized user, please contact the system administrator or the Mastermind directly using the established emergency channels.</p>
            <p>Reference: System Lock #${Date.now().toString(36).toUpperCase()}</p>
        </div>
        
        <div class="emergency-note">
            <p>This is an automated security measure. Do not attempt to bypass this lock.</p>
        </div>
    </div>
    
    <script>
        // Prevent any interaction
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
                e.preventDefault();
            }
        });
        
        // Log access attempts
        fetch('/api/log-lock-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            })
        }).catch(() => {}); // Silent fail
    </script>
</body>
</html>
  `
}

export function getSecretPath(): string {
  return SECRET_PATH;
}

// Matcher configuration for Next.js middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
    // Specifically protect admin routes
    '/ueadmin/:path*',
  ],
};
