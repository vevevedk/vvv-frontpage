# Fix API HTTPS Redirect

## Problem
The API endpoint `/api/health` is still redirecting to HTTPS even after updating `SECURE_SSL_REDIRECT=False` in `backend.env`.

## Solution

### Step 1: Verify backend.env has the correct settings

```bash
cd /var/www/vvv-frontpage
grep SECURE_SSL_REDIRECT env/backend.env
```

Should show:
```
SECURE_SSL_REDIRECT=False
```

### Step 2: Restart the backend container

The container needs to be restarted to pick up environment variable changes:

```bash
cd /var/www/vvv-frontpage
docker-compose restart backend
```

Wait a few seconds, then check logs:
```bash
docker-compose logs backend | tail -20
```

### Step 3: Verify the setting is applied

Check if Django is reading the setting correctly:
```bash
docker-compose exec backend python -c "from django.conf import settings; print('SECURE_SSL_REDIRECT:', settings.SECURE_SSL_REDIRECT)"
```

Should output: `SECURE_SSL_REDIRECT: False`

### Step 4: Test the API endpoint again

```bash
curl -I http://veveve.dk/api/health
```

Should now return `200 OK` instead of `301 Moved Permanently`.

## Alternative: Recreate the container

If restart doesn't work, recreate the container to ensure it picks up all env vars:

```bash
cd /var/www/vvv-frontpage
docker-compose up -d --force-recreate backend
```

## Note

The code changes have been deployed, but the container needs to be restarted to load the new environment variables. The `prod.py` settings file now reads from environment variables, so once the container restarts with the updated `backend.env`, it should work.

