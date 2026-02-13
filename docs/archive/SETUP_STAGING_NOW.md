# Setup Staging Branch & GitHub Environments - Action Items

## ⚠️ Important: Do This on Your Local Machine, Not Server

**The staging branch must be created locally and pushed to GitHub.**
**The server will be updated automatically by GitHub Actions.**

---

## 🎯 What You Need to Do

### Part 1: Create Staging Branch (On Your Local Machine)

**Option A: Use the script** (recommended):
```bash
# On your local machine (not server)
cd /Users/iversen/Work/veveve/vvv-frontpage
./scripts/setup-staging-branch.sh
```

**Option B: Manual commands**:
```bash
# On your local machine (not server)
cd /Users/iversen/Work/veveve/vvv-frontpage

# Commit your current changes first
git add .
git commit -m "feat: add staging environment, CI/CD workflows, veveve.io rebranding"

# Create and push staging branch
git checkout -b staging
git push -u origin staging
```

**Note**: You have uncommitted changes. The script will help you handle them.

---

### Part 2: Configure GitHub Environments

**This must be done in GitHub UI** (I can't do this for you):

1. **Go to GitHub**:
   - Navigate to your repository
   - Click **Settings** (top menu)
   - Click **Environments** (left sidebar)

2. **Create Production Environment**:
   - Click **"New environment"**
   - Name: `production`
   - Click **"Configure environment"**
   - ✅ **Required reviewers**: Add at least 1 person
   - ✅ **Deployment branches**: Select "Selected branches" → Add `main`
   - Click **"Save protection rules"**

3. **Create Staging Environment**:
   - Click **"New environment"**
   - Name: `staging`
   - Click **"Configure environment"**
   - ❌ **No protection rules** (leave everything unchecked)
   - Click **"Save protection rules"**

---

## ✅ Verification

### Test Staging Deployment

After creating staging branch and pushing:

1. **Check GitHub Actions**:
   - Go to: **Actions** tab
   - You should see "Deploy to Staging" workflow running
   - Should complete automatically (no approval needed)

2. **Check workflow**:
   - Should build staging Docker images
   - Should deploy to staging
   - Should run smoke tests

### Test Production Approval

After configuring environments:

1. **Push to main** (or merge staging → main):
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

2. **Check GitHub Actions**:
   - Go to: **Actions** tab
   - Find "Deploy to Production" workflow
   - Should show **"Waiting for approval"** or **"Review deployments"** button

3. **Approve deployment**:
   - Click **"Review deployments"**
   - Click **"Approve and deploy"**
   - Deployment will proceed

---

## 📋 Quick Checklist

- [ ] Run `./scripts/setup-staging-branch.sh` OR manually create staging branch
- [ ] Push staging branch to GitHub
- [ ] Go to: Repository → Settings → Environments
- [ ] Create "production" environment with required reviewers
- [ ] Create "staging" environment (no protection)
- [ ] Test staging deployment (push to staging)
- [ ] Test production approval (push to main)

---

## 🚀 After Setup

Once everything is configured:

1. **Development workflow**:
   ```bash
   # Work on feature
   git checkout -b feature/my-feature
   # ... make changes ...
   git commit -m "feat: new feature"
   
   # Test in staging
   git checkout staging
   git merge feature/my-feature
   git push origin staging
   # → Auto-deploys to staging, runs smoke tests
   
   # Deploy to production
   git checkout main
   git merge staging
   git push origin main
   # → Requires approval, then deploys to production
   ```

2. **Monitor deployments**:
   - Check **Actions** tab for workflow status
   - Review smoke test results
   - Approve production deployments when ready

---

**Ready to start?** Run the setup script or follow the manual steps above!
