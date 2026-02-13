# Setup Staging Branch - Correct Steps

## ⚠️ Important

**The staging branch should be created locally (on your machine), not on the server.**

The server will automatically pull the staging branch when GitHub Actions deploys.

---

## 🎯 Correct Steps

### Step 1: On Your Local Machine

**Commit your changes first** (you have uncommitted changes):

```bash
# On your local machine (not server)
cd /Users/iversen/Work/veveve/vvv-frontpage

# Add all the new files and changes
git add .

# Commit
git commit -m "feat: add staging environment, CI/CD workflows, veveve.io rebranding, and domain routing fixes"

# Create staging branch
git checkout -b staging

# Push staging branch to GitHub
git push -u origin staging
```

**Or use the setup script**:
```bash
./scripts/setup-staging-branch.sh
```

---

### Step 2: Configure GitHub Environments

**In GitHub UI** (not on server):

1. Go to: https://github.com/vevevedk/vvv-frontpage/settings/environments
2. Click **"New environment"**
3. Name: `production`
   - ✅ Required reviewers: Add at least 1
   - ✅ Deployment branches: `main` only
4. Click **"New environment"** again
5. Name: `staging`
   - ❌ No protection rules

---

### Step 3: Test Staging Deployment

**After pushing staging branch**:

1. Go to: **GitHub → Actions** tab
2. You should see "Deploy to Staging" workflow running
3. It will automatically:
   - Build staging Docker images
   - Deploy to staging (if staging directory is set up)
   - Run smoke tests

---

## 📝 What Happens on Server

**The server doesn't need the script**. When you push to `staging` branch:

1. GitHub Actions workflow triggers
2. Workflow SSHes to server
3. Workflow creates/updates `/var/www/vvv-frontpage-staging` directory
4. Workflow pulls staging branch
5. Workflow deploys using staging Docker images

**You don't need to run anything on the server manually.**

---

## ✅ Quick Checklist

**On your local machine**:
- [ ] Commit your changes
- [ ] Create staging branch: `git checkout -b staging`
- [ ] Push staging branch: `git push -u origin staging`

**In GitHub UI**:
- [ ] Go to: Settings → Environments
- [ ] Create "production" environment with required reviewers
- [ ] Create "staging" environment (no protection)

**Verify**:
- [ ] Check GitHub Actions tab
- [ ] See "Deploy to Staging" workflow running

---

**The server will be updated automatically by GitHub Actions when you push to staging branch!**
