/**
 * Centralized “app host” link builder for the veveve.io marketing site.
 *
 * Sprint 1 coordination: login/app is canonical on veveve.io.
 * In staging, `NEXT_PUBLIC_APP_URL` can point to staging host instead.
 */

function stripTrailingSlash(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function appHref(pathname: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "").trim();
  const normalizedBase = stripTrailingSlash(base);

  if (!normalizedBase) return pathname;
  if (!pathname.startsWith("/")) return `${normalizedBase}/${pathname}`;
  return `${normalizedBase}${pathname}`;
}

