// middleware.ts – v1.0.0 RC1 Final: complete auth, security headers, role protection
import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth'

// Routes requiring authentication
const PROTECTED_PREFIXES = [
  '/dashboard', '/upload', '/grading', '/reports', '/assistant',
  '/statistics', '/settings', '/support', '/notifications',
]
const ADMIN_PREFIXES = ['/admin']

// Routes that redirect logged-in users to dashboard
const AUTH_ONLY_ROUTES = [
  '/login', '/register', '/forgot-password', '/reset-password',
  '/two-factor', '/verify-email',
]

// Public API routes (no auth cookie required)
const PUBLIC_API_PREFIXES = [
  '/api/stripe/webhook',  // Stripe signs these
  '/api/health',          // Load balancer
  '/api/metrics',         // Prometheus (uses Bearer token)
  '/api/swagger',         // Public API docs
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/verify-email',
  '/api/auth/reset-password',
  '/api/auth/refresh',
]

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.anthropic.com https://api.stripe.com wss:",
      "frame-src https://js.stripe.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  )
  return response
}

type JWTUser = { sub: string; email: string; role: string } | null

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Bypass: Next.js internals and static files ──────────────────
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/icons/') ||
    pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/)
  ) {
    return NextResponse.next()
  }

  // ── Bypass: Public API routes ────────────────────────────────────
  if (PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return addSecurityHeaders(NextResponse.next())
  }

  // ── Verify JWT ───────────────────────────────────────────────────
  let user: JWTUser = null
  const token = request.cookies.get('access_token')?.value
  if (token) {
    try {
      user = await verifyAccessToken(token)
    } catch {
      // Expired or invalid token – treat as unauthenticated
    }
  }

  const isAuthenticated = !!user

  // ── Auth-only routes: redirect to dashboard if already logged in ─
  if (AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    if (isAuthenticated) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL('/dashboard', request.url))
      )
    }
    return addSecurityHeaders(NextResponse.next())
  }

  // ── Protected routes: require login ─────────────────────────────
  const isProtected =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    ADMIN_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return addSecurityHeaders(NextResponse.redirect(loginUrl))
  }

  // ── Admin routes: require ADMIN role ────────────────────────────
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p)) && user?.role !== 'ADMIN') {
    return addSecurityHeaders(
      NextResponse.redirect(new URL('/dashboard', request.url))
    )
  }

  // ── All other routes: add headers and proceed ────────────────────
  return addSecurityHeaders(NextResponse.next())
}

export const config = {
  matcher: [
    // Match all paths except static assets
    '/((?!_next/static|_next/image).*)',
  ],
}
