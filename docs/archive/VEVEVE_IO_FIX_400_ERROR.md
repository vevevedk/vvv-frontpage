# Fix 400 Bad Request Error

**Issue**: Backend returns 400 Bad Request after updating configuration  
**Cause**: Docker container needs to be recreated to pick up new environment variables

---

## Solution: Recreate Backend Container

Docker containers read environment variables from `.env` files at startup. A `restart` doesn't reload env vars - we need to recreate the container.

### Step 1: Recreate Backend Container

```bash
cd /var/www/vvv-frontpage

# Recreate the backend container (this will reload env vars)
docker-compose up -d --force-recreate backend
```

### Step 2: Verify Environment Variables

```bash
# Find backend container name
docker ps | grep backend

# Check environment variables are loaded
docker exec vvv-frontpage_backend_1 printenv | grep -E '(ALLOWED_HOSTS|CORS|CSRF)'
```

**Expected output**:
```
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk,143.198.105.78,veveve.io,www.veveve.io
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io
CSRF_TRUSTED_ORIGINS=https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io
```

### Step 3: Test Again

```bash
# Test API endpoint
curl https://veveve.io/api/health

# If still 400, try with Host header explicitly
curl -H "Host: veveve.io" https://veveve.io/api/health
```

---

## Alternative: Check Backend Logs

If still getting 400, check backend logs for specific error:

```bash
docker-compose logs backend | tail -20
```

Look for:
- `Invalid HTTP_HOST header` → ALLOWED_HOSTS issue
- `CSRF` errors → CSRF_TRUSTED_ORIGINS issue
- Other Django errors

---

## If Still Not Working

### Check Nginx is Passing Host Header

```bash
# Check Nginx config
grep -A 5 "location /api/" /etc/nginx/sites-available/veveve-io
```

Should include:
```nginx
proxy_set_header Host $host;
```

### Test from Server Directly

```bash
# Test backend directly (bypassing Nginx)
curl http://127.0.0.1:8001/api/health
```

If this works, the issue is with Nginx configuration or Host header.

---

**Next Action**: Run `docker-compose up -d --force-recreate backend` to recreate the container with new env vars.
