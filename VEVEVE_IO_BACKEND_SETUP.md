# veveve.io Backend Configuration Guide

This guide explains how to configure the Django backend to support `veveve.io` alongside `veveve.dk`.

## Overview

The backend needs to be updated to:
1. Accept requests from `veveve.io` (ALLOWED_HOSTS)
2. Allow CORS requests from `veveve.io` (CORS_ALLOWED_ORIGINS)
3. Trust CSRF tokens from `veveve.io` (CSRF_TRUSTED_ORIGINS)

## Files to Update

### 1. Backend Environment File

**File**: `env/backend.env`

**Current values** (before update):
```ini
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk,209.38.98.109
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://veveve.dk,https://www.veveve.dk
CSRF_TRUSTED_ORIGINS=https://veveve.dk,https://www.veveve.dk
```

**Updated values** (after update):
```ini
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk,veveve.io,www.veveve.io,209.38.98.109,143.198.105.78
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io
CSRF_TRUSTED_ORIGINS=https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io
```

## Automated Update (Recommended)

Use the provided script to update the backend configuration:

```bash
# On the server
cd /var/www/vvv-frontpage
bash scripts/update-veveve-io-backend.sh
```

This script will:
- Backup the current `backend.env` file
- Add `veveve.io` and `www.veveve.io` to ALLOWED_HOSTS
- Add `https://veveve.io` and `https://www.veveve.io` to CORS_ALLOWED_ORIGINS
- Add `https://veveve.io` and `https://www.veveve.io` to CSRF_TRUSTED_ORIGINS

## Manual Update

If you prefer to update manually:

### Step 1: Edit backend.env

```bash
cd /var/www/vvv-frontpage
nano env/backend.env
```

### Step 2: Update ALLOWED_HOSTS

Find the line:
```ini
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk,209.38.98.109
```

Change it to:
```ini
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk,veveve.io,www.veveve.io,209.38.98.109,143.198.105.78
```

### Step 3: Update CORS_ALLOWED_ORIGINS

Find the line:
```ini
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://veveve.dk,https://www.veveve.dk
```

Change it to:
```ini
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io
```

### Step 4: Update CSRF_TRUSTED_ORIGINS

Find the line:
```ini
CSRF_TRUSTED_ORIGINS=https://veveve.dk,https://www.veveve.dk
```

Change it to:
```ini
CSRF_TRUSTED_ORIGINS=https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io
```

### Step 5: Save and Exit

Press `Ctrl+X`, then `Y`, then `Enter`.

## Restart Backend

After updating the configuration, restart the Django backend:

```bash
# Using docker-compose
docker-compose restart django

# Or using docker compose (newer syntax)
docker compose restart django
```

## Verify Changes

Check that the environment variables are loaded correctly:

```bash
# Find the Django container name
docker ps | grep django

# Check environment variables
docker exec <django-container-name> printenv | grep -E '(ALLOWED_HOSTS|CORS|CSRF)'
```

You should see:
- `ALLOWED_HOSTS` includes `veveve.io` and `www.veveve.io`
- `CORS_ALLOWED_ORIGINS` includes `https://veveve.io` and `https://www.veveve.io`
- `CSRF_TRUSTED_ORIGINS` includes `https://veveve.io` and `https://www.veveve.io`

## Test Backend Access

Once DNS has propagated and SSL is configured, test the backend:

```bash
# Test health endpoint
curl https://veveve.io/api/health

# Test from veveve.dk (should still work)
curl https://veveve.dk/api/health
```

## Troubleshooting

### Issue: Backend returns 400 Bad Request

**Cause**: Domain not in ALLOWED_HOSTS

**Solution**: 
1. Verify `veveve.io` is in ALLOWED_HOSTS
2. Restart Django container
3. Check logs: `docker logs <django-container>`

### Issue: CORS errors in browser

**Cause**: Domain not in CORS_ALLOWED_ORIGINS

**Solution**:
1. Verify `https://veveve.io` is in CORS_ALLOWED_ORIGINS
2. Restart Django container
3. Check browser console for specific CORS error

### Issue: CSRF token validation fails

**Cause**: Domain not in CSRF_TRUSTED_ORIGINS

**Solution**:
1. Verify `https://veveve.io` is in CSRF_TRUSTED_ORIGINS
2. Restart Django container
3. Clear browser cookies and try again

## Notes

- Both `veveve.dk` and `veveve.io` can use the same backend
- The backend will accept requests from both domains
- Nginx handles routing `/api/` requests to the Django backend
- SSL must be configured before HTTPS URLs will work

## Related Documentation

- [VEVEVE_IO_NGINX_SETUP.md](./VEVEVE_IO_NGINX_SETUP.md) - Nginx configuration
- [VEVEVE_IO_SSL_SETUP.md](./VEVEVE_IO_SSL_SETUP.md) - SSL certificate setup
- [SPRINT_VEVEVE_IO.md](./SPRINT_VEVEVE_IO.md) - Full project sprint documentation
