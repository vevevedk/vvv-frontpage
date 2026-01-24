# Test veveve.io API

## Step 1: Navigate to Project Directory

```bash
cd /var/www/vvv-frontpage
```

## Step 2: Verify Environment Variables

```bash
# Wait for container to fully start
sleep 5

# Check environment variables
docker exec vvv-frontpage_backend_1 printenv | grep -E '(ALLOWED_HOSTS|CORS|CSRF)'
```

## Step 3: Check Backend Logs

```bash
docker-compose logs backend | tail -30
```

Look for any errors or the "Invalid HTTP_HOST header" error.

## Step 4: Test API Endpoints

```bash
# Test health endpoint (if it exists)
curl https://veveve.io/api/health

# Test root API
curl https://veveve.io/api/

# Test with verbose output to see what's happening
curl -v https://veveve.io/api/health
```

## Step 5: Test Backend Directly

```bash
# Test backend directly (bypassing Nginx)
curl http://127.0.0.1:8001/api/health

# Test with Host header
curl -H "Host: veveve.io" http://127.0.0.1:8001/api/health
```

## Step 6: Check Nginx Configuration

```bash
# Check if API location is configured correctly
grep -A 10 "location /api/" /etc/nginx/sites-available/veveve-io
```

Should show:
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8001/api/;
    ...
}
```

---

**Note**: The "Not Found" error might mean:
1. The `/api/health` endpoint doesn't exist
2. The API routing is different
3. Need to check what endpoints are actually available
