# Troubleshooting Guide

## 🚨 Emergency Procedures

### App Completely Down
```bash
# 1. Quick server fix
./quick-server-fix.sh

# 2. Check service status
docker-compose ps

# 3. If still down, comprehensive fix
./comprehensive-fix.sh
```

### Database Connection Failed
```bash
# 1. Check database container
docker-compose logs postgres

# 2. Verify credentials
grep DB_PASSWORD env/backend.env
grep POSTGRES_PASSWORD docker-compose.yml

# 3. Fix password mismatch
./fix-database-connection.sh
```

### SSL/HTTPS Issues
```bash
# 1. Check Nginx configuration
sudo nginx -t

# 2. Verify SSL certificates
sudo certbot certificates

# 3. Restart Nginx
sudo systemctl restart nginx
```

## 🔍 Common Issues

### 1. Docker Issues

#### Containers Won't Start
**Symptoms**: `docker-compose up` fails, containers exit immediately

**Diagnosis**:
```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Check system resources
df -h
free -h

# Check Docker status
docker system df
```

**Solutions**:
```bash
# Clean up Docker resources
./docker-cleanup.sh

# Rebuild containers
docker-compose down
docker-compose up -d --build

# Check for port conflicts
netstat -tulpn | grep :3000
netstat -tulpn | grep :8001
```

#### Out of Disk Space
**Symptoms**: `No space left on device`, containers fail to start

**Diagnosis**:
```bash
# Check disk usage
df -h

# Check Docker space usage
docker system df

# Find large files
du -sh /var/lib/docker/*
```

**Solutions**:
```bash
# Clean up Docker
docker system prune -a -f

# Remove unused volumes
docker volume prune -f

# Clean up logs
sudo journalctl --vacuum-time=7d
```

### 2. Database Issues

#### Connection Refused
**Symptoms**: `psycopg2.OperationalError: could not connect to server`

**Diagnosis**:
```bash
# Check database container
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;"
```

**Solutions**:
```bash
# Restart database
docker-compose restart postgres

# Check password alignment
grep -E "DB_PASSWORD|POSTGRES_PASSWORD" env/backend.env docker-compose.yml

# Fix password mismatch
./fix-database-connection.sh
```

#### Migration Errors
**Symptoms**: `django.db.utils.ProgrammingError: relation does not exist`

**Diagnosis**:
```bash
# Check migration status
docker-compose exec backend python manage.py showmigrations

# Check database tables
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "\dt"
```

**Solutions**:
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Reset migrations (if needed)
docker-compose exec backend python manage.py migrate --fake-initial
```

### 3. API Issues

#### 502 Bad Gateway
**Symptoms**: Frontend shows 502 error, API not responding

**Diagnosis**:
```bash
# Check backend container
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Test API directly
curl -I http://localhost:8001/api/
```

**Solutions**:
```bash
# Restart backend
docker-compose restart backend

# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### CORS Errors
**Symptoms**: `Access to fetch at 'http://localhost:8001/api/' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Diagnosis**:
```bash
# Check CORS settings
docker-compose exec backend python manage.py shell -c "
from django.conf import settings
print(settings.CORS_ALLOWED_ORIGINS)
"
```

**Solutions**:
```bash
# Update CORS settings in backend
# Add frontend URL to CORS_ALLOWED_ORIGINS

# Restart backend
docker-compose restart backend
```

### 4. Frontend Issues

#### Build Failures
**Symptoms**: Frontend container fails to build, `npm run build` errors

**Diagnosis**:
```bash
# Check build logs
docker-compose logs frontend

# Check package.json
cat package.json

# Check for syntax errors
npm run lint
```

**Solutions**:
```bash
# Clean node_modules
rm -rf node_modules package-lock.json

# Rebuild frontend
docker-compose up -d --build frontend

# Check for missing dependencies
npm install
```

#### Environment Variables Not Loading
**Symptoms**: Frontend can't connect to API, environment variables undefined

**Diagnosis**:
```bash
# Check environment file
cat env/frontend.env

# Check container environment
docker-compose exec frontend env | grep NEXT_PUBLIC
```

**Solutions**:
```bash
# Update environment file
# Ensure NEXT_PUBLIC_ variables are set

