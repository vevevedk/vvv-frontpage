# DigitalOcean Droplet Migration Summary

**Purpose**: Complete guide for migrating applications from one DigitalOcean droplet to another  
**Example Migration**: veveve.dk from old server to vvv-app-web-v02 (143.198.105.78)  
**Date**: January 2026

---

## 📚 Related Documentation

This summary references the following detailed guides:

1. **`SERVER_MIGRATION_V02.md`** - Complete step-by-step migration guide
2. **`MIGRATION_V02_CHECKLIST.md`** - Detailed checklist for migration
3. **`DIRECT_DEPLOYMENT_V02.md`** - Simplified deployment (no data migration)
4. **`SSL_MIGRATION_GUIDE.md`** - SSL certificate setup process
5. **`MIGRATION_QUICK_REFERENCE.md`** - Quick command reference

---

## 🎯 Migration Overview

### Migration Type

There are two approaches:

1. **Full Migration** (with data transfer)
   - Export database, env files, configs from old server
   - Transfer to new server
   - Import and configure
   - **Use when**: You need existing data, users, content

2. **Direct Deployment** (fresh start)
   - Clone repository on new server
   - Create new database
   - Set up environment
   - **Use when**: Starting fresh, no existing data needed

### Target Server

- **Server Name**: vvv-app-web-v02
- **IP Address**: 143.198.105.78
- **Deployment User**: vvv-web-deploy
- **Application Directory**: `/var/www/vvv-frontpage`
- **Domain**: veveve.dk, www.veveve.dk

---

## 🚀 Quick Start: Direct Deployment (Simplest)

This is the recommended approach for new deployments or when you don't need existing data.

### Prerequisites

- New droplet created on DigitalOcean
- SSH access to new server
- GitHub repository access
- DNS access (for domain configuration)

### Steps

#### 1. GitHub Actions Setup

Update GitHub Secrets:
- **SSH_HOST**: `143.198.105.78`
- **SSH_USER**: `vvv-web-deploy`
- **SSH_PRIVATE_KEY**: SSH private key for deployment user
- **SSH_PORT**: `22` (default)

#### 2. Initial Server Setup

```bash
# SSH to new server
ssh vvv-web-deploy@143.198.105.78

# Create application directory
sudo mkdir -p /var/www/vvv-frontpage
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage

# Clone repository
cd /var/www/vvv-frontpage
git clone <repository-url> .
```

#### 3. Environment Configuration

```bash
# Copy example env files
cp env/backend.env.example env/backend.env
cp env/frontend.env.example env/frontend.env

# Edit with production values
nano env/backend.env
nano env/frontend.env
```

**Key variables:**
- `ALLOWED_HOSTS=veveve.dk,www.veveve.dk`
- `NEXT_PUBLIC_APP_URL=https://veveve.dk`
- `NEXT_PUBLIC_API_URL=https://veveve.dk/api`
- Database credentials
- Secret keys

#### 4. Nginx Configuration

```bash
# Copy nginx config
sudo cp deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage

# Enable site
sudo ln -s /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Start Docker Services

```bash
cd /var/www/vvv-frontpage

# Start database and Redis first
docker-compose up -d postgres redis
sleep 10

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate --noinput

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Verify
docker-compose ps
```

#### 6. DNS Update

Update DNS A records:
- `veveve.dk` → `143.198.105.78`
- `www.veveve.dk` → `143.198.105.78`

Lower TTL to 300s before cutover for faster propagation.

#### 7. SSL Certificate Setup

Once DNS propagates:

```bash
# Install certbot (if not installed)
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Create certbot directory
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

# IMPORTANT: Add ACME challenge location to nginx config before running certbot
# Edit nginx config and add after server_name line:
# location /.well-known/acme-challenge/ {
#     root /var/www/certbot;
#     try_files $uri =404;
# }

# Test nginx config
sudo nginx -t
sudo systemctl reload nginx

# Run certbot
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

**See `SSL_MIGRATION_GUIDE.md` for detailed SSL setup instructions.**

#### 8. Verify Deployment

```bash
# Check services
docker-compose ps

# Test locally
curl http://localhost:3000
curl http://localhost:8001/api/health/

# Test externally
curl https://veveve.dk
curl https://veveve.dk/api/health
```

---

