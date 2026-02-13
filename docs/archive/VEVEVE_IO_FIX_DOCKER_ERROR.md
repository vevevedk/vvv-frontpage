# Fix Docker Compose Error - Alternative Approach

**Issue**: Docker Compose error when trying to recreate containers  
**Solution**: Try alternative methods to reload environment variables

---

## Option 1: Stop and Start Backend (Simpler)

```bash
cd /var/www/vvv-frontpage

# Stop backend
docker-compose stop backend

# Start backend (will reload env vars)
docker-compose start backend
```

---

## Option 2: Check Backend Logs First

Before recreating, let's see what the actual error is:

```bash
# Check backend logs for the 400 error
docker-compose logs backend | tail -30

# Look for:
# - "Invalid HTTP_HOST header" → ALLOWED_HOSTS issue
# - "CSRF" errors → CSRF_TRUSTED_ORIGINS issue
# - Other Django errors
```

---

## Option 3: Test Backend Directly

Test if backend is working at all:

```bash
# Test backend directly (bypassing Nginx)
curl http://127.0.0.1:8001/api/health

# Test with Host header
curl -H "Host: veveve.io" http://127.0.0.1:8001/api/health
```

---

## Option 4: Restart All Services

If the error persists, restart all services:

```bash
cd /var/www/vvv-frontpage

# Restart all services
docker-compose restart

# Or stop and start
docker-compose stop
docker-compose start
```

---

## Option 5: Check Environment Variables Are Loaded

Verify the container has the new env vars:

```bash
# Find backend container
docker ps | grep backend

# Check env vars (replace container name if different)
docker exec vvv-frontpage_backend_1 printenv | grep -E '(ALLOWED_HOSTS|CORS|CSRF)'
```

If env vars are NOT updated, the container needs to be recreated. But since docker-compose is having issues, we might need to:

1. Remove the container manually
2. Start it again

```bash
# Remove backend container
docker-compose rm -f backend

# Start it again
docker-compose up -d backend
```

---

## Option 6: Check Nginx Configuration

The 400 error might also be from Nginx not passing the Host header correctly:

```bash
# Check Nginx config for veveve.io
grep -A 10 "location /api/" /etc/nginx/sites-available/veveve-io
```

Should include:
```nginx
proxy_set_header Host $host;
```

---

**Next Action**: Try Option 1 (stop/start) first, then check logs (Option 2) to see the actual error.
