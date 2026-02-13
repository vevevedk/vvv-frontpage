# Migration Brief - Answers

## 📋 Questions from Migration Brief

### 1. Runtime Requirements

**Answer**: The application requires:

- **Node.js**: Version 16.x or higher (required for Next.js 13)
- **Python**: Version 3.9+ (required for Django backend)
- **Docker & Docker Compose**: For containerized deployment
- **PostgreSQL**: Version 15 (via Docker)
- **Redis**: Version 7 (via Docker)

**Note**: The application runs in Docker containers, so these runtimes are containerized. The server needs Docker and Docker Compose installed.

---

### 2. Environment Variables (.env files)

**Answer**: Yes, the application requires environment files to be manually placed on the server.

**Location**: `/var/www/vvv-frontpage/env/`

**Required Files**:

1. **`env/backend.env`** - Django backend configuration
   ```bash
   DJANGO_SECRET_KEY=<secret-key>
   DJANGO_SETTINGS_MODULE=api.settings.prod
   ALLOWED_HOSTS=veveve.dk,www.veveve.dk
   DATABASE_HOST=postgres
   DATABASE_PORT=5432
   DATABASE_NAME=vvv_database
   DATABASE_USER=vvv_user
   DATABASE_PASSWORD=<password>
   REDIS_URL=redis://redis:6379/0
   # ... other backend-specific variables
   ```

2. **`env/frontend.env`** - Next.js frontend configuration
   ```bash
   NEXT_PUBLIC_APP_URL=https://veveve.dk
   NEXT_PUBLIC_API_URL=https://veveve.dk/api
   JWT_SECRET=<secret>
   DB_HOST=postgres
   DB_USER=vvv_user
   DB_NAME=vvv_database
   DB_PASSWORD=<password>
   DB_PORT=5432
   # ... other frontend-specific variables
   ```

**Migration**: These files are included in the migration export and will be restored automatically. They should be reviewed and updated for the new server environment.

---

### 3. Production Domain Name

**Answer**: The production domain is:

- **Primary**: `veveve.dk`
- **WWW**: `www.veveve.dk`

**Note**: The migration brief mentioned `vvv-frontpage.dk` - please confirm if this should also be included or if `veveve.dk` is the correct final domain.

**SSL Certificate**: Should be requested for:
```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

---

## 🔧 Additional Configuration Notes

### Nginx Configuration

The application uses **Docker containers** with Nginx as a reverse proxy:

- **Frontend (Next.js)**: Runs on port `3000` inside Docker, exposed to host
- **Backend (Django)**: Runs on port `8001` inside Docker (mapped from container port 8000)
- **Nginx**: System Nginx proxies to these Docker services

The Nginx configuration template is provided in:
- `deploy/vvv-frontpage-v02.conf` (for this server)
- `deploy/veveve.dk.conf` (original template)

### Deployment Process

1. **GitHub Actions** builds Docker images and pushes to GitHub Container Registry
2. **SSH deployment** pulls images and restarts containers
3. **Nginx** serves as reverse proxy (system-level, not containerized)

### Directory Structure

```
/var/www/vvv-frontpage/
├── env/
│   ├── backend.env
│   └── frontend.env
├── docker-compose.yml
├── deploy/
│   └── vvv-frontpage-v02.conf
└── ... (application code)
```

---

## ✅ Ready for Migration

All configuration files and scripts have been updated for:
- Server: `vvv-app-web-v02` (143.198.105.78)
- User: `vvv-web-deploy`
- Directory: `/var/www/vvv-frontpage`
- Domain: `veveve.dk` (confirm if different)

See `MIGRATION_V02_CHECKLIST.md` for step-by-step migration instructions.


