# DigitalOcean Droplet Migration Guide

**Date**: January 11, 2026  
**Purpose**: Complete guide for migrating applications from one DigitalOcean droplet to another  
**Based on**: Migration of veveve.dk to vvv-app-web-v02 (143.198.105.78)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Migration Approaches](#migration-approaches)
4. [Direct Deployment (Simplest)](#direct-deployment-simplest)
5. [Full Migration (With Data)](#full-migration-with-data)
6. [SSL Certificate Setup](#ssl-certificate-setup)
7. [Verification](#verification)
8. [Post-Migration](#post-migration)
9. [Troubleshooting](#troubleshooting)
10. [Key Learnings](#key-learnings)

---

## Overview

This guide documents the complete process for migrating a web application from one DigitalOcean droplet to another. The migration process includes:

- **Application**: Next.js frontend + Django backend
- **Infrastructure**: Docker containers (PostgreSQL, Redis, backend, frontend)
- **Web Server**: Nginx (system-level, not containerized)
- **Deployment**: GitHub Actions automated deployment
- **SSL**: Let's Encrypt certificates via certbot

### Target Server Information

- **Server Name**: vvv-app-web-v02
- **IP Address**: 143.198.105.78
- **Deployment User**: vvv-web-deploy
- **Application Directory**: `/var/www/vvv-frontpage`
- **Domain**: veveve.dk, www.veveve.dk

---

## Prerequisites

Before starting the migration, ensure you have:

### Access Requirements

- [ ] SSH access to the new droplet
- [ ] GitHub repository access
- [ ] DNS management access (for domain configuration)
- [ ] GitHub Actions secrets management access

### Server Requirements

The new droplet should have:

- **OS**: Ubuntu 20.04+ (recommended: Ubuntu 22.04 or 24.04)
- **Software**: Docker, Docker Compose, Git, Nginx, Certbot
- **Resources**: Sufficient CPU, RAM, and disk space for your application
- **Network**: Ports 80, 443, 22 open

### Information to Gather

- [ ] Old server SSH details (host, user, port)
- [ ] New server SSH details (host, user, port)
- [ ] Current database credentials
- [ ] Current environment variable values
- [ ] Domain DNS TTL (lower to 300s before migration)
- [ ] SSL certificate expiration date (if applicable)

---

## Migration Approaches

There are two approaches to migration:

### 1. Direct Deployment (Recommended for New Deployments)

**When to use:**
- Starting fresh
- No existing data to migrate
- New application deployment
- Faster and simpler

**What's included:**
- Clone repository
- Create new database
- Configure environment
- Setup SSL
- No data transfer needed

**Time estimate**: 30-60 minutes

### 2. Full Migration (With Data Transfer)

**When to use:**
- Need to preserve existing data
- Migrating production system
- Need to migrate users, content, database

**What's included:**
- Export database from old server
- Export environment files
- Transfer data to new server
- Import database
- Configure and verify
- Setup SSL

**Time estimate**: 60-90 minutes

---

## Direct Deployment (Simplest)

This is the recommended approach for new deployments or when you don't need existing data.

### Step 1: GitHub Actions Setup

Before deploying, configure GitHub Actions secrets:

**Repository → Settings → Secrets and variables → Actions**

| Secret Name | Value | Notes |
|------------|-------|-------|
| `SSH_HOST` | `143.198.105.78` | New server IP address |
| `SSH_USER` | `vvv-web-deploy` | Deployment user on new server |
| `SSH_PRIVATE_KEY` | SSH private key content | Get from secure vault |
| `SSH_PORT` | `22` | Default SSH port (optional) |

**Generate SSH Key (if needed):**
```bash
# On new server
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Copy private key to GitHub secret
cat ~/.ssh/github_actions
```

### Step 2: Server Setup

**SSH to the new server:**
```bash
ssh vvv-web-deploy@143.198.105.78
```

**Install required software:**
```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y docker.io docker-compose git curl nginx certbot python3-certbot-nginx

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker  # Or logout/login to apply group changes

# Verify installations
docker --version
docker-compose --version
git --version
nginx -v
```

**Create application directory:**
```bash
sudo mkdir -p /var/www/vvv-frontpage
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage
```

### Step 3: Clone Repository

```bash
cd /var/www/vvv-frontpage
git clone <repository-url> .
```

Replace `<repository-url>` with your actual repository URL.

### Step 4: Environment Configuration

**Create environment files:**
```bash
# Copy example files
cp env/backend.env.example env/backend.env
cp env/frontend.env.example env/frontend.env

# Edit with production values
nano env/backend.env
nano env/frontend.env
```

**Required values for `env/backend.env`:**
```bash
DJANGO_SECRET_KEY=<generate-new-or-use-existing>
DJANGO_SETTINGS_MODULE=api.settings.prod
ALLOWED_HOSTS=veveve.dk,www.veveve.dk
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=vvv_database
DATABASE_USER=vvv_user
DATABASE_PASSWORD=<secure-password>
REDIS_URL=redis://redis:6379/0
```

**Required values for `env/frontend.env`:**
```bash
NEXT_PUBLIC_APP_URL=https://veveve.dk
NEXT_PUBLIC_API_URL=https://veveve.dk/api
JWT_SECRET=<generate-new-or-use-existing>
DB_HOST=postgres
DB_USER=vvv_user
DB_NAME=vvv_database
DB_PASSWORD=<same-as-backend>
DB_PORT=5432
```

**Generate secure keys:**
```bash
# Generate Django secret key
openssl rand -base64 32

# Generate JWT secret
openssl rand -base64 32
```

### Step 5: Nginx Configuration

**Copy nginx configuration:**
```bash
sudo cp deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/
```

**Test configuration:**
```bash
sudo nginx -t
```

**Reload nginx:**
```bash
sudo systemctl reload nginx
```

### Step 6: Start Docker Services

**Start database and Redis first:**
```bash
cd /var/www/vvv-frontpage
docker-compose up -d postgres redis

# Wait for services to initialize
sleep 10
```

**Verify database:**
```bash
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;"
```

**Start all services:**
```bash
docker-compose up -d
```

**Check service status:**
```bash
docker-compose ps
```

**Run database migrations:**
```bash
docker-compose exec backend python manage.py migrate --noinput
```

**Collect static files:**
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

**Create superuser (optional, for admin access):**
```bash
docker-compose exec backend python manage.py createsuperuser
```

### Step 7: DNS Update

**Update DNS A records:**
- `veveve.dk` → `143.198.105.78`
- `www.veveve.dk` → `143.198.105.78`

**Lower TTL to 300s before migration for faster cutover**

**Verify DNS propagation:**
```bash
dig veveve.dk +short
# Should return: 143.198.105.78
```

Wait for DNS to propagate (can take 5 minutes to 48 hours, usually < 1 hour).

### Step 8: SSL Certificate Setup

**See [SSL Certificate Setup](#ssl-certificate-setup) section below for detailed instructions.**

Quick version:
```bash
# Install certbot (if not already installed)
sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# Create certbot directory
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

# IMPORTANT: Add ACME challenge location to nginx config BEFORE running certbot
# Edit nginx config: sudo vim /etc/nginx/sites-available/vvv-frontpage
# Add after server_name line:
#   location /.well-known/acme-challenge/ {
#       root /var/www/certbot;
#       try_files $uri =404;
#   }

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx

# Run certbot
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

### Step 9: Verify Deployment

See [Verification](#verification) section below.

---

## Full Migration (With Data)

Use this approach when you need to migrate existing data from the old server.

### Step 1: Export from Old Server

**SSH to old server:**
```bash
ssh user@old-server-ip
```

**Navigate to application directory:**
```bash
cd /opt/vvv-frontpage  # or current location
```

**Run export script:**
```bash
bash scripts/migrate-server.sh export
```

This creates: `/tmp/vvv-migration-YYYYMMDD-HHMMSS.tar.gz`

The export includes:
- Database dump
- Environment files
- Docker compose configuration
- Nginx configuration
- Git commit hash

**Verify export:**
```bash
ls -lh /tmp/vvv-migration-*.tar.gz
```

### Step 2: Transfer to New Server

**Using SCP:**
```bash
# From old server or local machine
scp /tmp/vvv-migration-*.tar.gz vvv-web-deploy@143.198.105.78:/tmp/
```

**Using rsync:**
```bash
rsync -avz /tmp/vvv-migration-*.tar.gz vvv-web-deploy@143.198.105.78:/tmp/
```

**Verify transfer:**
```bash
# On new server
ssh vvv-web-deploy@143.198.105.78
ls -lh /tmp/vvv-migration-*.tar.gz
```

### Step 3: Import on New Server

**SSH to new server:**
```bash
ssh vvv-web-deploy@143.198.105.78
```

**Clone repository (if directory is empty):**
```bash
cd /var/www/vvv-frontpage
git clone <repository-url> .
```

**Import migration data:**
```bash
bash scripts/migrate-server.sh import /tmp/vvv-migration-*.tar.gz
```

The import script will:
- Extract the migration archive
- Restore environment files
- Restore database (if included)
- Display import status

### Step 4: Update Environment Files

**Review and update environment files:**
```bash
nano env/backend.env
nano env/frontend.env
```

**Key variables to update:**
- `ALLOWED_HOSTS` - Update if domain changed
- `NEXT_PUBLIC_APP_URL` - Update to new domain
- `NEXT_PUBLIC_API_URL` - Update to new domain
- Database credentials (verify they match docker-compose.yml)
- Server-specific paths

### Step 5: Start Services and Restore Database

**Start database and Redis:**
```bash
cd /var/www/vvv-frontpage
docker-compose up -d postgres redis
sleep 10
```

**Verify database (if import didn't restore it automatically):**
```bash
# Check if database was restored
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "\dt"

# If empty, restore manually:
cat /tmp/migration-backup/database.sql | docker-compose exec -T postgres psql -U vvv_user -d vvv_database
```

**Start all services:**
```bash
docker-compose up -d
```

**Run migrations (in case of schema changes):**
```bash
docker-compose exec backend python manage.py migrate --noinput
```

**Collect static files:**
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

**Verify services:**
```bash
docker-compose ps
docker-compose logs --tail=50
```

### Step 6: Continue with Steps 5-9 from Direct Deployment

(Setup Nginx, DNS, SSL, Verification)

---

## SSL Certificate Setup

**⚠️ IMPORTANT**: The ACME challenge location must be added to nginx config BEFORE running certbot.

### Step 1: Install Certbot

```bash
# Update package list
sudo apt update

# Install certbot and nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 2: Prepare Nginx Configuration

**Create certbot directory:**
```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
sudo chmod -R 755 /var/www/certbot
```

**Add ACME challenge location to nginx config:**
```bash
sudo vim /etc/nginx/sites-available/vvv-frontpage
```

**Add this block immediately after the `server_name` line (before any other location blocks):**

```nginx
server {
    server_name veveve.dk www.veveve.dk;
    
    # Let's Encrypt HTTP-01 challenge (must be before other location blocks)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    # Other location blocks...
    location /api/ {
        ...
    }
```

**Critical**: The location block must be:
- Inside the `server { ... }` block
- After the `server_name` line
- Before any other location blocks
- NOT in a commented section

**Test and reload nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3: Run Certbot

**Interactive mode (recommended for first time):**
```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

Certbot will prompt for:
1. Email address (for renewal notifications)
2. Terms of service agreement
3. Redirect HTTP to HTTPS (choose option 2)

**Non-interactive mode (for automation):**
```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk \
  --non-interactive \
  --agree-tos \
  --redirect \
  --email your-email@example.com
```

### Step 4: Verify SSL Installation

```bash
# Check certificate status
sudo certbot certificates

# Test HTTPS
curl -I https://veveve.dk

# Test HTTP redirect (should return 301)
curl -I http://veveve.dk

# Verify auto-renewal
sudo systemctl status certbot.timer

# Test renewal (dry-run)
sudo certbot renew --dry-run
```

**For detailed SSL setup instructions and troubleshooting, see `SSL_MIGRATION_GUIDE.md`.**

---

## Verification

After migration, verify everything is working correctly.

### Service Checks

```bash
# Check all Docker containers are running
cd /var/www/vvv-frontpage
docker-compose ps

# Check database connectivity
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;"

# Check frontend (local)
curl http://localhost:3000

# Check backend (local)
curl http://localhost:8001/api/health/
```

### External Access Checks

```bash
# Check HTTP redirects to HTTPS
curl -I http://veveve.dk
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://veveve.dk/

# Check HTTPS
curl -I https://veveve.dk
# Should return: HTTP/2 200 (or similar)

# Check API endpoint
curl https://veveve.dk/api/health/

# Check SSL certificate
sudo certbot certificates
```

### Functional Tests

- [ ] Landing page loads: `https://veveve.dk`
- [ ] Login page accessible: `https://veveve.dk/login`
- [ ] API endpoints respond: `https://veveve.dk/api/health/`
- [ ] Database queries work
- [ ] No console errors in browser
- [ ] Forms submit correctly
- [ ] Static files load (images, CSS, JS)

### Performance Checks

```bash
# Check container logs for errors
docker-compose logs --tail=100 | grep -i error

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check resource usage
docker stats
df -h  # Disk space
```

---

## Post-Migration

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

**Test deployment:**
```bash
# Push a small change or trigger manual workflow
# Check GitHub Actions tab for deployment status
```

### Monitoring Setup

Set up monitoring for:
- Service uptime
- Resource usage (CPU, memory, disk)
- SSL certificate expiration
- Error logs
- Database performance

### Backup Configuration

Ensure backups are configured:
- Database backups (daily)
- Environment files backup
- Configuration files backup
- SSL certificates (auto-renewed by certbot)

### Cleanup Old Server (After Verification)

**⚠️ Only after confirming new server works perfectly for 24-48 hours:**

```bash
# On old server:
# 1. Stop services
cd /opt/vvv-frontpage
docker-compose down

# 2. Backup data one more time
# 3. Archive or remove application directory
# 4. Update documentation
```

---

## Troubleshooting

### GitHub Actions Deployment Fails

**Symptoms**: Deployment workflow fails with SSH errors

**Solutions**:
1. Verify SSH secrets in GitHub Settings → Secrets and variables → Actions
2. Test SSH connection manually: `ssh vvv-web-deploy@143.198.105.78`
3. Check SSH key permissions (should be 600)
4. Verify user has sudo access (for nginx reload)
5. Check GitHub Actions workflow logs for specific errors

### SSL Certificate Setup Fails

**Symptoms**: Certbot fails with 404 errors on ACME challenge

**Solutions**:
1. **Most common**: ACME challenge location block missing from nginx config
   - Add location block BEFORE running certbot (see SSL setup section)
   - Location block must be inside server block, after server_name
2. Verify certbot directory exists: `/var/www/certbot`
3. Check DNS points to server: `dig veveve.dk +short`
4. Verify port 80 is accessible: `sudo netstat -tlnp | grep :80`
5. Check nginx is running: `sudo systemctl status nginx`
6. See `SSL_MIGRATION_GUIDE.md` for detailed troubleshooting

### Services Not Starting

**Symptoms**: Docker containers fail to start

**Solutions**:
1. Check logs: `docker-compose logs [service-name]`
2. Verify environment files exist and are configured correctly
3. Check database credentials match docker-compose.yml
4. Verify Docker is running: `sudo systemctl status docker`
5. Check disk space: `df -h`
6. Check port conflicts: `sudo netstat -tulpn | grep -E ':(3000|8001|5432|6379)'`

### Nginx Configuration Errors

**Symptoms**: `nginx -t` fails or nginx won't start

**Solutions**:
1. Test configuration: `sudo nginx -t`
2. Check syntax errors in config file
3. Verify ACME challenge location is inside server block
4. Check for duplicate location blocks
5. Verify all location blocks are properly closed
6. View error logs: `sudo tail -f /var/log/nginx/error.log`
7. Restore from backup if needed: `sudo cp /etc/nginx/sites-available/vvv-frontpage.backup /etc/nginx/sites-available/vvv-frontpage`

### Database Connection Errors

**Symptoms**: Backend can't connect to database

**Solutions**:
1. Verify database container is running: `docker-compose ps postgres`
2. Check database credentials in `env/backend.env`
3. Verify database name matches docker-compose.yml
4. Test connection: `docker-compose exec postgres psql -U vvv_user -d vvv_database`
5. Check database logs: `docker-compose logs postgres`
6. Verify database exists: `docker-compose exec postgres psql -U vvv_user -l`

### Port Conflicts

**Symptoms**: Services can't bind to ports

**Solutions**:
```bash
# Check what's using ports
sudo netstat -tulpn | grep -E ':(3000|8001|5432|6379)'

# Update docker-compose.yml ports if needed
# Or stop conflicting services
```

### Nginx 502 Bad Gateway

**Symptoms**: Website returns 502 error

**Solutions**:
1. Check services are running: `docker-compose ps`
2. Test upstream services:
   ```bash
   curl http://127.0.0.1:3000  # Frontend
   curl http://127.0.0.1:8001/api/health/  # Backend
   ```
3. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify nginx upstream config matches actual ports
5. Check service logs: `docker-compose logs frontend` or `docker-compose logs backend`

---

## Key Learnings

### What Worked Well

1. **Direct Deployment Approach** - Much simpler than full migration when data isn't needed
2. **GitHub Actions Deployment** - Automated deployments work great and reduce manual steps
3. **Docker Compose** - Easy service management and configuration
4. **Certbot** - SSL setup is straightforward once nginx is configured correctly
5. **Systematic Approach** - Following step-by-step process prevents errors

### Common Pitfalls

1. **ACME Challenge Location** - Must be added to nginx BEFORE running certbot
   - Location block must be inside server block
   - Must be after server_name, before other locations
   - Not in comments
2. **DNS Propagation** - Can take time, plan accordingly
   - Lower TTL before migration (300s)
   - Verify DNS before SSL setup
3. **Environment Variables** - Easy to miss required variables
   - Always check example files
   - Verify database credentials match docker-compose.yml
4. **Nginx Syntax** - Location blocks must be properly placed
   - Inside server block
   - Properly closed
   - Not duplicated
5. **Service Order** - Start database and Redis before other services
   - Wait for initialization (sleep 10)
   - Verify database before starting backend

### Best Practices

1. **Always backup** before migration
2. **Test nginx config** before reloading (`sudo nginx -t`)
3. **Verify services locally** before testing externally
4. **Follow systematic process** - don't skip steps
5. **Verify each step** before proceeding to next
6. **Document changes** as you go
7. **Test thoroughly** before DNS cutover
8. **Keep old server running** for 24-48 hours after migration

### Time Estimates

- **Direct Deployment**: 30-60 minutes
- **Full Migration**: 60-90 minutes
- **SSL Setup**: 15-20 minutes
- **DNS Propagation**: 5 minutes to 48 hours (usually < 1 hour)
- **Verification**: 15-30 minutes

**Total**: ~1.5-2 hours (excluding DNS propagation)

---

## Additional Resources

### Internal Documentation

- **`SSL_MIGRATION_GUIDE.md`** - Detailed SSL certificate setup guide
- **`SERVER_MIGRATION_V02.md`** - Detailed migration guide
- **`MIGRATION_V02_CHECKLIST.md`** - Step-by-step checklist
- **`DIRECT_DEPLOYMENT_V02.md`** - Simplified deployment guide
- **`MIGRATION_QUICK_REFERENCE.md`** - Quick command reference

### External Resources

- **Let's Encrypt Documentation**: https://letsencrypt.org/docs/
- **Certbot Documentation**: https://certbot.eff.org/docs/
- **Nginx SSL Configuration**: https://nginx.org/en/docs/http/configuring_https_servers.html
- **Docker Compose Documentation**: https://docs.docker.com/compose/
- **DigitalOcean Documentation**: https://docs.digitalocean.com/

---

## Support

If you encounter issues during migration:

1. **Check logs**: `docker-compose logs` and `sudo tail -f /var/log/nginx/error.log`
2. **Verify services**: `docker-compose ps`
3. **Test connectivity**: Use curl commands from verification section
4. **Review troubleshooting section** above
5. **Check documentation**: Refer to detailed guides listed above

---

## Document Information

**Document Version**: 1.0  
**Last Updated**: January 11, 2026  
**Author**: Migration Team  
**Server**: vvv-app-web-v02 (143.198.105.78)  
**Domain**: veveve.dk  

**Status**: ✅ Complete - Successfully tested on production migration

---

**This document consolidates all migration knowledge and can be shared with other development teams for similar migrations.**
