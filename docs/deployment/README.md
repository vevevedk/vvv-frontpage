# Deployment Guide

## 🚀 Quick Deployment

### Production Deployment (Recommended)
```bash
# 1. SSH to production server
ssh user@your-server.com

# 2. Navigate to project directory
cd /opt/vvv-frontpage

# 3. Pull latest changes
git pull origin main

# 4. Run comprehensive deployment
./deploy-secure.sh
```

### Emergency Quick Fix
```bash
# If app is down and needs immediate fix
./quick-server-fix.sh
```

## 📋 Complete Deployment Process

### Prerequisites
- [ ] Docker and Docker Compose installed
- [ ] Domain DNS pointing to server
- [ ] SSL certificates configured
- [ ] Environment files configured

### Step-by-Step Deployment

#### 1. Pre-Deployment Checklist
- [ ] Backup current database
- [ ] Verify all environment variables
- [ ] Check disk space (minimum 5GB free)
- [ ] Confirm domain DNS resolution
- [ ] Test SSL certificates

#### 2. Code Deployment
```bash
# Pull latest code
git pull origin main

# Verify you're on correct branch
git branch

# Check for any uncommitted changes
git status
```

#### 3. Environment Configuration
```bash
# Verify environment files exist
ls -la env/
# Should show: backend.env, frontend.env

# Check critical environment variables
grep -E "DJANGO_SECRET_KEY|DB_PASSWORD|ALLOWED_HOSTS" env/backend.env
grep -E "NEXT_PUBLIC_API_URL|JWT_SECRET" env/frontend.env
```

#### 4. Database Migration
```bash
# Stop services
docker-compose down

# Backup database (if needed)
docker-compose up -d postgres
docker-compose exec postgres pg_dump -U vvv_user vvv_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
docker-compose up -d --build
sleep 30
docker-compose exec backend python manage.py migrate
```

#### 5. Service Deployment
```bash
# Build and start all services
docker-compose up -d --build

# Verify all services are running
docker-compose ps

# Check service health
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend
```

#### 6. Post-Deployment Verification
```bash
# Test API endpoints
curl -I https://veveve.dk/api/
curl -I https://veveve.dk/

# Check database connectivity
docker-compose exec backend python manage.py shell -c "from django.db import connection; connection.ensure_connection(); print('DB OK')"

# Verify WooCommerce sync (if applicable)
docker-compose exec backend python manage.py sync_woocommerce_direct --config-id 1 --job-type daily_sync --days-back 1
```

## 🔧 Deployment Scripts

### Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `deploy-secure.sh` | Full secure deployment | Regular deployments |
| `quick-server-fix.sh` | Emergency server fix | When app is down |
| `comprehensive-fix.sh` | Complete system fix | After major issues |
| `fix-production-issues.sh` | Production-specific fixes | Production problems |

### Script Usage
```bash
# Make scripts executable
chmod +x *.sh

# Run specific deployment
./deploy-secure.sh

# Check script help
./quick-server-fix.sh --help
```

## 🌐 Environment-Specific Deployment

### Development Environment
```bash
# Local development
docker-compose -f docker-compose.dev.yml up -d
```

### Staging Environment
```bash
# Staging deployment
docker-compose -f docker-compose.staging.yml up -d
```

### Production Environment
```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 🔍 Troubleshooting Deployment

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database container
docker-compose logs postgres

# Verify database credentials
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;"

# Fix: Update DB_PASSWORD in env/backend.env
```

#### 2. SSL Certificate Issues
```bash
# Check Nginx configuration
sudo nginx -t

# Verify SSL certificates
sudo certbot certificates

# Fix: Renew certificates
sudo certbot renew
```

#### 3. Container Won't Start
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Check system resources
df -h
free -h

# Fix: Clean up Docker resources
docker system prune -f
```

#### 4. API Endpoints Not Responding
```bash
# Check backend health
curl -I http://localhost:8001/api/

# Check Nginx configuration
sudo nginx -t
sudo systemctl reload nginx

# Fix: Restart services
docker-compose restart backend frontend
```

## 📊 Monitoring Deployment

### Health Checks
```bash
# Service status
docker-compose ps

# Resource usage
docker stats

# Log monitoring
docker-compose logs -f backend
```

### Performance Monitoring
```bash
# Check response times
curl -w "@curl-format.txt" -o /dev/null -s https://veveve.dk/

# Monitor system resources
htop
iostat -x 1
```

## 🔄 Rollback Procedures

### Quick Rollback
```bash
# Rollback to previous commit
git log --oneline -5
git reset --hard HEAD~1
docker-compose up -d --build
```

### Database Rollback
```bash
# Restore database from backup
docker-compose exec postgres psql -U vvv_user -d vvv_database < backup_YYYYMMDD_HHMMSS.sql
```

## 📝 Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed and tested
- [ ] Database backup created
- [ ] Environment variables verified
- [ ] SSL certificates valid
- [ ] Server resources adequate

### During Deployment
- [ ] Services stopped gracefully
- [ ] Database migrations applied
- [ ] New code deployed
- [ ] Services restarted
- [ ] Health checks passed

### Post-Deployment
- [ ] All endpoints responding
- [ ] Database connectivity verified
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team notified of changes

## 🆘 Emergency Procedures

### App Completely Down
1. Run `./quick-server-fix.sh`
2. Check `docker-compose ps`
3. Review logs: `docker-compose logs --tail=100`
4. Restart services: `docker-compose restart`

### Database Issues
1. Check database container: `docker-compose logs postgres`
2. Verify credentials in `env/backend.env`
3. Restore from backup if needed
4. Run migrations: `docker-compose exec backend python manage.py migrate`

### SSL/HTTPS Issues
1. Check Nginx: `sudo nginx -t`
2. Verify certificates: `sudo certbot certificates`
3. Restart Nginx: `sudo systemctl restart nginx`

---

*Last Updated: September 30, 2025*
*For questions or issues, contact the development team.*
