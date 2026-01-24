# Migration Checklist - vvv-app-web-v02

**Target Server**: 143.198.105.78  
**User**: vvv-web-deploy  
**Directory**: /var/www/vvv-frontpage  
**Current Plan**: **Direct deploy via GitHub Actions (no data migration from old server)**  
_Use the “Export from Old Server” section only if you later decide to migrate existing data._

---

## ✅ Pre-Migration

- [ ] Lower DNS TTL to 300s for faster cutover
- [ ] Backup current production database
- [ ] Document current environment variables
- [ ] Note current SSL certificate expiration date

## 🔐 GitHub Actions Setup

- [ ] Add `SSH_HOST` secret: `143.198.105.78`
- [ ] Add `SSH_USER` secret: `vvv-web-deploy`
- [ ] Add `SSH_PRIVATE_KEY` secret: (content of vvv_web_deploy_key from vault)
- [ ] Verify `SSH_PORT` is set to `22` (or add if needed)
- [ ] Test SSH connection: `ssh vvv-web-deploy@143.198.105.78`

## 📦 Export from Old Server (optional - only if migrating existing data)

- [ ] SSH to old server
- [ ] Run: `bash scripts/migrate-server.sh export`
- [ ] Verify archive created: `/tmp/vvv-migration-*.tar.gz`
- [ ] Transfer archive to new server: `scp /tmp/vvv-migration-*.tar.gz vvv-web-deploy@143.198.105.78:/tmp/`

## 🚀 Setup on New Server

### Initial Setup
- [ ] SSH to new server: `ssh vvv-web-deploy@143.198.105.78`
- [ ] Verify directory exists: `ls -la /var/www/vvv-frontpage`
- [ ] Clone repository (if empty): `git clone <repo-url> /var/www/vvv-frontpage`
- [ ] Import migration: `bash scripts/migrate-server.sh import /tmp/vvv-migration-*.tar.gz`

### Environment Configuration
- [ ] Review `env/backend.env`:
  - [ ] `DJANGO_SECRET_KEY` set
  - [ ] `ALLOWED_HOSTS` includes `veveve.dk,www.veveve.dk`
  - [ ] Database credentials correct
  - [ ] Redis URL correct
- [ ] Review `env/frontend.env`:
  - [ ] `NEXT_PUBLIC_APP_URL=https://veveve.dk`
  - [ ] `NEXT_PUBLIC_API_URL=https://veveve.dk/api`
  - [ ] `JWT_SECRET` set

### Docker Services (new server)
- [ ] Start database: `docker-compose up -d postgres redis`
- [ ] Wait 10 seconds for services to initialize
- [ ] Verify database: `docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;"`
- [ ] Start all services: `docker-compose up -d`
- [ ] Check status: `docker-compose ps`
- [ ] Run migrations: `docker-compose exec backend python manage.py migrate --noinput`
- [ ] Collect static: `docker-compose exec backend python manage.py collectstatic --noinput`

### Nginx Configuration
- [ ] Ensure nginx is installed: `which nginx` (typically `/usr/sbin/nginx`)
- [ ] Copy config: `sudo cp deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage`
- [ ] Enable site: `sudo ln -s /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/`
- [ ] If using passwordless sudo for deploy user, allow full paths (example in `SUDO_SIMPLE.md`):
  - [ ] `/usr/sbin/nginx -t`
  - [ ] `/usr/sbin/nginx`
  - [ ] `/bin/systemctl reload nginx`
- [ ] Test config: `sudo /usr/sbin/nginx -t`
- [ ] Reload Nginx: `sudo systemctl reload nginx`

### 🔁 Direct Deploy via GitHub Actions (no DB migration)
- [ ] Confirm GitHub Secrets for deploy workflow:
  - [ ] `SSH_HOST=143.198.105.78`
  - [ ] `SSH_USER=vvv-web-deploy`
  - [ ] `SSH_PRIVATE_KEY` (matches `/home/vvv-web-deploy/.ssh/authorized_keys`)
  - [ ] `SSH_PORT=22` (or custom if changed)
- [ ] On server, verify Docker is installed and user in `docker` group:
  - [ ] `docker --version`
  - [ ] `docker-compose --version`
  - [ ] `id vvv-web-deploy` shows `docker` group
- [ ] On server, verify env files:
  - [ ] `env/backend.env` matches `docker-compose.yml` DB settings (especially `DB_PASSWORD`)
  - [ ] `env/frontend.env` has correct `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_API_URL`
- [ ] Trigger GitHub Actions deploy (`main` push or manual `workflow_dispatch`)
- [ ] After workflow, on server:
  - [ ] `cd /var/www/vvv-frontpage`
  - [ ] `docker-compose ps`
  - [ ] `docker-compose logs --tail=100`

## 🌐 DNS & SSL

- [ ] Update DNS A records:
  - [ ] `veveve.dk` → `143.198.105.78`
  - [ ] `www.veveve.dk` → `143.198.105.78`
- [ ] Wait for DNS propagation (check: `dig veveve.dk +short`)
- [x] Setup SSL: 
  - Option A (automated): `bash scripts/setup-ssl.sh` (recommended)
  - Option B (manual): `sudo certbot --nginx -d veveve.dk -d www.veveve.dk` ✅ COMPLETE
- [ ] Verify SSL: `curl -I https://veveve.dk`

## ✅ Verification

- [ ] Run verification script: `bash scripts/verify-migration.sh veveve.dk`
- [ ] Test frontend: `curl https://veveve.dk`
- [ ] Test API: `curl https://veveve.dk/api/health`
- [ ] Test login page: Visit `https://veveve.dk/login` in browser
- [ ] Test dashboard: Login and verify dashboard loads
- [ ] Check browser console for errors
- [ ] Verify database queries work
- [ ] Test GitHub Actions deployment (push small change or manual trigger)

## 🔄 Post-Migration

- [ ] Monitor logs: `docker-compose logs -f`
- [ ] Monitor for 24-48 hours before decommissioning old server
- [ ] Update team documentation with new server details
- [ ] Update monitoring/alerting systems
- [ ] Archive old server backups

## ❓ Questions to Confirm

- [ ] **Final production domain**: `veveve.dk` or `vvv-frontpage.dk`?
- [ ] **Node.js version required**: (Next.js 13 requires Node 16+)
- [ ] **Environment variables**: Any additional `.env` files needed?
- [ ] **External services**: Any API keys or external service URLs to update?

---

**Migration Date**: _______________  
**Completed By**: _______________  
**Notes**: _______________


