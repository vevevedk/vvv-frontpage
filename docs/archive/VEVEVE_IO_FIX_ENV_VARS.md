# Fix Environment Variables - Manual Docker Commands

**Issue**: Backend container not picking up new ALLOWED_HOSTS  
**Error**: `Invalid HTTP_HOST header: 'veveve.io'`  
**Solution**: Remove and recreate container using docker directly

---

## Step 1: Check Current Environment Variables

```bash
# Check if env vars are loaded
docker exec vvv-frontpage_backend_1 printenv | grep ALLOWED_HOSTS
```

If it doesn't show `veveve.io`, the container needs to be recreated.

---

## Step 2: Remove Container Using Docker Directly

Since docker-compose is having issues, use docker directly:

```bash
cd /var/www/vvv-frontpage

# Stop the backend container
docker stop vvv-frontpage_backend_1

# Remove the container
docker rm vvv-frontpage_backend_1

# Start it again with docker-compose (will create new container)
docker-compose up -d backend
```

---

## Step 3: Verify Environment Variables

```bash
# Wait a few seconds for container to start
sleep 5

# Check environment variables
docker exec vvv-frontpage_backend_1 printenv | grep -E '(ALLOWED_HOSTS|CORS|CSRF)'
```

Should show:
```
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk,143.198.105.78,veveve.io,www.veveve.io
CORS_ALLOWED_ORIGINS=...https://veveve.io,https://www.veveve.io
CSRF_TRUSTED_ORIGINS=...https://veveve.io,https://www.veveve.io
```

---

## Step 4: Test API

```bash
# Test API endpoint
curl https://veveve.io/api/health
```

---

## Alternative: Check if env file is being read

If env vars still don't update, verify the env file path:

```bash
# Check docker-compose is using the right env file
grep -A 2 "env_file" docker-compose.yml | grep backend

# Should show: - ./env/backend.env
```

---

**Next Action**: Run the docker stop/rm commands, then docker-compose up -d backend
