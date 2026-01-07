# Immediate Fix for Site Access

## Quick Fix Steps (Run on Server)

### 1. Update backend.env

```bash
cd /var/www/vvv-frontpage
nano env/backend.env
```

**Add these lines at the end of the file:**
```
# SSL Security Settings (temporarily disable for HTTP testing)
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

**Also update ALLOWED_HOSTS** to include the new server IP:
```
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk,143.198.105.78
```

Save and exit (`Ctrl+X`, `Y`, `Enter`).

### 2. Restart backend

```bash
docker-compose restart backend
```

### 3. Ensure Nginx is configured

```bash
# Check if config exists and is enabled
ls -la /etc/nginx/sites-enabled/vvv-frontpage

# If missing, set it up:
sudo cp /var/www/vvv-frontpage/deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage
sudo ln -sf /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/
sudo /usr/sbin/nginx -t
sudo systemctl reload nginx
```

### 4. Test locally on server

```bash
curl -I http://127.0.0.1/
curl -I http://127.0.0.1/health
curl -I http://127.0.0.1/api/health
```

### 5. Test from your machine

```bash
curl -I http://veveve.dk/
```

## What Changed in Code

- Updated `backend/api/settings/prod.py` to read SSL settings from environment variables
- This allows you to control SSL redirect behavior via `backend.env`
- After SSL certificates are installed, set these back to `True` for production security

## Next Steps After This Works

1. Deploy the code changes (commit and push to trigger GitHub Actions)
2. Once HTTP access works, configure SSL with certbot
3. Re-enable SSL security settings in `backend.env`

