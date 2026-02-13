# Complete Fix Steps for API Redirect and SSL

## Issue 1: API Still Redirecting to HTTPS

The backend container needs to be **recreated** (not just restarted) to pick up the new environment variables.

### Fix Steps

**On the server:**

```bash
cd /var/www/vvv-frontpage

# Verify the env file has the correct settings
grep SECURE_SSL_REDIRECT env/backend.env
# Should show: SECURE_SSL_REDIRECT=False

# Recreate the backend container to load new env vars
docker-compose up -d --force-recreate backend

# Wait a few seconds, then check logs
docker-compose logs backend | tail -20

# Verify Django is reading the setting
docker-compose exec backend python -c "from django.conf import settings; print('SECURE_SSL_REDIRECT:', settings.SECURE_SSL_REDIRECT)"
# Should output: SECURE_SSL_REDIRECT: False

# Test the API endpoint
curl -I http://veveve.dk/api/health
# Should now return 200 OK instead of 301
```

## Issue 2: Install Certbot for SSL

### Install Certbot

```bash
# Update package list
sudo apt update

# Install certbot and nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Configure SSL (After Backend Fix)

Once the API is working over HTTP, configure SSL:

```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

This will:
- Request SSL certificates from Let's Encrypt
- Automatically update Nginx config for HTTPS
- Set up automatic renewal

### After SSL is Configured

1. **Re-enable SSL security** in `env/backend.env`:
   ```bash
   nano env/backend.env
   ```
   
   Change:
   ```
   SECURE_SSL_REDIRECT=True
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   ```

2. **Recreate backend container** again:
   ```bash
   docker-compose up -d --force-recreate backend
   ```

3. **Test HTTPS**:
   ```bash
   curl -I https://veveve.dk/
   curl -I https://veveve.dk/api/health
   ```

## Summary

1. ✅ Frontend working (HTTP)
2. ⏳ Fix API redirect (recreate backend container)
3. ⏳ Install certbot
4. ⏳ Configure SSL
5. ⏳ Re-enable SSL security settings

