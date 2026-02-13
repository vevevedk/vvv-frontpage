# GitHub Actions CI/CD Setup Summary

## ✅ What's Been Set Up

### 1. Staging Environment Workflow
**File**: `.github/workflows/staging.yml`

**Features**:
- ✅ Automatic deployment on push to `staging` branch
- ✅ Builds Docker images tagged `staging-latest`
- ✅ Deploys to separate staging directory (`/var/www/vvv-frontpage-staging`)
- ✅ Uses different ports (3001, 8002) to avoid conflicts
- ✅ Runs comprehensive smoke tests automatically
- ✅ Can be triggered manually via workflow_dispatch

**Triggers**:
- Push to `staging` or `develop` branch
- Pull request to `main`
- Manual workflow dispatch

---

### 2. Production Deployment Workflow
**File**: `.github/workflows/deploy.yml` (updated)

**Features**:
- ✅ Automatic deployment on push to `main` branch
- ✅ Requires environment approval (production environment)
- ✅ Builds Docker images tagged `latest`
- ✅ Deploys to production directory (`/var/www/vvv-frontpage`)
- ✅ Runs health checks after deployment
- ✅ Tests both veveve.io and veveve.dk

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**Protection**: Requires approval via GitHub Environments

---

### 3. Smoke Tests Workflow
**File**: `.github/workflows/smoke-tests.yml`

**Features**:
- ✅ Manual workflow dispatch
- ✅ Can test staging or production
- ✅ Comprehensive test suite:
  - Frontend accessibility
  - Domain routing (veveve.io, veveve.dk)
  - Login redirects
  - API endpoints
  - SSL certificates
  - HTTPS redirects
  - Performance checks

**Usage**: Run manually from GitHub Actions tab

---

### 4. Smoke Tests Script
**File**: `scripts/smoke-tests.sh`

**Features**:
- ✅ Can be run locally or on server
- ✅ Tests all critical functionality
- ✅ Provides detailed output
- ✅ Exit code indicates pass/fail

**Usage**:
```bash
./scripts/smoke-tests.sh https://veveve.io production
```

---

## 🔄 Deployment Workflow

### Development Process

```
1. Create feature branch
   git checkout -b feature/my-feature

2. Make changes and commit
   git add .
   git commit -m "feat: add feature"

3. Push to staging
   git checkout staging
   git merge feature/my-feature
   git push origin staging
   
   → GitHub Actions automatically:
     - Builds staging images
     - Deploys to staging
     - Runs smoke tests

4. Review staging
   - Check GitHub Actions results
   - Test staging environment
   - Verify smoke tests pass

5. Merge to production
   git checkout main
   git merge staging
   git push origin main
   
   → GitHub Actions:
     - Requests approval (if configured)
     - Builds production images
     - Deploys to production
     - Runs health checks
```

---

## 🔒 Environment Protection Setup

### Required GitHub Configuration

1. **Go to Repository Settings**:
   - Repository → Settings → Environments

2. **Create/Edit "production" Environment**:
   - **Required reviewers**: Add at least 1 reviewer
   - **Deployment branches**: Restrict to `main` branch only
   - **Wait timer**: 0 minutes (or set delay if needed)
   - **Prevent self-review**: Optional (recommended)

3. **Create/Edit "staging" Environment**:
   - **No protection rules** (auto-deploy)
   - Allows testing without approval

---

## 📋 Quick Start Checklist

### Initial Setup
- [ ] Create `staging` branch: `git checkout -b staging && git push -u origin staging`
- [ ] Configure GitHub Environments (Settings → Environments)
- [ ] Set up staging directory on server (if not using same server)
- [ ] Test staging deployment by pushing to `staging` branch

### Before Each Production Deployment
- [ ] Push changes to `staging` branch
- [ ] Verify staging deployment succeeds
- [ ] Review smoke test results
- [ ] Test staging environment manually (if needed)
- [ ] Get approval (if required)
- [ ] Merge `staging` → `main`
- [ ] Approve production deployment (if required)
- [ ] Monitor production deployment

---

## 🧪 Smoke Tests Included

### Automated Tests

1. **Frontend Accessibility**
   - HTTP 200 status check
   - Page loads correctly

2. **Domain Routing**
   - veveve.io shows English PPC content
   - veveve.dk shows Danish content

3. **Login Redirects**
   - veveve.dk/login → veveve.io/login

4. **API Endpoints**
   - `/api/test/` responds
   - Health endpoints work

5. **SSL Certificates**
   - Valid certificates
   - No expiration warnings

6. **HTTPS Redirects**
   - HTTP → HTTPS redirects work

7. **Performance**
   - Response times < 3 seconds

---

## 📊 Monitoring

### GitHub Actions Dashboard
- **View workflows**: Repository → Actions tab
- **See deployment status**: Click on workflow run
- **Check smoke test results**: View "smoke-tests" job output

### Server Monitoring
```bash
# Check staging
cd /var/www/vvv-frontpage-staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml ps
docker-compose -f docker-compose.yml -f docker-compose.staging.yml logs

# Check production
cd /var/www/vvv-frontpage
docker-compose ps
docker-compose logs
```

---

## 🚨 Rollback

### Staging Rollback
```bash
cd /var/www/vvv-frontpage-staging
git checkout <previous-commit>
docker-compose -f docker-compose.yml -f docker-compose.staging.yml pull
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### Production Rollback
```bash
cd /var/www/vvv-frontpage
git checkout <previous-commit>
docker-compose pull
docker-compose up -d
```

**Or via GitHub Actions**:
- Go to previous successful workflow
- Click "Re-run jobs"

---

## 📝 Next Steps

1. **Create staging branch**:
   ```bash
   git checkout -b staging
   git push -u origin staging
   ```

2. **Configure GitHub Environments**:
   - Go to: Repository → Settings → Environments
   - Set up "production" environment with required reviewers
   - Set up "staging" environment (no protection)

3. **Test staging deployment**:
   - Push a test change to `staging` branch
   - Verify GitHub Actions workflow runs
   - Check staging deployment succeeds

4. **Test smoke tests**:
   - Run smoke tests workflow manually
   - Or run locally: `./scripts/smoke-tests.sh https://veveve.io production`

---

## 📚 Documentation

- **STAGING_ENVIRONMENT_SETUP.md** - Detailed staging setup guide
- **CI_CD_SETUP.md** - Complete CI/CD workflow documentation
- **scripts/smoke-tests.sh** - Manual smoke testing script

---

**Status**: ✅ All workflows created and ready to use!

**Next Action**: Create `staging` branch and configure GitHub Environments.
