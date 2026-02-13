# Pre-Deployment Checklist

**Use this checklist before every production deployment**

---

## 📋 Pre-Deployment Checks

### Code Quality ✅
- [ ] All TypeScript errors resolved
- [ ] Linting passes (warnings acceptable)
- [ ] No console errors in browser
- [ ] All new components tested
- [ ] No breaking changes

### Database ✅
- [ ] Database backup created automatically by script
- [ ] Migration files reviewed: `db/migrations/004_performance_indexes.sql`
- [ ] Database connection pool configured properly
- [ ] No pending migrations

### Environment ✅
- [ ] All required environment variables set
- [ ] `.env` files updated if needed
- [ ] API URLs correct
- [ ] Database credentials valid

### New Features/Changes ✅
- [ ] Landing page improvements tested
- [ ] Toast notifications working
- [ ] Mobile responsiveness verified
- [ ] All pages load without errors
- [ ] Authentication flows tested

### Performance ✅
- [ ] Database indexes ready to apply (`004_performance_indexes.sql`)
- [ ] API response caching configured
- [ ] Next.js build successful
- [ ] Docker images build successfully

### Security ✅
- [ ] No sensitive data in code
- [ ] Environment variables secure
- [ ] SSL certificates valid
- [ ] Nginx configuration valid

---

## 🚀 Deployment Steps

### 1. Run Pre-Deployment Checks
```bash
bash scripts/pre-deployment-checks.sh
```

### 2. Review Changes
```bash
git log --oneline -10
git diff HEAD~1
```

### 3. Run Deployment Script
```bash
bash scripts/deploy-production.sh
```

### 4. Verify Deployment
```bash
# Check health
bash scripts/deploy-production.sh --health-check

# Verify deployment
bash scripts/deploy-production.sh --verify
```

---

## ✅ Post-Deployment Verification

### Immediate Checks
- [ ] Frontend loads at https://veveve.dk
- [ ] Landing page displays correctly
- [ ] Navigation works
- [ ] Authentication works (login/register)
- [ ] No console errors

### Functional Checks
- [ ] Dashboard loads
- [ ] API endpoints responding
- [ ] Database queries working
- [ ] Toast notifications working
- [ ] Forms submit correctly

### Performance Checks
- [ ] Page load times acceptable
- [ ] Database queries optimized (check logs)
- [ ] No memory leaks
- [ ] Services stable

---

## 🆘 Rollback Plan

If deployment fails:

1. **Automatic Rollback**: Script should automatically rollback
   ```bash
   # Manual rollback if needed
   bash scripts/deploy-production.sh --rollback
   ```

2. **Check Logs**:
   ```bash
   docker-compose logs --tail=100
   ```

3. **Restore Database** (if needed):
   ```bash
   # Restore from backup in /opt/vvv-backups/
   ```

---

## 📝 Critical Items for This Deployment

### Database Migration
**MUST APPLY**: `db/migrations/004_performance_indexes.sql`
- This adds critical performance indexes
- Estimated 40-60% query performance improvement
- Safe to apply (CREATE INDEX IF NOT EXISTS)

**Apply manually if script fails**:
```bash
docker-compose exec postgres psql -U vvv_user -d vvv_database -f /opt/vvv-frontpage/db/migrations/004_performance_indexes.sql
```

### New Features
- Landing page completely redesigned
- Toast notifications added
- Mobile navigation improved
- API response helpers created

### Breaking Changes
- ✅ None - all changes are backward compatible

---

## 🔍 Quick Verification Commands

```bash
# Check all services running
docker-compose ps

# Check frontend
curl -I https://veveve.dk

# Check backend API
curl -I https://veveve.dk/api/health

# Check database
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT COUNT(*) FROM users_user;"

# View logs
docker-compose logs -f frontend
docker-compose logs -f backend
```

---

## 📊 Deployment Monitoring

After deployment, monitor:
1. Application logs: `docker-compose logs -f`
2. Error rates: Check for 500 errors
3. Response times: Should be improved with indexes
4. User feedback: Watch for issues

---

**Last Updated**: December 2024  
**For**: VVV Frontpage Production Deployment







