import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Fix for Next.js 15 static asset serving issues
  const url = request.nextUrl.clone()
  
  // Handle static assets (both old and new Next.js paths)
  if (url.pathname.startsWith('/_next/static/')) {
    // Let Next.js handle static assets normally
    return NextResponse.next()
  }
  
  // Redirect old Next.js static asset paths to new ones
  if (url.pathname.startsWith('/next/static/')) {
    url.pathname = url.pathname.replace('/next/static/', '/_next/static/')
    return NextResponse.redirect(url, 301)
  }
  
  // Handle PWA assets
  if (url.pathname.startsWith('/icon-') || url.pathname.startsWith('/manifest.json') || url.pathname.startsWith('/sw.js')) {
    return NextResponse.next()
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