# Restart frontend
docker-compose restart frontend
```

### 5. WooCommerce Issues

#### Sync Failures
**Symptoms**: WooCommerce data not syncing, sync errors in logs

**Diagnosis**:
```bash
# Check WooCommerce logs
docker-compose logs backend | grep -i woocommerce

# Test WooCommerce connection
docker-compose exec backend python manage.py shell -c "
from woocommerce.models import WooCommerceConfig
config = WooCommerceConfig.objects.first()
print(f'Config: {config.store_url if config else None}')
"
```

**Solutions**:
```bash
# Test WooCommerce connection
docker-compose exec backend python manage.py sync_woocommerce_direct --config-id 1 --job-type daily_sync --days-back 1

# Check WooCommerce credentials
docker-compose exec backend python manage.py shell -c "
from woocommerce.models import WooCommerceConfig
config = WooCommerceConfig.objects.first()
if config:
    print(f'Store URL: {config.store_url}')
    print(f'Consumer Key: {config.consumer_key[:10]}...')
    print(f'Consumer Secret: {config.consumer_secret[:10]}...')
"
```

#### Data Import Issues
**Symptoms**: Orders not importing, missing data

**Diagnosis**:
```bash
# Check order count
docker-compose exec backend python manage.py shell -c "
from woocommerce.models import WooCommerceOrder
print(f'Orders in DB: {WooCommerceOrder.objects.count()}')
"

# Check latest sync
docker-compose exec backend python manage.py shell -c "
from woocommerce.models import WooCommerceOrder
latest = WooCommerceOrder.objects.order_by('-created_at').first()
print(f'Latest order: {latest.order_id if latest else None}')
"
```

**Solutions**:
```bash
# Force sync
docker-compose exec backend python manage.py sync_woocommerce_direct --config-id 1 --job-type daily_sync --days-back 30

# Check sync status
docker-compose exec backend python manage.py shell -c "
from woocommerce.models import WooCommerceOrder
orders = WooCommerceOrder.objects.all()
for order in orders[:5]:
    print(f'Order {order.order_id}: {order.total} {order.currency}')
"
```

## 🔧 Diagnostic Commands

### System Health Check
```bash
# Run comprehensive diagnostics
./diagnose-app-status.sh

# Check individual services
docker-compose ps
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend
```

### Database Diagnostics
```bash
# Check database connection
docker-compose exec backend python manage.py shell -c "
from django.db import connection
connection.ensure_connection()
print('Database connection OK')
"

# Check database size
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "
SELECT pg_size_pretty(pg_database_size('vvv_database'));
"

# Check table sizes
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

### Performance Diagnostics
```bash
# Check system resources
htop
iostat -x 1
df -h

# Check Docker resource usage
docker stats

# Check network connectivity
curl -I https://veveve.dk/
curl -I https://veveve.dk/api/
```

## 📊 Monitoring and Alerts

### Health Check Endpoints
```bash
# API health
curl -I https://veveve.dk/api/

# Frontend health
curl -I https://veveve.dk/

# Database health
curl -I https://veveve.dk/api/health/
```

### Log Monitoring
```bash
# Real-time logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Error logs only
docker-compose logs backend | grep -i error
docker-compose logs frontend | grep -i error

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 🆘 Escalation Procedures

### Level 1: Basic Troubleshooting
1. Check service status: `docker-compose ps`
2. Review logs: `docker-compose logs --tail=50`
3. Run quick fix: `./quick-server-fix.sh`

### Level 2: Advanced Troubleshooting
1. Run diagnostics: `./diagnose-app-status.sh`
2. Check system resources: `htop`, `df -h`
3. Run comprehensive fix: `./comprehensive-fix.sh`

### Level 3: Emergency Procedures
1. Contact development team
2. Check server status with hosting provider
3. Consider rollback to previous version
4. Implement emergency maintenance mode

## 📝 Troubleshooting Checklist

### Before Escalating
- [ ] Checked service status
- [ ] Reviewed relevant logs
- [ ] Tried basic fixes
- [ ] Documented error messages
- [ ] Checked system resources
- [ ] Verified network connectivity

### Information to Provide
- [ ] Error messages (exact text)
- [ ] Steps to reproduce
- [ ] System status output
- [ ] Log excerpts
- [ ] Recent changes made
- [ ] Time when issue started

---

*Last Updated: September 30, 2025*
*For urgent issues, contact the development team immediately.*
