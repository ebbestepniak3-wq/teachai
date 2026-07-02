import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PROTECTED = ['/dashboard', '/upload', '/grading', '/reports', '/assistant', '/statistics', '/settings', '/support']
const ADMIN = ['/admin']
const AUTH_ONLY = ['/login', '/register', '/forgot-password', '/reset-password', '/two-factor', '/verify-email']

function addHeaders(res: NextResponse) {
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  return res
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next()

  const token = request.cookies.get('access_token')?.value
  let user: any = null

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')
      const { payload } = await jwtVerify(token, secret)
      user = payload
    } catch {}
  }

  const isAuth = !!user

  if (AUTH_ONLY.some(r => pathname.startsWith(r))) {
    if (isAuth) return NextResponse.redirect(new URL('/dashboard', request.url))
    return addHeaders(NextResponse.next())
  }

  const isProtected = PROTECTED.some(p => pathname.startsWith(p)) || ADMIN.some(p => pathname.startsWith(p))
  if (isProtected && !isAuth) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (ADMIN.some(p => pathname.startsWith(p)) && user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return addHeaders(NextResponse.next())
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
