# CI/CD Setup - Staging & Production Deployment

## Overview

This project uses GitHub Actions for automated deployment with:
- **Staging Environment**: Test changes before production
- **Production Environment**: Deploy after staging approval
- **Smoke Tests**: Automated testing before and after deployment

---

## 🔄 Deployment Workflow

```
┌─────────────┐
│   Develop   │
│   Branch    │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Staging   │─────▶│ Smoke Tests  │─────▶│  Approve?  │
│   Branch    │      │   (Auto)     │      │             │
└──────┬──────┘      └──────────────┘      └──────┬──────┘
       │                                           │
       │                                           │ Yes
       │                                           ▼
       │                                    ┌─────────────┐
       │                                    │   Main     │
       │                                    │   Branch   │
       │                                    └──────┬──────┘
       │                                           │
       └───────────────────────────────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Production  │
                   │  Deploy     │
                   └─────────────┘
```

---

## 📋 GitHub Actions Workflows

### 1. Staging Deployment (`.github/workflows/staging.yml`)

**Triggers**:
- Push to `staging` or `develop` branch
- Pull request to `main`
- Manual workflow dispatch

**Jobs**:
1. **build-and-push**: Builds Docker images tagged `staging-latest`
2. **deploy-staging**: Deploys to `/var/www/vvv-frontpage-staging`
3. **smoke-tests**: Runs comprehensive smoke tests

**Environment**: `staging` (no protection, auto-deploy)

---

### 2. Production Deployment (`.github/workflows/deploy.yml`)

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**Jobs**:
1. **build-and-push**: Builds Docker images tagged `latest`
2. **deploy**: Deploys to `/var/www/vvv-frontpage`
3. **health-check**: Runs health checks

**Environment**: `production` (requires approval)

---

### 3. Smoke Tests (`.github/workflows/smoke-tests.yml`)

**Triggers**:
- Manual workflow dispatch

**Purpose**: Run smoke tests on any environment

**Options**:
- Environment: `staging` or `production`
- Base URL: Custom URL (optional)

---

## 🧪 Smoke Tests

### Automated Tests

The smoke tests verify:

1. **Frontend Accessibility**
   - HTTP 200 status
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

### Manual Smoke Tests

**Run locally**:
```bash
# Test production
./scripts/smoke-tests.sh https://veveve.io production

# Test staging
./scripts/smoke-tests.sh https://staging.veveve.io staging
```

---

## 🚀 Quick Start

### 1. Set Up Staging Branch

```bash
# Create staging branch
git checkout -b staging
git push -u origin staging
```

### 2. Configure GitHub Environments

1. Go to: **Repository → Settings → Environments**
2. Create **"staging"** environment (no protection)
3. Create **"production"** environment:
   - Add required reviewers (at least 1)
   - Set deployment branch: `main` only

### 3. First Staging Deployment

```bash
# Make changes
git checkout staging
# ... make changes ...
git commit -m "feat: test staging deployment"
git push origin staging
```

**GitHub Actions will**:
- Build Docker images
- Deploy to staging
- Run smoke tests

### 4. Deploy to Production

**After staging tests pass**:
```bash
git checkout main
git merge staging
git push origin main
```

**GitHub Actions will**:
- Build production images
- Request approval (if configured)
- Deploy to production
- Run health checks

---

## 🔒 Environment Protection

### Recommended Settings

**Staging Environment**:
- ✅ No protection rules
- ✅ Auto-deploy on push
- ✅ Allow testing without approval

**Production Environment**:
- ✅ Required reviewers: 1+
- ✅ Wait timer: 0 minutes
- ✅ Deployment branches: `main` only
- ✅ Prevent self-review (optional)

**To configure**:
1. Repository → Settings → Environments
2. Click "New environment" or edit existing
3. Add protection rules
4. Save

---

## 📊 Monitoring Deployments

### GitHub Actions Dashboard

**View workflows**:
- Go to: **Actions** tab
- See all workflow runs
- Click on a run to see details

### Deployment Status

**Check deployment**:
- Workflow shows ✅ or ❌
- Smoke tests show detailed results
- Health checks verify services

### Server Logs

**On server**:
```bash
# Check staging
cd /var/www/vvv-frontpage-staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml logs

# Check production
cd /var/www/vvv-frontpage
docker-compose logs
```

---

## 🚨 Rollback Process

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

**Or use GitHub Actions**:
- Go to Actions → Previous successful workflow
- Click "Re-run jobs" → Select "deploy" job

---

## ✅ Best Practices

1. **Always test in staging first**
   - Never push directly to `main`
   - Use `staging` branch for all testing

2. **Run smoke tests before merging**
   - Automated tests run on staging
   - Manual tests if needed
   - Verify all critical functionality

3. **Get approval before production**
   - Review staging deployment
   - Check smoke test results
   - Get team approval

4. **Monitor after deployment**
   - Watch GitHub Actions
   - Check application logs
   - Monitor error rates

5. **Keep staging in sync**
   - Regularly merge `main` → `staging`
   - Test production changes in staging first

---

## 📝 Checklist

### Initial Setup
- [ ] Create `staging` branch
- [ ] Push `staging` branch to GitHub
- [ ] Configure GitHub Environments
- [ ] Set up staging directory on server
- [ ] Create staging environment files
- [ ] Test staging deployment

### Before Each Production Deployment
- [ ] Test changes in staging
- [ ] Verify smoke tests pass
- [ ] Review staging environment
- [ ] Get approval (if required)
- [ ] Merge to `main`
- [ ] Monitor production deployment

---

## 🔍 Troubleshooting

### Staging Not Deploying

**Check**:
- Staging branch exists
- GitHub Actions workflow enabled
- SSH secrets configured
- Server has staging directory

### Smoke Tests Failing

**Check**:
- Services are running
- Ports not conflicting
- Environment files correct
- DNS/subdomain configured

### Production Deployment Blocked

**Check**:
- Required reviewers approved
- Branch is `main`
- Previous workflow completed

---

**Next Steps**: Create `staging` branch and configure GitHub Environments!
