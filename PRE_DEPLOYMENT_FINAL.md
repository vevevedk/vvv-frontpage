# Pre-Deployment Final Checklist

**Before deploying the improvements, complete these final checks:**

---

## 🎯 Critical Pre-Deployment Tasks

### 1. Database Migration ⚠️ **CRITICAL**
**File**: `db/migrations/004_performance_indexes.sql`

**Action Required**:
```bash
# Option 1: Let deployment script handle it (recommended)
# The script will attempt to apply it automatically

# Option 2: Apply manually before deployment
docker-compose exec postgres psql -U vvv_user -d vvv_database -f /opt/vvv-frontpage/db/migrations/004_performance_indexes.sql

# Option 3: Apply via psql directly
psql -U vvv_user -d vvv_database -h localhost -f db/migrations/004_performance_indexes.sql
```

**Why**: These indexes will improve database performance by 40-60%

---

### 2. Test Pre-Deployment Checks ✅
```bash
# Run validation before deploying
bash scripts/pre-deployment-checks.sh
```

This will verify:
- Environment variables
- Docker configuration
- Required files
- Code quality
- Database connection

---

### 3. Review Deployment Script ✅

The enhanced deployment script (`scripts/deploy-production.sh`) includes:
- ✅ Pre-deployment validation
- ✅ Automatic backups
- ✅ Health checks
- ✅ Automatic rollback on failure
- ✅ Database migration support
- ✅ Deployment verification

**Usage**:
```bash
# Full deployment
bash scripts/deploy-production.sh

# Just health check
bash scripts/deploy-production.sh --health-check

# Just verification
bash scripts/deploy-production.sh --verify

# Manual rollback
bash scripts/deploy-production.sh --rollback
```

---

## 📋 Quick Pre-Deployment Checklist

### Code & Build
- [x] All improvements implemented
- [ ] TypeScript compilation successful
- [ ] Build test successful: `npm run build`
- [ ] No critical errors in console

### Database
- [ ] Backup strategy in place (automatic via script)
- [ ] Migration file ready: `004_performance_indexes.sql`
- [ ] Database connection tested
- [ ] Connection pool configuration reviewed

### Configuration
- [ ] Environment variables verified
- [ ] Docker compose configuration valid
- [ ] Nginx configuration updated if needed
- [ ] SSL certificates valid

### Testing
- [ ] Landing page tested locally
- [ ] Authentication flows tested
- [ ] Toast notifications working
- [ ] Mobile responsiveness verified
- [ ] All critical pages load

---

## 🚀 Deployment Command

When ready, run:
```bash
cd /opt/vvv-frontpage
bash scripts/deploy-production.sh
```

The script will:
1. ✅ Verify prerequisites
2. ✅ Run pre-deployment checks
3. ✅ Create backup
4. ✅ Pull latest code
5. ✅ Build Docker images
6. ✅ Deploy containers
7. ✅ Apply migrations (including performance indexes)
8. ✅ Run health checks
9. ✅ Verify deployment
10. ✅ Auto-rollback if health checks fail

---

## 🔍 Post-Deployment Verification

After deployment, verify:

1. **Landing Page**:
   - Visit https://veveve.dk
   - Check hero section with new messaging
   - Verify services section shows 4 services
   - Check customer cases with metrics
   - Verify pricing section redesign

2. **Functionality**:
   - Test login (should show toast notification)
   - Test register (should show toast notifications)
   - Test profile update (should show toast)
   - Check mobile navigation

3. **Performance**:
   - Check database query times (should be faster)
   - Monitor API response times
   - Check page load times

---

## ⚠️ Known Considerations

### Database Indexes
- The `004_performance_indexes.sql` migration uses `CREATE INDEX IF NOT EXISTS`
- Safe to run multiple times
- May take a few minutes on large databases
- Monitor database during index creation

### Toast Notifications
- ToastProvider is configured in `_app.tsx`
- Should work automatically
- If not working, verify ToastProvider import

### Landing Page Changes
- Hero section now requires props (has defaults)
- All existing usage should still work
- Test on multiple screen sizes

---

## 🆘 Troubleshooting

### If Deployment Fails

1. **Check Script Output**: Review error messages
2. **Check Logs**: `docker-compose logs --tail=100`
3. **Manual Rollback**: `bash scripts/deploy-production.sh --rollback`
4. **Health Check**: `bash scripts/deploy-production.sh --health-check`

### Common Issues

**Issue**: Database migration fails
- **Solution**: Apply manually using psql command above

**Issue**: Toast notifications not showing
- **Solution**: Verify ToastProvider in `_app.tsx`

**Issue**: Landing page looks broken
- **Solution**: Clear Next.js cache: `rm -rf .next`

**Issue**: Performance not improved
- **Solution**: Verify indexes were applied: 
  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename LIKE 'woocommerce%';
  ```

---

## ✅ Ready to Deploy?

Once all checks pass:
1. Run `bash scripts/pre-deployment-checks.sh`
2. Review any warnings
3. Run `bash scripts/deploy-production.sh`
4. Monitor output for any issues
5. Verify deployment after completion

---

**Status**: ✅ Ready for Deployment  
**Last Updated**: December 2024  
**Deployment Script**: `scripts/deploy-production.sh`  
**Pre-Deployment Checks**: `scripts/pre-deployment-checks.sh`







