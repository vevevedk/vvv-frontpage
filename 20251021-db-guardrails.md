# Database Guardrails Implementation Guide
**Date:** October 21, 2025  
**Context:** Data loss incident due to database reinitialization during password fix

## What Happened

### Root Cause
- **Password Mismatch**: `docker-compose.yml` had password `Yo6g/LhuoAvQHd24QwhhmiQ5q7TGPc1HfA7Y7RB3gUE=` but `env/backend.env` had `vvv_password`
- **Database Reinitialization**: PostgreSQL couldn't authenticate with wrong password, created fresh database instance
- **Data Loss**: All user accounts, WooCommerce settings, and application data was wiped
- **No Backup**: No recent database backups available for recovery

### Impact
- Complete loss of application data
- Users unable to log in
- WooCommerce configurations lost
- Business data wiped

## Guardrails Implementation

### 1. Automated Daily Backups

Create backup script at `/opt/vvv-frontpage/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/vvv-frontpage/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/vvv_database_$DATE.sql"

# Create database backup
docker-compose exec -T postgres pg_dump -U vvv_user vvv_database > "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "vvv_database_*.sql.gz" -mtime +7 -delete

echo "Backup created: $BACKUP_FILE.gz"
```

### 2. Environment Validation Script

Create validation script at `/opt/vvv-frontpage/scripts/validate_env.sh`:

```bash
#!/bin/bash
echo "Validating environment configuration..."

# Check if passwords match
COMPOSE_PASS=$(grep POSTGRES_PASSWORD docker-compose.yml | cut -d: -f2 | tr -d ' ')
ENV_PASS=$(grep DB_PASSWORD env/backend.env | cut -d= -f2)

if [ "$COMPOSE_PASS" != "$ENV_PASS" ]; then
    echo "ERROR: Database passwords don't match!"
    echo "docker-compose.yml: $COMPOSE_PASS"
    echo "env/backend.env: $ENV_PASS"
    exit 1
fi

echo "Environment validation passed!"
```

### 3. Safe Container Restart Script

Create safe restart script at `/opt/vvv-frontpage/scripts/safe_restart.sh`:

```bash
#!/bin/bash
set -e

echo "Starting safe restart process..."

# 1. Validate environment
./scripts/validate_env.sh

# 2. Create backup before any changes
./scripts/backup.sh

# 3. Test database connection
docker-compose exec postgres pg_isready -U vvv_user -d vvv_database

# 4. Only then restart containers
docker-compose restart backend

echo "Safe restart completed!"
```

### 4. Pre-deployment Validation

Create pre-deployment checks at `/opt/vvv-frontpage/scripts/pre_deploy.sh`:

```bash
#!/bin/bash
echo "Running pre-deployment checks..."

# Check if database has data
USER_COUNT=$(docker-compose exec -T postgres psql -U vvv_user -d vvv_database -t -c "SELECT COUNT(*) FROM users_user;" 2>/dev/null || echo "0")

if [ "$USER_COUNT" -eq "0" ]; then
    echo "WARNING: Database appears to be empty!"
    echo "This might indicate data loss. Aborting deployment."
    exit 1
fi

echo "Pre-deployment checks passed!"
```

### 5. Health Monitoring Script

Create health check at `/opt/vvv-frontpage/scripts/health_check.sh`:

```bash
#!/bin/bash
# Check if database is accessible and has data
USER_COUNT=$(docker-compose exec -T postgres psql -U vvv_user -d vvv_database -t -c "SELECT COUNT(*) FROM users_user;" 2>/dev/null || echo "0")

if [ "$USER_COUNT" -eq "0" ]; then
    echo "ALERT: Database appears to be empty!"
    # Send alert (email, Slack, etc.)
fi

echo "Health check completed. Users: $USER_COUNT"
```

### 6. Cron Job Setup

Add daily backup to crontab:

```bash
# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/vvv-frontpage/scripts/backup.sh >> /opt/vvv-frontpage/logs/backup.log 2>&1") | crontab -
```

### 7. Docker Compose Volume Protection

Update `docker-compose.yml` to include backup mounting:

```yaml
services:
  postgres:
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups  # Mount backup directory
```

## Implementation Steps

1. **Create scripts directory:**
   ```bash
   mkdir -p /opt/vvv-frontpage/scripts
   mkdir -p /opt/vvv-frontpage/backups
   ```

2. **Make scripts executable:**
   ```bash
   chmod +x /opt/vvv-frontpage/scripts/*.sh
   ```

3. **Test backup script:**
   ```bash
   /opt/vvv-frontpage/scripts/backup.sh
   ```

4. **Set up cron job:**
   ```bash
   (crontab -l 2>/dev/null; echo "0 2 * * * /opt/vvv-frontpage/scripts/backup.sh >> /opt/vvv-frontpage/logs/backup.log 2>&1") | crontab -
   ```

5. **Test validation script:**
   ```bash
   /opt/vvv-frontpage/scripts/validate_env.sh
   ```

## Best Practices Going Forward

### Before Any Changes:
1. **Always run validation:** `./scripts/validate_env.sh`
2. **Create backup:** `./scripts/backup.sh`
3. **Use safe restart:** `./scripts/safe_restart.sh`

### Regular Maintenance:
1. **Daily backups** (automated via cron)
2. **Weekly backup verification**
3. **Monthly disaster recovery testing**

### Emergency Procedures:
1. **If data loss detected:** Stop all changes immediately
2. **Restore from latest backup:** `gunzip -c backup_file.sql.gz | docker-compose exec -T postgres psql -U vvv_user vvv_database`
3. **Investigate root cause** before proceeding

## Recovery Commands

### Restore from backup:
```bash
gunzip -c /opt/vvv-frontpage/backups/vvv_database_YYYYMMDD_HHMMSS.sql.gz | docker-compose exec -T postgres psql -U vvv_user vvv_database
```

### Check database health:
```bash
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT COUNT(*) FROM users_user;"
```

### Validate environment:
```bash
./scripts/validate_env.sh
```

## Lessons Learned

1. **Environment synchronization is critical** - passwords must match across all config files
2. **Backups are essential** - automated daily backups prevent data loss
3. **Validation before changes** - always verify configuration before making changes
4. **Monitoring is key** - detect data loss early with health checks
5. **Safe procedures** - use scripts that validate and backup before changes

---

**Note:** This document should be updated whenever new guardrails are added or procedures change.


















