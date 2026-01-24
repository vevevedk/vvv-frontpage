# Staging Environment - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Staging Branch

```bash
git checkout -b staging
git push -u origin staging
```

### Step 2: Configure GitHub Environments

1. Go to: **Repository → Settings → Environments**
2. Click **"New environment"**
3. Name: `production`
   - ✅ Add required reviewers (at least 1)
   - ✅ Deployment branches: `main` only
4. Click **"New environment"** again
5. Name: `staging`
   - ✅ No protection rules (auto-deploy)

### Step 3: Test Staging Deployment

```bash
# Make a test change
git checkout staging
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: staging deployment"
git push origin staging
```

**GitHub Actions will automatically**:
- Build staging Docker images
- Deploy to staging environment
- Run smoke tests

### Step 4: Verify Staging

1. Go to: **Actions** tab
2. Find "Deploy to Staging" workflow
3. Check it completes successfully
4. Review smoke test results

---

## ✅ What's Ready

- ✅ Staging workflow (`.github/workflows/staging.yml`)
- ✅ Production workflow (`.github/workflows/deploy.yml`) - requires approval
- ✅ Smoke tests workflow (`.github/workflows/smoke-tests.yml`)
- ✅ Smoke tests script (`scripts/smoke-tests.sh`)

---

## 📋 Workflow

```
staging branch → Auto-deploy → Smoke tests → Review → Merge to main → Approval → Production
```

---

**Next**: Create `staging` branch and configure GitHub Environments!
