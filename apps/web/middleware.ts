import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/dashboard', '/upload', '/grading', '/reports', '/assistant', '/statistics', '/settings', '/support', '/admin']
const AUTH_ONLY = ['/login', '/register', '/forgot-password', '/reset-password', '/two-factor', '/verify-email']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/_next') || pathname.includes('.')) return NextResponse.next()

  const token = request.cookies.get('access_token')?.value
  const isAuth = !!token

  if (AUTH_ONLY.some(r => pathname.startsWith(r))) {
    if (isAuth) return NextResponse.redirect(new URL('/dashboard', request.url))
    return NextResponse.next()
  }

  if (PROTECTED.some(p => pathname.startsWith(p)) && !isAuth) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
