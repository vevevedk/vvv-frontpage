# veveve.io Frontend Configuration Guide

This guide explains how the frontend is configured to work with both `veveve.dk` and `veveve.io`.

## Overview

The frontend uses **relative API URLs** (`/api`) so it automatically works on both domains:
- `veveve.dk/api/*` → Proxied to Django backend
- `veveve.io/api/*` → Proxied to Django backend

Nginx handles the routing, so the frontend doesn't need to know which domain it's on for API calls.

## API URL Configuration

### Current Setup

The frontend uses relative URLs for API calls:

```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
```

**Recommended**: Use relative URLs (`/api`) in production so it works on both domains.

### Environment Variables

**File**: `env/frontend.prod.env`

**Option 1: Relative URLs (Recommended)**
```ini
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_URL=https://veveve.dk
```

**Option 2: Domain-Specific URLs**
If you need absolute URLs, you can set different values, but this requires domain detection:

```ini
# For veveve.dk
NEXT_PUBLIC_API_URL=https://veveve.dk/api

# For veveve.io (would need separate config or dynamic detection)
NEXT_PUBLIC_API_URL=https://veveve.io/api
```

**Recommendation**: Use relative URLs (`/api`) - it's simpler and works automatically on both domains.

## Domain-Based Routing

The frontend uses Next.js middleware to route based on domain:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // veveve.io → English frontpage
  if (hostname === 'veveve.io' || hostname === 'www.veveve.io') {
    if (pathname === '/') {
      url.pathname = '/io'; // Route to English frontpage
    }
  }
  
  // veveve.dk → Danish frontpage (default)
  // API calls use relative URLs, so they work on both domains
}
```

## Frontend Pages

### veveve.io Pages

- **English Frontpage**: `pages/io/index.tsx`
- **Login**: `pages/login.tsx` (shared, but redirects from veveve.dk)
- **All other pages**: Shared between domains

### veveve.dk Pages

- **Danish Frontpage**: `pages/index.tsx`
- **Other marketing pages**: As configured

## Testing

### Local Testing

To test domain-based routing locally, add to `/etc/hosts`:

```
127.0.0.1 veveve.dk
127.0.0.1 veveve.io
```

Then access:
- `http://veveve.dk:3000` → Danish frontpage
- `http://veveve.io:3000` → English frontpage

### Production Testing

Once DNS and SSL are configured:

```bash
# Test veveve.io frontpage
curl -I https://veveve.io

# Test veveve.dk frontpage
curl -I https://veveve.dk

# Test API on veveve.io
curl https://veveve.io/api/health

# Test API on veveve.dk (should redirect to veveve.io)
curl -I https://veveve.dk/api/health
```

## Environment Variables Summary

### Development
```ini
# env/frontend.dev.env
NEXT_PUBLIC_API_URL=http://localhost:8001/api
```

### Production
```ini
# env/frontend.prod.env
NEXT_PUBLIC_API_URL=/api  # Relative URL - works on both domains
NEXT_PUBLIC_APP_URL=https://veveve.dk  # Used for redirects, etc.
```

## Notes

- **API Calls**: Use relative URLs (`/api`) so they work on both domains
- **Domain Detection**: Middleware handles routing based on `Host` header
- **Shared Backend**: Both domains use the same Django backend
- **Nginx Routing**: Nginx proxies `/api/` to Django on both domains

## Troubleshooting

### Issue: API calls fail on veveve.io

**Cause**: `NEXT_PUBLIC_API_URL` might be set to `https://veveve.dk/api`

**Solution**: 
1. Update `env/frontend.prod.env` to use relative URL:
   ```ini
   NEXT_PUBLIC_API_URL=/api
   ```
2. Rebuild and restart frontend

### Issue: Wrong frontpage shows on veveve.io

**Cause**: Middleware not routing correctly

**Solution**:
1. Check `middleware.ts` configuration
2. Verify Nginx is passing `Host` header correctly
3. Check Next.js logs for middleware errors

### Issue: CORS errors

**Cause**: Backend not configured for veveve.io

**Solution**: See [VEVEVE_IO_BACKEND_SETUP.md](./VEVEVE_IO_BACKEND_SETUP.md)

## Related Documentation

- [VEVEVE_IO_BACKEND_SETUP.md](./VEVEVE_IO_BACKEND_SETUP.md) - Backend configuration
- [VEVEVE_IO_NGINX_SETUP.md](./VEVEVE_IO_NGINX_SETUP.md) - Nginx configuration
- [SPRINT_VEVEVE_IO.md](./SPRINT_VEVEVE_IO.md) - Full project documentation
