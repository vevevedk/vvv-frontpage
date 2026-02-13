# Update Backend Configuration for veveve.io - Manual Steps

**On the server**, update the backend.env file manually:

## Step 1: Edit backend.env

```bash
cd /var/www/vvv-frontpage
nano env/backend.env
```

## Step 2: Update ALLOWED_HOSTS

Find the line:
```ini
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk,209.38.98.109
```

Change it to:
```ini
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk,veveve.io,www.veveve.io,209.38.98.109,143.198.105.78
```

## Step 3: Update CORS_ALLOWED_ORIGINS

Find the line:
```ini
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://veveve.dk,https://www.veveve.dk
```

Change it to:
```ini
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io
```

## Step 4: Update CSRF_TRUSTED_ORIGINS

Find the line:
```ini
CSRF_TRUSTED_ORIGINS=https://veveve.dk,https://www.veveve.dk
```

Change it to:
```ini
CSRF_TRUSTED_ORIGINS=https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io
```

## Step 5: Save and Exit

Press `Ctrl+X`, then `Y`, then `Enter`.

## Step 6: Restart Backend

```bash
# Check what docker compose command works
docker-compose ps
# or
docker compose ps

# Restart backend service
docker-compose restart backend
# or
docker compose restart backend
```

## Step 7: Verify

```bash
# Find backend container name
docker ps | grep backend

# Check environment variables
docker exec <container-name> printenv | grep -E '(ALLOWED_HOSTS|CORS|CSRF)'
```

---

**Quick one-liner to check current values**:
```bash
grep -E '^(ALLOWED_HOSTS|CORS_ALLOWED_ORIGINS|CSRF_TRUSTED_ORIGINS)=' env/backend.env
```
