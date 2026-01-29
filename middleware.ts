import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for domain-based routing
 * - veveve.io → English frontpage and platform
 * - veveve.dk → Danish marketing site
 */
export function middleware(request: NextRequest) {
  // Prefer Next's parsed hostname (most reliable). Only fall back to x-forwarded-host
  // when we're behind a proxy and nextUrl.hostname is a local host/ip.
  const forwardedHost = (request.headers.get('x-forwarded-host') || '').trim();
  const rawHost = (request.headers.get('host') || '').trim();

  const parseHostname = (hostValue: string) => {
    if (!hostValue) return '';
    // Take the first value if multiple are present
    const first = hostValue.split(',')[0].trim();
    // IPv6 host in brackets: "[::1]:3000"
    if (first.startsWith('[')) {
      const end = first.indexOf(']');
      return end > 0 ? first.slice(1, end) : first;
    }
    // Domain or IPv4 with optional port: "example.com:3000"
    return first.split(':')[0];
  };

  const nextHostname = request.nextUrl.hostname || '';
  const isLocalHost =
    nextHostname === 'localhost' ||
    nextHostname === '127.0.0.1' ||
    nextHostname === '::1';

  const hostname =
    (isLocalHost ? parseHostname(forwardedHost) : '') ||
    nextHostname ||
    parseHostname(rawHost);
  const pathname = request.nextUrl.pathname;

  const withDebugHeader = (response: NextResponse, decision?: string) => {
    if (process.env.NODE_ENV !== 'production') {
      response.headers.set('x-veveve-middleware', '1');
      response.headers.set('x-veveve-host', hostname || '(empty)');
      response.headers.set('x-veveve-raw-host', rawHost || '(empty)');
      response.headers.set('x-veveve-x-forwarded-host', forwardedHost || '(empty)');
      response.headers.set('x-veveve-path', pathname);
      if (decision) response.headers.set('x-veveve-decision', decision);
    }
    return response;
  };

  // Detect if this is veveve.io (and staging hosts that should render the io marketing subtree).
  const ioHosts = new Set([
    'veveve.io',
    'www.veveve.io',
    'staging.veveve.io',
    'www.staging.veveve.io',
    'staging.veveve.dk',
    'www.staging.veveve.dk',
  ]);
  // Local dev convenience: avoid HTTPS/HSTS issues by using *.localhost in the browser.
  if (process.env.NODE_ENV !== 'production') {
    ioHosts.add('veveve.localhost');
    ioHosts.add('www.veveve.localhost');
  }
  const isVeveveIO = ioHosts.has(hostname);
  
  // Detect if this is veveve.dk (Danish marketing site).
  const dkHosts = new Set(['veveve.dk', 'www.veveve.dk']);
  // Local dev convenience: allow testing DK host routing without touching real DNS.
  if (process.env.NODE_ENV !== 'production') {
    dkHosts.add('veveve-dk.localhost');
    dkHosts.add('staging.veveve-dk.localhost');
  }
  const isVeveveDK = dkHosts.has(hostname);

  // veveve.io uses the `/io/*` subtree, but should have clean URLs:
  // - veveve.io/           → /io
  // - veveve.io/pricing    → /io/pricing
  // - veveve.io/security   → /io/security
  // Keep `/api/*` untouched.
  if (isVeveveIO) {
    // Allow direct access to the underlying subtree (useful in dev).
    if (pathname.startsWith('/io')) {
      return withDebugHeader(NextResponse.next(), 'io:passthrough(/io)');
    }

    // Don't rewrite API routes.
    if (pathname.startsWith('/api')) {
      return withDebugHeader(NextResponse.next(), 'io:passthrough(/api)');
    }

    // Don't rewrite app/platform routes (these live at the root on veveve.io).
    if (
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/dashboard' ||
      pathname === '/profile' ||
      pathname === '/admin' ||
      pathname.startsWith('/clients') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/pipelines') ||
      pathname.startsWith('/woocommerce')
    ) {
      return withDebugHeader(NextResponse.next(), 'io:passthrough(app-route)');
    }

    const url = request.nextUrl.clone();
    url.pathname = pathname === '/' ? '/io' : `/io${pathname}`;
    return withDebugHeader(NextResponse.rewrite(url), `io:rewrite(${url.pathname})`);
  }

  // For veveve.dk root, show Danish frontpage (current index.tsx)
  // Just pass through - no rewrite needed

  // For login on veveve.dk, redirect to veveve.io/login
  if (isVeveveDK && pathname === '/login') {
    return withDebugHeader(NextResponse.redirect(new URL('https://veveve.io/login', request.url)), 'dk:redirect(/login)');
  }

  // For other app entrypoints on veveve.dk, redirect to veveve.io (marketing-only DK site)
  if (
    isVeveveDK &&
    (pathname === '/register' ||
      pathname === '/dashboard' ||
      pathname === '/profile' ||
      pathname === '/admin' ||
      pathname.startsWith('/clients') ||
      pathname.startsWith('/analytics') ||
      pathname.startsWith('/pipelines') ||
      pathname.startsWith('/woocommerce'))
  ) {
    return withDebugHeader(
      NextResponse.redirect(new URL(`https://veveve.io${pathname}`, request.url)),
      'dk:redirect(app-route)'
    );
  }

  // For API calls from veveve.dk, redirect to veveve.io/api
  if (isVeveveDK && pathname.startsWith('/api/')) {
    const apiPath = pathname.replace('/api', '');
    return withDebugHeader(
      NextResponse.redirect(new URL(`https://veveve.io/api${apiPath}`, request.url)),
      'dk:redirect(/api)'
    );
  }

  // Default: pass through
  return withDebugHeader(NextResponse.next(), 'default:next');
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
