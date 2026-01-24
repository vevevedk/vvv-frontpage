# Server Migration Guide

**Purpose**: Complete guide for migrating VVV Frontpage from one server to another

---

## 📋 Pre-Migration Checklist

### Information Gathering
- [ ] Current server SSH details (host, user, port)
- [ ] New server SSH details (host, user, port)
- [ ] Current database credentials
- [ ] Current environment variable values
- [ ] Domain DNS TTL (lower to 300s before migration for faster cutover)
- [ ] SSL certificate location and expiration date
- [ ] Backup location and access

### Current Server Inventory
- [ ] Application directory: `/opt/vvv-frontpage` or `/home/$USER/vvv-frontpage`
- [ ] Database volume location
- [ ] Redis volume location
- [ ] Environment files location
- [ ] Nginx configuration location
- [ ] SSL certificates location
- [ ] Backup directory: `/opt/vvv-backups`

---

## 🚀 Migration Steps

### Phase 1: Prepare New Server

#### 1.1 Server Prerequisites
```bash
# On new server, install required software
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git curl nginx certbot python3-certbot-nginx

# Add user to docker group (if not root)
sudo usermod -aG docker $USER
newgrp docker

# Verify installations
docker --version
docker-compose --version
git --version
nginx -v
```

#### 1.2 Create Application Directory
```bash
# Choose one of these locations
sudo mkdir -p /opt/vvv-frontpage
sudo chown $USER:$USER /opt/vvv-frontpage

# OR use home directory
mkdir -p ~/vvv-frontpage
```

#### 1.3 Clone Repository
```bash
cd /opt/vvv-frontpage  # or ~/vvv-frontpage
git clone <repository-url> .
# OR if you have access, pull from existing repo
```

---

### Phase 2: Transfer Data from Old Server

#### 2.1 Create Migration Package on Old Server

Run this on the **OLD server**:

```bash
cd /opt/vvv-frontpage  # or current location

# Create migration package directory
MIGRATION_DIR="/tmp/vvv-migration-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$MIGRATION_DIR"

# Export database
echo "Exporting database..."
docker-compose exec -T postgres pg_dump -U vvv_user vvv_database > "$MIGRATION_DIR/database.sql"

# Copy environment files
echo "Copying environment files..."
cp -r env "$MIGRATION_DIR/"

# Copy docker-compose.yml
cp docker-compose.yml "$MIGRATION_DIR/"

# Copy nginx config
sudo cp /etc/nginx/sites-available/veveve.dk "$MIGRATION_DIR/nginx.conf" 2>/dev/null || true

# Save current git commit
git rev-parse HEAD > "$MIGRATION_DIR/git_commit.txt"

# Create archive
cd /tmp
tar -czf vvv-migration.tar.gz "$(basename $MIGRATION_DIR)"
echo "Migration package created: /tmp/vvv-migration.tar.gz"
```

#### 2.2 Transfer to New Server

**Option A: Using SCP**
```bash
# From your local machine or old server
scp -P <SSH_PORT> /tmp/vvv-migration.tar.gz <new_user>@<new_host>:/tmp/
```

**Option B: Using rsync**
```bash
rsync -avz -e "ssh -p <SSH_PORT>" /tmp/vvv-migration.tar.gz <new_user>@<new_host>:/tmp/
```

**Option C: Using cloud storage**
```bash
# Upload to S3, Google Drive, etc., then download on new server
```

---

### Phase 3: Setup on New Server

#### 3.1 Extract Migration Package
```bash
cd /opt/vvv-frontpage  # or your chosen directory
tar -xzf /tmp/vvv-migration.tar.gz -C /tmp/
MIGRATION_DIR=$(ls -td /tmp/vvv-migration-* | head -1)
```

#### 3.2 Restore Environment Files
```bash
# Copy environment files
cp -r "$MIGRATION_DIR/env" ./

# Review and update environment variables for new server
nano env/backend.env
nano env/frontend.env

# Key variables to update:
# - Database host (if using external DB)
# - API URLs (if domain/IP changed)
# - ALLOWED_HOSTS (if domain changed)
# - Any server-specific paths
```

#### 3.3 Setup Docker Compose
```bash
# Copy docker-compose.yml
cp "$MIGRATION_DIR/docker-compose.yml" ./

# Start database and Redis first
docker-compose up -d postgres redis

# Wait for services to be ready
sleep 10
```

#### 3.4 Restore Database
```bash
# Restore database from backup
cat "$MIGRATION_DIR/database.sql" | docker-compose exec -T postgres psql -U vvv_user -d vvv_database

# Verify restoration
docker-compose exec -T postgres psql -U vvv_user -d vvv_database -c "SELECT COUNT(*) FROM clients;"
```