## 📦 Full Migration (With Data Transfer)

Use this approach when you need to migrate existing data from the old server.

### Steps

#### 1. Export from Old Server

```bash
# SSH to old server
ssh user@old-server-ip

# Navigate to application directory
cd /opt/vvv-frontpage  # or current location

# Run export script
bash scripts/migrate-server.sh export

# This creates: /tmp/vvv-migration-YYYYMMDD-HHMMSS.tar.gz
```

The export includes:
- Database dump
- Environment files
- Nginx configuration
- Docker compose configuration
- Git commit hash

#### 2. Transfer to New Server

```bash
# From old server or local machine
scp /tmp/vvv-migration-*.tar.gz vvv-web-deploy@143.198.105.78:/tmp/
```

#### 3. Import on New Server

```bash
# SSH to new server
ssh vvv-web-deploy@143.198.105.78

# Clone repository (if empty)
cd /var/www/vvv-frontpage
git clone <repository-url> .

# Import migration data
bash scripts/migrate-server.sh import /tmp/vvv-migration-*.tar.gz
```

#### 4. Update Environment Files

Review and update environment variables for new server:

```bash
nano env/backend.env
nano env/frontend.env
```

**Key updates:**
- `ALLOWED_HOSTS` - Update domain if changed
- `NEXT_PUBLIC_APP_URL` - Update to new domain
- `NEXT_PUBLIC_API_URL` - Update to new domain
- Database credentials (if changed)
- Server-specific paths

#### 5. Start Services and Restore Database

```bash
# Start database and Redis
docker-compose up -d postgres redis
sleep 10

# Restore database (import script does this automatically)
# Or manually:
cat /tmp/migration-backup/database.sql | docker-compose exec -T postgres psql -U vvv_user -d vvv_database

# Start all services
docker-compose up -d

# Run migrations (in case of schema changes)
docker-compose exec backend python manage.py migrate --noinput

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput
```

#### 6. Continue with Steps 4-8 from Direct Deployment

(Setup Nginx, DNS, SSL, Verification)

---

## 🔧 Key Configuration Files

### Nginx Configuration

Location: `/etc/nginx/sites-available/vvv-frontpage`

Key features:
- Proxies `/api/` to backend (port 8001)
- Proxies `/admin/` to backend (port 8001)
- Proxies `/` to frontend (port 3000)
- ACME challenge location for Let's Encrypt
- Security headers

### Environment Files

**`env/backend.env`** - Django backend configuration
- `DJANGO_SECRET_KEY`
- `ALLOWED_HOSTS`
- Database credentials
- Redis URL
- Security settings

**`env/frontend.env`** - Next.js frontend configuration
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`
- `JWT_SECRET`
- Database connection (for API routes)

### Docker Compose

Location: `/var/www/vvv-frontpage/docker-compose.yml`

Services:
- `postgres` - Database
- `redis` - Cache
- `backend` - Django API (port 8001)
- `frontend` - Next.js (port 3000)
- `worker` - Celery worker
- `beat` - Celery beat scheduler

---

## ✅ Verification Checklist

After migration, verify:

### Services

- [ ] All Docker containers running: `docker-compose ps`
- [ ] Database accessible: `docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;"`
- [ ] Frontend responding: `curl http://localhost:3000`
- [ ] Backend responding: `curl http://localhost:8001/api/health/`

### External Access

- [ ] HTTP accessible: `curl http://veveve.dk`
- [ ] HTTPS accessible: `curl https://veveve.dk`
- [ ] HTTP redirects to HTTPS: `curl -I http://veveve.dk` (should return 301)
- [ ] SSL certificate valid: `sudo certbot certificates`

### Functionality

- [ ] Landing page loads correctly
- [ ] Login page accessible
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] No console errors in browser
- [ ] Forms submit correctly

---

## 🚨 Common Issues and Solutions

### Issue: GitHub Actions Deployment Fails

**Symptoms**: Deployment workflow fails with SSH errors

**Solutions**:
1. Verify SSH secrets in GitHub Settings
2. Test SSH connection manually: `ssh vvv-web-deploy@143.198.105.78`
3. Check SSH key permissions
4. Verify user has sudo access (for nginx reload)

### Issue: SSL Certificate Setup Fails

