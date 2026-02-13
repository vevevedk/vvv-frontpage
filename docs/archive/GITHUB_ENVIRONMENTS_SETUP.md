# GitHub Environments Setup Guide

## Overview

GitHub Environments allow you to:
- Require approval before production deployments
- Set deployment branch restrictions
- Configure environment-specific secrets
- Track deployment history

---

## 🎯 Step-by-Step Setup

### Step 1: Navigate to Environments

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. Scroll down to **Environments** (left sidebar)
4. Click **Environments**

---

### Step 2: Create Production Environment

1. Click **"New environment"** button
2. **Environment name**: `production`
3. Click **"Configure environment"**

#### Configure Protection Rules:

**Required reviewers**:
- ✅ Check **"Required reviewers"**
- Click **"Add reviewer"**
- Add at least 1 team member or yourself
- This ensures someone approves before production deployment

**Deployment branches**:
- ✅ Check **"Deployment branches"**
- Select **"Selected branches"**
- Click **"Add branch"**
- Enter: `main`
- This restricts production deployments to `main` branch only

**Wait timer** (optional):
- Leave at `0` minutes (or set delay if needed)

**Prevent self-review** (optional):
- ✅ Check if you want to prevent self-approval

4. Click **"Save protection rules"**

---

### Step 3: Create Staging Environment

1. Click **"New environment"** button
2. **Environment name**: `staging`
3. Click **"Configure environment"**

#### Configure Protection Rules:

**No protection rules needed** (staging should auto-deploy):
- Leave all options unchecked
- This allows automatic deployment without approval

4. Click **"Save protection rules"**

---

## ✅ Verification

### Check Environments Are Set Up

1. Go to: **Settings → Environments**
2. You should see:
   - **production** - With protection rules (required reviewers, branch restrictions)
   - **staging** - No protection rules

### Test Production Protection

1. Push to `main` branch
2. Go to: **Actions** tab
3. Find "Deploy to Production" workflow
4. You should see: **"Waiting for approval"** or **"Review deployments"** button
5. Click to approve the deployment

### Test Staging Auto-Deploy

1. Push to `staging` branch
2. Go to: **Actions** tab
3. Find "Deploy to Staging" workflow
4. Should deploy automatically (no approval needed)

---

## 📋 Environment Configuration Summary

### Production Environment

**Name**: `production`

**Protection Rules**:
- ✅ Required reviewers: 1+ (your team members)
- ✅ Deployment branches: `main` only
- ⏱️ Wait timer: 0 minutes
- 🚫 Prevent self-review: Optional

**Purpose**: 
- Requires approval before deployment
- Only deploys from `main` branch
- Ensures code is tested in staging first

---

### Staging Environment

**Name**: `staging`

**Protection Rules**:
- ❌ No protection rules
- ✅ Auto-deploy on push

**Purpose**:
- Automatic deployment for testing
- No approval required
- Allows rapid iteration

---

## 🔍 How It Works

### Staging Deployment Flow

```
Push to staging branch
    ↓
GitHub Actions triggers
    ↓
Build staging images
    ↓
Deploy to staging (no approval needed)
    ↓
Run smoke tests
    ↓
✅ Staging ready for review
```

### Production Deployment Flow

```
Merge staging → main
    ↓
GitHub Actions triggers
    ↓
Build production images
    ↓
⏸️  WAIT FOR APPROVAL
    ↓
(Reviewer approves)
    ↓
Deploy to production
    ↓
Run health checks
    ↓
✅ Production deployed
```

---

## 🚨 Troubleshooting

### Issue: Production deployment not waiting for approval

**Cause**: Environment not configured or not referenced in workflow

**Solution**:
1. Check workflow file has `environment: production` in deploy job
2. Verify environment exists in Settings → Environments
3. Check environment has required reviewers configured

### Issue: Can't approve deployment

**Cause**: Not added as reviewer or self-review prevented

**Solution**:
1. Go to: Settings → Environments → production
2. Add yourself as required reviewer
3. Uncheck "Prevent self-review" if needed

### Issue: Staging requires approval

**Cause**: Protection rules accidentally enabled

**Solution**:
1. Go to: Settings → Environments → staging
2. Remove all protection rules
3. Save

---

## 📝 Quick Reference

### Create Environments

**Via GitHub UI**:
1. Repository → Settings → Environments
2. New environment → Name it
3. Configure protection rules
4. Save

**Required for Production**:
- Required reviewers: ✅
- Deployment branches: `main` only ✅

**Required for Staging**:
- No protection rules ✅

---

## ✅ Checklist

- [ ] Production environment created
- [ ] Production has required reviewers (1+)
- [ ] Production restricted to `main` branch
- [ ] Staging environment created
- [ ] Staging has no protection rules
- [ ] Test staging deployment (push to staging branch)
- [ ] Test production approval (push to main, verify approval required)

---

**Next**: Run `./scripts/setup-staging-branch.sh` to create the staging branch!
