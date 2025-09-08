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

## 3) Nginx config
Edit `deploy/nginx.conf.example` for your domain and save as `deploy/nginx.conf`.

## 4) Docker images
Either use a CI to build/push images to your registry, or build locally and push:

```bash
docker build -t your-registry/vvv-backend:latest -f backend/Dockerfile .
docker push your-registry/vvv-backend:latest

docker build -t your-registry/vvv-frontend:latest -f frontend/Dockerfile .
docker push your-registry/vvv-frontend:latest
```

## 5) Compose up
Use the production compose example as a base:

```bash
cp docker-compose.prod.example.yml docker-compose.yml
# edit image names if needed

docker compose pull
# first-time init
docker compose up -d postgres redis
sleep 5
# start backend services
docker compose up -d backend worker beat
# run migrations and create superuser
docker compose exec backend python manage.py migrate
# optional: create superuser interactively or via env/command
# docker compose exec backend python manage.py createsuperuser
# start frontend + nginx
docker compose up -d frontend nginx
```

## 6) SSL (optional here, best via host)
If terminating TLS on the server:
- Install certbot (`snap install --classic certbot`) and obtain certs for your domain
- Update `deploy/nginx.conf` to include the `server` 443 block in the example
- Reload Nginx container

## 7) Health checks
- Frontend `http://your-domain.com` should render login
- API `http://your-domain.com/api/health/` (or any known endpoint) should respond 200
- Celery: `docker compose logs worker | tail -n 100` shows worker online

## 8) Common issues
- 502: Nginx upstream names must match compose service names
- CORS: Prefer proxying API at `/api` on same domain to avoid cross-origin issues
- JWT: Ensure `NEXT_PUBLIC_API_URL` matches the proxied `/api`
- DB: Confirm Postgres up and credentials correct

