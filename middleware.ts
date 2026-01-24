import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for domain-based routing
 * - veveve.io → English frontpage and platform
 * - veveve.dk → Danish marketing site
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Detect if this is veveve.io
  const isVeveveIO = hostname === 'veveve.io' || hostname === 'www.veveve.io';
  
  // Detect if this is veveve.dk
  const isVeveveDK = hostname === 'veveve.dk' || hostname === 'www.veveve.dk';

  // For veveve.io root, rewrite to /io route (English frontpage)
  if (isVeveveIO && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/io';
    return NextResponse.rewrite(url);
  }

  // For veveve.dk root, show Danish frontpage (current index.tsx)
  // Just pass through - no rewrite needed

  // For login on veveve.dk, redirect to veveve.io/login
  if (isVeveveDK && pathname === '/login') {
    return NextResponse.redirect(new URL('https://veveve.io/login', request.url));
  }

  // For API calls from veveve.dk, redirect to veveve.io/api
  if (isVeveveDK && pathname.startsWith('/api/')) {
    const apiPath = pathname.replace('/api', '');
    return NextResponse.redirect(new URL(`https://veveve.io/api${apiPath}`, request.url));
  }

  // Default: pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
  ],
};
