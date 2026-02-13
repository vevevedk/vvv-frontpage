# Migration Status - vvv-app-web-v02

**Last Updated**: December 2024  
**Target Server**: 143.198.105.78 (vvv-app-web-v02)  
**Deployment User**: vvv-web-deploy

---

## ✅ Completed

- [x] GitHub Actions secrets configured
  - [x] SSH_HOST: 143.198.105.78
  - [x] SSH_USER: vvv-web-deploy
  - [x] SSH_PRIVATE_KEY: Configured
  - [x] SSH_PORT: 22 (or configured)

---

## 📋 Next Steps

### Option A: Direct Deployment (Recommended - Simpler!)

If you don't need to migrate existing data, just deploy fresh:

```bash
# SSH to new server
ssh vvv-web-deploy@143.198.105.78

# Clone repo
cd /var/www
git clone <repository-url> vvv-frontpage
cd vvv-frontpage

# Create env files (copy from examples)
cp env/backend.env.example env/backend.env
cp env/frontend.env.example env/frontend.env
# Edit with your values

# Start services
docker-compose up -d
docker-compose exec backend python manage.py migrate
```

See `DIRECT_DEPLOYMENT_V02.md` for complete instructions.

### Option B: Full Migration (If You Need Existing Data)

### 1. Export from Old Server
```bash
# SSH to old server
ssh user@old-server

# Navigate to app directory
cd /opt/vvv-frontpage  # or current location

# Run export script
bash scripts/migrate-server.sh export

# Transfer archive to new server
scp /tmp/vvv-migration-*.tar.gz vvv-web-deploy@143.198.105.78:/tmp/
```

### 2. Initial Setup on New Server
```bash
# SSH to new server
ssh vvv-web-deploy@143.198.105.78

# Clone repository (if directory is empty)
cd /var/www/vvv-frontpage
git clone <repository-url> .

# Import migration data
bash scripts/migrate-server.sh import /tmp/vvv-migration-*.tar.gz
```

### 3. Configure Environment
```bash
# Review and update environment files
nano env/backend.env
nano env/frontend.env

# Key variables to verify:
# - ALLOWED_HOSTS=veveve.dk,www.veveve.dk
# - NEXT_PUBLIC_APP_URL=https://veveve.dk
# - NEXT_PUBLIC_API_URL=https://veveve.dk/api
# - Database credentials
```

### 4. Setup Nginx
```bash
# Copy Nginx configuration
sudo cp deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage

# Enable site
sudo ln -s /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Start Services
```bash
cd /var/www/vvv-frontpage

# Start database and Redis
docker-compose up -d postgres redis
sleep 10

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec -T backend python manage.py migrate --noinput
docker-compose exec -T backend python manage.py collectstatic --noinput

# Verify
docker-compose ps
```

### 6. Update DNS
- Update A records for `veveve.dk` and `www.veveve.dk` → `143.198.105.78`
- Lower TTL to 300s before migration for faster cutover

### 7. Setup SSL
```bash
# After DNS propagates
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

### 8. Verify Migration
```bash
# Run verification script
bash scripts/verify-migration.sh veveve.dk

# Manual checks
curl https://veveve.dk
curl https://veveve.dk/api/health
```

### 9. Test GitHub Actions Deployment
- Push a small change to `main` branch, OR
- Manually trigger workflow from Actions tab
- Verify deployment succeeds

---

## 🔍 Current Configuration

### GitHub Actions
- ✅ Secrets configured
- ✅ Workflow ready: `.github/workflows/deploy.yml`
- ✅ Deploys to: `/var/www/vvv-frontpage`
- ✅ Uses: `vvv-web-deploy` user with sudo

### Server Setup
- ✅ Directory: `/var/www/vvv-frontpage` (pre-configured)
- ✅ Permissions: `vvv-web-deploy:vvv-web-deploy` (pre-configured)
- ✅ Sudo: Passwordless sudo configured (pre-configured)

### Documentation
- ✅ Migration guide: `SERVER_MIGRATION_V02.md`
- ✅ Checklist: `MIGRATION_V02_CHECKLIST.md`
- ✅ Nginx config: `deploy/vvv-frontpage-v02.conf`
- ✅ Migration scripts: `scripts/migrate-server.sh`
- ✅ Verification script: `scripts/verify-migration.sh`

---

## 🚀 Ready to Migrate

All configuration is complete. You can now proceed with the migration steps above.

**Quick Start**: Follow `MIGRATION_V02_CHECKLIST.md` for step-by-step instructions.

---

## 📞 Questions?

- **Domain**: Confirm if `veveve.dk` is correct (or if `vvv-frontpage.dk` should be used)
- **Environment Variables**: Review `env/backend.env` and `env/frontend.env` after import
- **Database**: Verify database credentials match new server setup