**Symptoms**: Certbot fails with 404 errors on ACME challenge

**Solutions**:
1. Ensure ACME challenge location block is in nginx config BEFORE running certbot
2. Verify certbot directory exists: `/var/www/certbot`
3. Check DNS points to server: `dig veveve.dk +short`
4. Verify port 80 is accessible
5. See `SSL_MIGRATION_GUIDE.md` for detailed troubleshooting

### Issue: Services Not Starting

**Symptoms**: Docker containers fail to start

**Solutions**:
1. Check logs: `docker-compose logs`
2. Verify environment files exist and are configured
3. Check database credentials match docker-compose.yml
4. Verify Docker is running: `sudo systemctl status docker`
5. Check disk space: `df -h`

### Issue: Nginx Configuration Errors

**Symptoms**: `nginx -t` fails or nginx won't start

**Solutions**:
1. Test configuration: `sudo nginx -t`
2. Check syntax errors in config file
3. Verify ACME challenge location is inside server block
4. Check for duplicate location blocks
5. View error logs: `sudo tail -f /var/log/nginx/error.log`

### Issue: Database Connection Errors

**Symptoms**: Backend can't connect to database

**Solutions**:
1. Verify database container is running: `docker-compose ps postgres`
2. Check database credentials in `env/backend.env`
3. Verify database name matches docker-compose.yml
4. Test connection: `docker-compose exec postgres psql -U vvv_user -d vvv_database`

---

## 📊 Migration Timeline

### Estimated Time

- **Direct Deployment**: 30-60 minutes
- **Full Migration**: 60-90 minutes
- **SSL Setup**: 15-20 minutes
- **DNS Propagation**: 5 minutes to 48 hours (usually < 1 hour)

### Critical Path

1. Server setup (10 min)
2. Repository clone (5 min)
3. Environment configuration (15 min)
4. Docker services (10 min)
5. Nginx configuration (10 min)
6. DNS update (5 min + propagation time)
7. SSL setup (15 min)
8. Verification (10 min)

**Total**: ~1.5-2 hours (excluding DNS propagation)

---

## 🔄 Post-Migration

### GitHub Actions Deployment

After initial migration, GitHub Actions will handle future deployments automatically:

1. Push to `main` branch
2. GitHub Actions builds Docker images
3. Images pushed to GitHub Container Registry
4. Workflow SSH's to server
5. Pulls latest code and images
6. Restarts services
7. Runs migrations
8. Reloads nginx

**No manual deployment needed!**

### Monitoring

Set up monitoring for:
- Service uptime
- Resource usage (CPU, memory, disk)
- SSL certificate expiration
- Error logs
- Database performance

### Backups

Ensure backups are configured:
- Database backups (daily)
- Environment files backup
- Configuration files backup
- SSL certificates (auto-renewed by certbot)

---

## 📝 Key Learnings

### What Worked Well

1. **GitHub Actions Deployment** - Automated deployments work great
2. **Direct Deployment** - Simpler than full migration when data isn't needed
3. **Docker Compose** - Easy service management
4. **Certbot** - SSL setup is straightforward (once nginx is configured correctly)

### Common Pitfalls

1. **ACME Challenge Location** - Must be added to nginx BEFORE running certbot
2. **DNS Propagation** - Can take time, plan accordingly
3. **Environment Variables** - Easy to miss required variables
4. **Database Credentials** - Must match between env files and docker-compose.yml
5. **Nginx Syntax** - Location blocks must be inside server block

### Recommendations

1. **Always backup** before migration
2. **Test nginx config** before reloading
3. **Verify services locally** before testing externally
4. **Use SSL_MIGRATION_GUIDE.md** for SSL setup
5. **Follow MIGRATION_V02_CHECKLIST.md** for comprehensive checklist

---

## 📚 Additional Resources

- **SERVER_MIGRATION_V02.md** - Detailed migration guide
- **MIGRATION_V02_CHECKLIST.md** - Complete checklist
- **DIRECT_DEPLOYMENT_V02.md** - Simplified deployment guide
- **SSL_MIGRATION_GUIDE.md** - SSL certificate setup
- **MIGRATION_QUICK_REFERENCE.md** - Quick command reference

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Server**: vvv-app-web-v02 (143.198.105.78)  
**Domain**: veveve.dk
