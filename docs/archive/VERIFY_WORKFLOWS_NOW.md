# Verify Workflows - Action Steps

## ✅ Step 1: Check Staging Workflow

### In GitHub UI:

1. **Go to Actions tab**:
   - https://github.com/vevevedk/vvv-frontpage/actions

2. **Look for "Deploy to Staging" workflow**:
   - Should have triggered when you pushed `staging` branch
   - Check the latest run status

3. **If workflow exists and completed**:
   - ✅ Green checkmark = Success
   - 🟡 Yellow circle = In progress
   - ❌ Red X = Failed (check logs)

4. **If workflow didn't trigger**:
   - Click "Deploy to Staging" in the left sidebar
   - Click "Run workflow" button (top right)
   - Select branch: `staging`
   - Click "Run workflow"

### Expected Jobs:
- `build-and-push` - Builds staging Docker images
- `deploy-staging` - Deploys to staging environment
- `smoke-tests` - Runs smoke tests

---

## ✅ Step 2: Test Production Approval

### Make a test commit:

```bash
# On your local machine
git checkout main
echo "# Test production approval" >> TEST_PRODUCTION.md
git add TEST_PRODUCTION.md
git commit -m "test: trigger production deployment approval"
git push origin main
```

### In GitHub UI:

1. **Go to Actions tab**:
   - https://github.com/vevevedk/vvv-frontpage/actions

2. **Find "Deploy to Production" workflow**:
   - Should show status: 🟡 "Waiting for approval"

3. **Approve deployment**:
   - Click on the workflow run
   - Look for **"Review deployments"** button (usually at top)
   - Click it
   - Review the deployment
   - Click **"Approve and deploy"**

4. **Watch deployment proceed**:
   - Should show `deploy` job running
   - Then `health-check` job running
   - Final status: ✅ Success

---

## 🔍 What to Look For

### Staging Workflow Success:
- ✅ All jobs completed
- ✅ Docker images built with `staging-latest` tag
- ✅ Deployment completed (may show warnings about staging directory, that's OK)
- ✅ Smoke tests completed (warnings are OK)

### Production Workflow Success:
- ✅ Build job completed
- 🟡 Deploy job waiting for approval
- ✅ After approval: Deploy job completed
- ✅ Health check completed
- ✅ Both veveve.io and veveve.dk health checks passed

---

## 🚨 If Something's Wrong

### Staging workflow not showing:
- Check if `staging` branch exists: `git branch -r | grep staging`
- Manually trigger from Actions tab

### Production not waiting for approval:
- Verify `production` environment has required reviewers
- Check workflow has `environment: production` in deploy job
- Make sure you're pushing to `main` branch

### Can't approve deployment:
- Check you're added as required reviewer
- Verify environment protection rules are set

---

## 📋 Quick Checklist

- [ ] Check Actions tab for "Deploy to Staging" workflow
- [ ] Verify staging workflow completed (or trigger manually)
- [ ] Make test commit to `main` branch
- [ ] Check "Deploy to Production" shows "Waiting for approval"
- [ ] Approve production deployment
- [ ] Verify production deployment completed
- [ ] Check health checks passed

---

**Ready?** Go to GitHub Actions tab and check the workflows!
