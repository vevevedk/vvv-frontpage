## VVV Frontpage - Deployment Runbook (2025-09-23)

This document captures the working deployment configuration and steps for `veveve.dk` on the shared server that also hosts `smagalagellerup.dk` and `invest.veveve.dk`.

### Overview
- **Reverse proxy (system nginx)** terminates TLS and routes requests per vhost.
- **Frontend (Next.js)** runs in Docker; container listens on 3001, published on host 3000.
- **Backend (Django + Gunicorn)** runs in Docker; container listens on 8000, published on host 8001.
- **Postgres + Redis** run via docker-compose and are consumed by the backend.

### Host Port Allocation (by app)
- smagalagellerup.dk: frontend on 3001 (separate stack)
- invest.veveve.dk: backend on 8002 (existing stack)
- veveve.dk (this app):
  - Frontend: host 3000 → container 3001
  - Backend: host 8001 → container 8000

### Prerequisites
- Docker and docker-compose installed on the server
- System nginx enabled via systemd
- DNS for `veveve.dk` and `www.veveve.dk` pointing to the server

### Environment Files
Create and populate env files (see `env/*.example`):

```bash
cd /opt/vvv-frontpage
cp env/backend.env.example env/backend.env
cp env/frontend.env.example env/frontend.env
```

Backend (`env/backend.env`) must include at minimum:
- `DJANGO_SECRET_KEY=...`
- `DJANGO_SETTINGS_MODULE=api.settings.prod`
- `ALLOWED_HOSTS=veveve.dk,www.veveve.dk`
- `DATABASE_HOST=postgres`
- `DATABASE_PORT=5432`
- `DATABASE_NAME=vvv_database`
- `DATABASE_USER=vvv_user`
- `DATABASE_PASSWORD=vvv_password`

Frontend (`env/frontend.env`) must include:
- `NEXT_PUBLIC_APP_URL=https://veveve.dk`
- `NEXT_PUBLIC_API_URL=https://veveve.dk/api`
- `JWT_SECRET=...` (must match what frontend expects)

### Start Database and Cache (compose)
```bash
cd /opt/vvv-frontpage
docker-compose up -d postgres redis
```

### Build and Run Frontend (Docker)
The provided `frontend.Dockerfile` builds a Next.js app that listens on 3001 inside the container. We publish it to host 3000 for nginx.

```bash
cd /opt/vvv-frontpage
docker build -t vvv-frontend:latest -f frontend.Dockerfile .

docker rm -f vvv-frontend 2>/dev/null || true
docker run -d --name vvv-frontend \
  --restart=always \
  --env-file ./env/frontend.env \
  -p 3000:3001 \
  vvv-frontend:latest

# Verify
curl -I http://localhost:3000/
```

### Build and Run Backend (Docker)
The backend image is defined by `backend/Dockerfile` and runs `gunicorn` on 8000 inside the container. We publish it to host 8001. It must be attached to the compose network to reach Postgres by service name `postgres`.

```bash
cd /opt/vvv-frontpage
docker build -t vvv-backend:latest -f backend/Dockerfile .

docker rm -f vvv-backend 2>/dev/null || true
docker run -d --name vvv-backend \
  --restart=always \
  --env-file ./env/backend.env \
  -e DJANGO_SETTINGS_MODULE=api.settings.prod \
  -p 8001:8000 \
  --network vvv-frontpage_vvv_network \
  vvv-backend:latest

# Migrations
docker exec -it vvv-backend python manage.py migrate

# Sanity checks
curl -I http://localhost:8001/api/
```

### System nginx Configuration (veveve.dk)
Active file: `/etc/nginx/sites-available/veveve.dk` (symlinked in `sites-enabled`). Working 443 server block:

```nginx
server {
    server_name veveve.dk www.veveve.dk;

    # API routes to backend
    location /api/ {
        proxy_pass http://localhost:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    # Admin routes to backend
    location /admin/ {
        proxy_pass http://localhost:8001/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check (served by nginx itself)
    location /health {
        access_log off;
        return 200 "vvv-frontpage healthy\n";
        add_header Content-Type text/plain;
    }

    # Frontend routes to Next.js on host:3000
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/veveve.dk/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/veveve.dk/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.veveve.dk) { return 301 https://$host$request_uri; } # managed by Certbot
    if ($host = veveve.dk) { return 301 https://$host$request_uri; } # managed by Certbot

    server_name veveve.dk www.veveve.dk;
    listen 80;
    return 404; # managed by Certbot
}
```

Reload nginx after changes:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Health Checks
- Nginx: `https://veveve.dk/health` → 200 (plain text)
- Frontend: `curl -I http://localhost:3000/` → 200
- Backend: `curl -I http://localhost:8001/api/` → 401 (without auth) or 200 on open endpoints

### Troubleshooting
- 502 on root: ensure frontend container is running, nginx points to `localhost:3000`.
- 502/401/404 on `/api`: ensure backend container is running and nginx `/api` points to `localhost:8001`.
- DB connection refused inside backend: check `DATABASE_HOST=postgres`, attach backend to `vvv-frontpage_vvv_network`, and ensure Postgres is up via compose.
- Port conflicts: use `ss -ltnp` and `docker ps` to identify holders; adjust host ports if other apps share the server (e.g., move frontpage backend to 8003 and update nginx accordingly).

### Operational Commands
```bash
# View logs
docker logs -f vvv-frontend
docker logs -f vvv-backend

# Restart services
docker restart vvv-frontend vvv-backend

# Compose services
docker-compose up -d postgres redis
docker-compose up -d backend worker beat
```

### Notes
- Avoid running `makemigrations` in production; deploy migration files from source control.
- Keep each app on distinct host ports to prevent cross-site routing errors.




