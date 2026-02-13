# Fix HTTP Access Issue

## Problem
The site cannot be reached because Django is redirecting all HTTP requests to HTTPS, but SSL certificates are not yet configured.

## Solution

### Step 1: Update backend.env on the server

Add these lines to `/var/www/vvv-frontpage/env/backend.env`:

```bash
# SSL Security Settings (temporarily disable for HTTP testing)
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

**On the server, run:**
```bash
cd /var/www/vvv-frontpage
nano env/backend.env
```

Add the three lines above at the end of the file, then save and exit (`Ctrl+X`, `Y`, `Enter`).

### Step 2: Restart the backend container

```bash
cd /var/www/vvv-frontpage
docker-compose restart backend
```

### Step 3: Verify Nginx is configured and enabled

```bash
# Check if config exists
ls -la /etc/nginx/sites-available/vvv-frontpage

# Check if it's enabled
ls -la /etc/nginx/sites-enabled/vvv-frontpage

# If not enabled, enable it:
sudo cp /var/www/vvv-frontpage/deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage
sudo ln -sf /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/
sudo /usr/sbin/nginx -t
sudo systemctl reload nginx
```

### Step 4: Test the site

**From your local machine:**
```bash
curl -I http://veveve.dk/
curl -I http://veveve.dk/health
curl -I http://veveve.dk/api/health
```

**Or open in browser:**
- http://veveve.dk/

### Step 5: After SSL is configured

Once you have SSL certificates (via certbot), **re-enable SSL security** in `env/backend.env`:

```bash
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

Then restart the backend:
```bash
docker-compose restart backend
```

## Additional Notes

- The code change in `backend/api/settings/prod.py` now allows these settings to be controlled via environment variables
- This fix allows HTTP access for testing before SSL is configured
- Remember to re-enable SSL security after certificates are installed

