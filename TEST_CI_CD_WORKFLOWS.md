# Testing CI/CD Workflows - Verification Guide

## 🧪 Test 1: Staging Deployment

### What to Check

1. **Go to GitHub Actions**:
   - Navigate to: https://github.com/vevevedk/vvv-frontpage/actions
   - Look for workflow named: **"Deploy to Staging"**

2. **Expected Behavior**:
   - Workflow should have triggered automatically when you pushed to `staging` branch
   - Should show status: ✅ (green checkmark) or 🟡 (yellow, in progress)

3. **Workflow Jobs**:
   - **build-and-push**: Builds Docker images tagged `staging-latest`
   - **deploy-staging**: Deploys to staging environment
   - **smoke-tests**: Runs comprehensive smoke tests

4. **If Workflow Didn't Trigger**:
   - Check if `staging` branch exists: `git branch -r | grep staging`
   - Verify workflow file exists: `.github/workflows/staging.yml`
   - Check workflow syntax is valid

### Manual Trigger (if needed)

If the workflow didn't trigger automatically:

1. Go to: **Actions** tab
2. Click **"Deploy to Staging"** workflow
3. Click **"Run workflow"** button (top right)
4. Select branch: `staging`
5. Click **"Run workflow"**

---

## 🧪 Test 2: Production Approval

### Step 1: Make a Test Change

```bash
# On your local machine
git checkout main
echo "# Test production deployment" >> TEST_PRODUCTION.md
git add TEST_PRODUCTION.md
git commit -m "test: trigger production deployment"
git push origin main
```

### Step 2: Check GitHub Actions

1. **Go to GitHub Actions**:
   - Navigate to: https://github.com/vevevedk/vvv-frontpage/actions
   - Look for workflow named: **"Deploy to Production"**

2. **Expected Behavior**:
   - Workflow should trigger automatically
   - Should show: **"Waiting for approval"** or **"Review deployments"** button
   - Status will be 🟡 (yellow, waiting)

3. **Approve Deployment**:
   - Click on the workflow run
   - Look for **"Review deployments"** button (usually at the top)
   - Click it
   - Review the deployment details
   - Click **"Approve and deploy"**
   - Deployment will proceed

4. **After Approval**:
   - Workflow will continue with deployment
   - Should show: **deploy** job running
   - Then: **health-check** job running
   - Final status: ✅ (green checkmark)

---

## ✅ Verification Checklist

### Staging Workflow
- [ ] Workflow exists: `.github/workflows/staging.yml`
- [ ] Workflow triggered when pushing to `staging` branch
- [ ] Build job completed successfully
- [ ] Deploy job completed successfully
- [ ] Smoke tests completed (may show warnings, that's OK)

### Production Workflow
- [ ] Workflow exists: `.github/workflows/deploy.yml`
- [ ] Workflow triggered when pushing to `main` branch
- [ ] Workflow shows "Waiting for approval"
- [ ] Can approve deployment via "Review deployments" button
- [ ] After approval, deployment proceeds
- [ ] Health checks complete

### Environment Configuration
- [ ] `staging` environment exists (no protection rules)
- [ ] `production` environment exists (with protection rules)
- [ ] Production has required reviewers configured
- [ ] Production restricted to `main` branch

---

## 🔍 Troubleshooting

### Issue: Staging workflow not triggering

**Check**:
1. Is `staging` branch pushed to GitHub?
   ```bash
   git branch -r | grep staging
   ```

2. Does workflow file exist?
   ```bash
   ls -la .github/workflows/staging.yml
   ```

3. Check workflow syntax:
   - Go to: Actions tab
   - Look for any syntax errors

**Fix**:
- Push staging branch: `git push -u origin staging`
- Or manually trigger workflow from Actions tab

---

### Issue: Production workflow not waiting for approval

**Check**:
1. Is `production` environment configured?
   - Go to: Settings → Environments
   - Verify `production` exists
   - Check it has protection rules

2. Does workflow reference environment?
   - Check `.github/workflows/deploy.yml`
   - Should have: `environment: production` in deploy job

**Fix**:
- Configure production environment with required reviewers
- Ensure workflow has `environment: production` in deploy job

---

### Issue: Can't approve deployment

**Check**:
1. Are you added as a required reviewer?
   - Go to: Settings → Environments → production
   - Check "Required reviewers" list

2. Is self-review prevented?
   - If you're the only reviewer and self-review is prevented, you can't approve
   - Add another reviewer or allow self-review

**Fix**:
- Add yourself as required reviewer
- Or uncheck "Prevent self-review" option

---

## 📊 Expected Workflow Status

### Staging Workflow (Auto-Deploy)

```
✅ build-and-push (completed)
✅ deploy-staging (completed)
✅ smoke-tests (completed or warnings OK)
```

### Production Workflow (Requires Approval)

```
✅ build-and-push (completed)
🟡 deploy (waiting for approval)
   → Click "Review deployments" → "Approve and deploy"
✅ deploy (completed after approval)
✅ health-check (completed)
```

---

## 🚀 Next Steps After Testing

Once both workflows are verified:

1. **Development Workflow**:
   ```bash
   # Work on feature
   git checkout -b feature/my-feature
   # ... make changes ...
   git commit -m "feat: new feature"
   
   # Test in staging
   git checkout staging
   git merge feature/my-feature
   git push origin staging
   # → Auto-deploys to staging
   
   # Deploy to production
   git checkout main
   git merge staging
   git push origin main
   # → Requires approval, then deploys
   ```

2. **Monitor Deployments**:
   - Check Actions tab regularly
   - Review smoke test results
   - Approve production deployments when ready

---

**Ready to test?** Follow the steps above and check your GitHub Actions tab!
