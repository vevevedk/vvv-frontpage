# Deployment Guide (Docker + Nginx)

This repo includes backend (Django + DRF + Celery) and frontend (Next.js). Below is a concise step-by-step deploy.

## 1) Prereqs (server)
- Docker + Docker Compose
- Domain and DNS pointing to server (e.g. `your-domain.com`)

## 2) Prepare env files
Copy templates and fill values:

```bash
mkdir -p env
cp env/backend.env.example env/backend.env
cp env/frontend.env.example env/frontend.env
```

Backend must set `DJANGO_SECRET_KEY`, DB creds, `ALLOWED_HOSTS`, and `DJANGO_SETTINGS_MODULE=api.settings.prod`.
Frontend must set `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `JWT_SECRET`, and SMTP settings for invites.

## 3) Nginx config (canonical)
Use the clean vhost in this repo and install on the server:

```bash
sudo cp deploy/veveve.dk.conf /etc/nginx/sites-available/veveve.dk
sudo ln -sf /etc/nginx/sites-available/veveve.dk /etc/nginx/sites-enabled/veveve.dk
sudo nginx -t && sudo systemctl reload nginx
```

## 4) Docker images
Either use a CI to build/push images to your registry, or build locally and push:

```bash
docker build -t your-registry/vvv-backend:latest -f backend/Dockerfile .
docker push your-registry/vvv-backend:latest

docker build -t your-registry/vvv-frontend:latest -f frontend/Dockerfile .
docker push your-registry/vvv-frontend:latest
```

## 5) Compose up (production)
This repo's `docker-compose.yml` is production-ready for `veveve.dk`.

```bash
docker compose up -d postgres redis
sleep 5
docker compose up -d backend worker beat frontend
docker compose exec backend python manage.py migrate --noinput
```

## 6) SSL
TLS terminates on the host Nginx. Ensure certs exist in `/etc/letsencrypt/live/veveve.dk/`.

## 7) Health checks
- Frontend `https://veveve.dk` renders
- API `https://veveve.dk/api/test/` returns JSON 200
- Admin `https://veveve.dk/admin/` redirects to login
- Celery: `docker compose logs worker | tail -n 100` shows worker online

## 8) Common issues
- 502: Nginx upstream names must match compose service names
- CORS: Prefer proxying API at `/api` on same domain to avoid cross-origin issues
- JWT: Ensure `NEXT_PUBLIC_API_URL` matches the proxied `/api`
- DB: Confirm Postgres up and credentials correct


## Standardized Multi-App Deployment (Single Droplet)

To avoid port collisions and config drift when hosting multiple apps on one server, follow this standard.

### Fixed Ports and Services
- veveve frontend (Next.js): port 3000 (Docker)
- veveve backend (Django/Gunicorn): port 8001 (Docker)
- smagalagellerup frontend (Next.js): port 3001 (system service or container)
- invest backend (Django): port 8002 (existing stack)

Keep `/health` routes and avoid mixing host overrides between apps.

### Systemd Templates (frontends)
`/etc/systemd/system/vvv-frontpage.service`
```
[Unit]
Description=VVV Frontpage (Next.js) on port 3000
After=network.target

[Service]
Type=simple
User=avxz
WorkingDirectory=/opt/vvv-frontpage
Environment=PORT=3000
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/smagalagellerup.service`
```
[Unit]
Description=Smag a la Gellerup (Next.js) on port 3001
After=network.target

[Service]
Type=simple
User=avxz
WorkingDirectory=/opt/smagalagellerup
Environment=PORT=3001
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable:
```
sudo systemctl daemon-reload
sudo systemctl enable --now vvv-frontpage.service
sudo systemctl enable --now smagalagellerup.service
```

### Backend CORS/CSRF and Frontend API Base
- Backend: `CORS_ALLOWED_ORIGINS` include `https://veveve.dk, https://www.veveve.dk` and local dev
- Backend: `CSRF_TRUSTED_ORIGINS` include `https://veveve.dk, https://www.veveve.dk`
- Frontend: axios configured to send `withCredentials`, `csrftoken`, `X-CSRFToken`

### Post-Deploy Verification
Use the deploy script; it runs health checks automatically:
```
./scripts/deploy-veveve.sh
```

### Rollback
- Keep a backup of nginx site files; if verification fails, restore and reload.

