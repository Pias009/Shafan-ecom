import { NextResponse, NextRequest } from 'next/server'

const DEFAULT_SECRET_PATH = '/master-shanfa-global-secure';
const SECRET_PATH = process.env.SECRET_LOCK_PATH || DEFAULT_SECRET_PATH;

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // 1. FAST EXCLUSIONS
  const isStaticAsset = pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|mp4|webm)$/)
  const isApi = pathname.startsWith('/api/')
  const isNextInternal = pathname.startsWith('/_next/')
  const isLockStatusApi = pathname === '/api/lock/status'
  
  if (isStaticAsset || isNextInternal || isLockStatusApi) return NextResponse.next()

  // 2. ADMIN PROTECTION
  if (pathname.startsWith('/ueadmin')) {
    const activeAdmin = process.env.ACTIVE_ADMIN_PANELS === 'true'
    if (!activeAdmin) return new NextResponse("Admin Panels are currently deactivated.", { status: 403 })

    const isAuthPage = pathname.startsWith('/ueadmin/login') ||
                       pathname.startsWith('/ueadmin/verify') ||
                       pathname.startsWith('/ueadmin/setup')

    if (!isAuthPage) {
      const adminCookie = req.cookies.get('admin-session')
      if (!adminCookie) {
        url.pathname = '/ueadmin/login'
        return NextResponse.redirect(url)
      }
    }
  }

  // 3. WEBSITE LOCK ENFORCEMENT (Optimized)
  // Skip lock check in development to avoid 5s lag from internal API calls
  // In production, this should ideally use an Edge-compatible store (like Vercel KV) 
  // instead of fetching an internal API that hits MongoDB.
  const isSecretPath = pathname.startsWith(SECRET_PATH)
  const isDev = process.env.NODE_ENV === 'development'
  const lockEnabled = process.env.WEBSITE_LOCK_ENABLED === 'true'

  if (!isDev && lockEnabled && !isSecretPath && !isApi && !pathname.includes('ueadmin')) {
    try {
      // Use a shorter timeout for the lock check to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000);
      
      const lockCheckRes = await fetch(`${req.nextUrl.origin}/api/lock/status`, {
        headers: { 'x-internal': 'true' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (lockCheckRes.ok) {
        const lockData = await lockCheckRes.json();
        if (lockData.isLocked) {
          return new NextResponse(getLockedPage(), {
            status: 503,
            headers: { 'Content-Type': 'text/html' }
          })
        }
      }
    } catch (error) {
      // On failure, fail open to avoid blocking the site
      console.warn('Lock check bypassed due to error');
    }
  }

  // 4. STORE RESOLUTION
  const hasStore = req.cookies.get('store_code')
  if (hasStore) return NextResponse.next()

  const res = NextResponse.next()
  res.cookies.set('store_code', 'UAE', { path: '/', maxAge: 60 * 60 * 24 * 30 })
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
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|images|icons|fonts).*)',
    '/ueadmin/:path*',
  ],
};
