# Server Migration Guide - vvv-app-web-v02

**Target Server**: vvv-app-web-v02 (143.198.105.78)  
**Deployment User**: vvv-web-deploy  
**Application Directory**: `/var/www/vvv-frontpage`  
**Domain**: veveve.dk (or vvv-frontpage.dk - confirm with team)

---

## 📋 Pre-Migration Checklist

### GitHub Actions Secrets Setup

Before migration, update these secrets in GitHub:

**Repository → Settings → Secrets and variables → Actions**

| Secret Name | Value | Notes |
|------------|-------|-------|
| `SSH_HOST` | `143.198.105.78` | Server IP address |
| `SSH_USER` | `vvv-web-deploy` | Deployment user |
| `SSH_PRIVATE_KEY` | Content of `vvv_web_deploy_key` | SSH private key (get from secure vault) |
| `SSH_PORT` | `22` | Default SSH port (optional) |

### Server Prerequisites

The server has been pre-configured with:
- ✅ Directory created: `/var/www/vvv-frontpage`
- ✅ Permissions set: `vvv-web-deploy:vvv-web-deploy`
- ✅ Passwordless sudo configured for deployment user

---

## 🚀 Migration Steps

### Step 1: Export from Old Server

On the **old server**, run:

```bash
cd /opt/vvv-frontpage  # or current location
bash scripts/migrate-server.sh export
```

This creates: `/tmp/vvv-migration-YYYYMMDD-HHMMSS.tar.gz`

### Step 2: Transfer to New Server

```bash
# From old server or your local machine
scp /tmp/vvv-migration-*.tar.gz vvv-web-deploy@143.198.105.78:/tmp/
```

### Step 3: Import on New Server

SSH to the new server:

```bash
ssh vvv-web-deploy@143.198.105.78
cd /var/www/vvv-frontpage

# If directory is empty, clone the repo first
git clone <repository-url> .

# Import migration data
bash scripts/migrate-server.sh import /tmp/vvv-migration-*.tar.gz
```

### Step 4: Update Environment Files

Review and update for new server:

```bash
nano env/backend.env
nano env/frontend.env
```

**Key variables to update:**
- `ALLOWED_HOSTS` - Should include `veveve.dk`, `www.veveve.dk`
- `NEXT_PUBLIC_APP_URL` - `https://veveve.dk`
- `NEXT_PUBLIC_API_URL` - `https://veveve.dk/api`
- Database credentials (if using external DB)

### Step 5: Setup Nginx Configuration

```bash
# Copy Nginx config (for Docker-based setup)
sudo cp deploy/veveve.dk.conf /etc/nginx/sites-available/vvv-frontpage

# OR create new config for this server
sudo nano /etc/nginx/sites-available/vvv-frontpage
```

**Nginx Config** (for Docker setup - Next.js + Django):

```nginx
server {
    server_name veveve.dk www.veveve.dk;

    # API/admin -> backend (Docker) on 8001
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8001/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend (Next.js) on 3000
    location / {
        proxy_pass http://127.0.0.1:3000;
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

    listen 80;
    # SSL will be added by certbot
}

server {
    server_name veveve.dk www.veveve.dk;
    listen 80;
    return 301 https://$host$request_uri;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Start Application Services

```bash
cd /var/www/vvv-frontpage

# Start database and Redis first
docker-compose up -d postgres redis
sleep 10

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec -T backend python manage.py migrate --noinput

# Collect static files
docker-compose exec -T backend python manage.py collectstatic --noinput

# Verify services
docker-compose ps
docker-compose logs --tail=50
```

### Step 7: Setup SSL Certificate

Once DNS points to the new server:

```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

### Step 8: Update DNS

Update DNS A records:
- `veveve.dk` → `143.198.105.78`
- `www.veveve.dk` → `143.198.105.78`

Lower TTL to 300s before migration for faster cutover.

### Step 9: Verify Migration

```bash
cd /var/www/vvv-frontpage
bash scripts/verify-migration.sh veveve.dk
```

---

## 🔧 Application Details

### Runtime Requirements

- **Frontend**: Next.js 13 (Node.js 16+)
- **Backend**: Django (Python 3.9+)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Containerization**: Docker & Docker Compose

### Environment Variables

The application requires these environment files:

1. **`env/backend.env`** - Django backend configuration
   - `DJANGO_SECRET_KEY`
   - `DJANGO_SETTINGS_MODULE=api.settings.prod`
   - `ALLOWED_HOSTS=veveve.dk,www.veveve.dk`
   - Database credentials
   - Redis URL

2. **`env/frontend.env`** - Next.js frontend configuration
   - `NEXT_PUBLIC_APP_URL=https://veveve.dk`
   - `NEXT_PUBLIC_API_URL=https://veveve.dk/api`
   - `JWT_SECRET`
   - Database connection (for API routes)

### Production Domain

**Primary Domain**: `veveve.dk`  
**WWW Domain**: `www.veveve.dk`

(Note: The migration brief mentioned `vvv-frontpage.dk` - please confirm the final production domain)

---

## ✅ Post-Migration Verification

### Quick Health Checks

```bash
# Check Docker services
docker-compose ps

# Check frontend
curl http://localhost:3000

# Check backend
curl http://localhost:8001/api/health/

# Check external access (after DNS update)
curl https://veveve.dk
curl https://veveve.dk/api/health
```

### Functional Tests

- [ ] Landing page loads: `https://veveve.dk`
- [ ] Login works: `https://veveve.dk/login`
- [ ] Dashboard accessible: `https://veveve.dk/dashboard`
- [ ] API endpoints respond: `https://veveve.dk/api/health`
- [ ] Database queries work
- [ ] No console errors in browser

---

## 🔄 GitHub Actions Deployment

After migration, GitHub Actions will automatically deploy on push to `main` branch.

The workflow:
1. Builds Docker images
2. Pushes to GitHub Container Registry
3. SSH to server (`vvv-web-deploy@143.198.105.78`)
4. Pulls latest code and images
5. Restarts Docker services
6. Runs migrations
7. Reloads Nginx

**Test deployment:**
```bash
# Push a small change or trigger manual workflow
# Check GitHub Actions tab for deployment status
```

---

## 🆘 Troubleshooting

### Permission Issues

```bash
# If permission errors occur
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage
```

### Docker Issues

```bash
# Check Docker is running
sudo systemctl status docker

# Check containers
docker-compose ps
docker-compose logs

# Restart services
docker-compose restart
```

### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log

# Verify upstream services
curl http://127.0.0.1:3000  # Frontend
curl http://127.0.0.1:8001/api/health/  # Backend
```

### Port Conflicts

```bash
# Check what's using ports
sudo netstat -tulpn | grep -E ':(3000|8001|5432|6379)'

# Update docker-compose.yml ports if needed
```

---

## 📞 Support

For issues during migration:
1. Check logs: `docker-compose logs`
2. Verify services: `docker-compose ps`
3. Test connectivity: Use curl commands above
4. Review this guide for missed steps

---

**Last Updated**: December 2024  
**Server**: vvv-app-web-v02 (143.198.105.78)