#### 3.5 Setup Nginx
```bash
# Copy nginx configuration
sudo cp "$MIGRATION_DIR/nginx.conf" /etc/nginx/sites-available/veveve.dk

# OR use the one from repository
sudo cp deploy/veveve.dk.conf /etc/nginx/sites-available/veveve.dk

# Create symlink
sudo ln -sf /etc/nginx/sites-available/veveve.dk /etc/nginx/sites-enabled/veveve.dk

# Test configuration
sudo nginx -t

# If DNS already points to new server, setup SSL
sudo certbot --nginx -d veveve.dk -d www.veveve.dk

# Reload nginx
sudo systemctl reload nginx
```

#### 3.6 Start Application Services
```bash
cd /opt/vvv-frontpage

# Pull latest images (if using registry)
docker-compose pull || true

# Build images (if building locally)
docker-compose build

# Start all services
docker-compose up -d

# Run migrations (if any new ones)
docker-compose exec -T backend python manage.py migrate --noinput

# Check service status
docker-compose ps
docker-compose logs --tail=50
```

---

### Phase 4: DNS Cutover

#### 4.1 Update DNS Records
```bash
# Update A records for veveve.dk and www.veveve.dk to point to new server IP
# DNS TTL should be low (300s) for faster propagation
```

#### 4.2 Verify DNS Propagation
```bash
# Check DNS propagation
dig veveve.dk +short
nslookup veveve.dk

# Wait for DNS to propagate (can take minutes to hours depending on TTL)
```

#### 4.3 Update SSL Certificate (if needed)
```bash
# If domain already points to new server, SSL should work
# If not, you may need to:
sudo certbot --nginx -d veveve.dk -d www.veveve.dk --force-renewal
```

---

### Phase 5: Update GitHub Actions Secrets

#### 5.1 Update Repository Secrets
Go to GitHub repository → Settings → Secrets and variables → Actions

Update these secrets:
- `SSH_HOST`: New server IP or hostname
- `SSH_USER`: New server username
- `SSH_PRIVATE_KEY`: New server SSH private key
- `SSH_PORT`: New server SSH port (default: 22)

#### 5.2 Test Deployment
```bash
# Trigger a manual deployment via GitHub Actions
# Or push a small change to main branch
```

---

### Phase 6: Verification

#### 6.1 Health Checks
```bash
# Frontend health
curl -I https://veveve.dk

# API health
curl https://veveve.dk/api/health

# Backend health
curl https://veveve.dk/api/health/
```

#### 6.2 Functional Tests
- [ ] Landing page loads
- [ ] Login works
- [ ] Dashboard loads
- [ ] API endpoints respond
- [ ] Database queries work
- [ ] No console errors

#### 6.3 Performance Check
```bash
# Check container status
docker-compose ps

# Check logs for errors
docker-compose logs --tail=100 | grep -i error

# Check database connection
docker-compose exec -T postgres psql -U vvv_user -d vvv_database -c "SELECT version();"
```

---

## 🔄 Rollback Plan

If migration fails, rollback steps:

### Quick Rollback (DNS only)
```bash
# Revert DNS to point back to old server
# This is fastest if old server is still running
```

### Full Rollback
```bash
# On old server, ensure services are still running
cd /opt/vvv-frontpage
docker-compose up -d

# Revert DNS
# Verify old server is accessible
```

---

## 📝 Post-Migration Tasks

### Cleanup Old Server (After Verification)
```bash
# Only after confirming new server works perfectly for 24-48 hours

# On old server:
# 1. Stop services
docker-compose down

# 2. Backup data one more time
# 3. Archive or remove application directory
# 4. Update documentation
```

### Update Documentation
- [ ] Update server IP/hostname in documentation
- [ ] Update deployment scripts if paths changed
- [ ] Update monitoring/alerting systems
- [ ] Update team access documentation

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Check database is running
docker-compose ps postgres

# Check connection from backend
docker-compose exec backend python manage.py dbshell

# Verify credentials in env/backend.env
```

### Port Conflicts
```bash
# Check what's using ports
sudo netstat -tulpn | grep -E ':(3000|8001|5432|6379)'

# Update docker-compose.yml ports if needed
```

### Nginx Issues
```bash
# Test nginx config
sudo nginx -t

# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify upstream services are running
curl http://127.0.0.1:3000  # Frontend
curl http://127.0.0.1:8001/api/health/  # Backend
```

### SSL Certificate Issues
```bash
# Check certificate expiration
sudo certbot certificates

# Renew if needed
sudo certbot renew --dry-run
```

---

## 📞 Support

If you encounter issues during migration:
1. Check logs: `docker-compose logs`
2. Verify all services are running: `docker-compose ps`
3. Test connectivity: `curl` commands above
4. Review this guide for missed steps

---

**Last Updated**: December 2024


