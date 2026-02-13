# Quick Test Commands

## Test Staging Deployment

### Check if staging branch exists on remote:
```bash
git branch -r | grep staging
```

### Check workflow file:
```bash
ls -la .github/workflows/staging.yml
```

### Manually trigger staging (if needed):
1. Go to: https://github.com/vevevedk/vvv-frontpage/actions
2. Click "Deploy to Staging"
3. Click "Run workflow" → Select `staging` branch → Run

---

## Test Production Approval

### Make a test commit:
```bash
git checkout main
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: production deployment"
git push origin main
```

### Check workflow:
1. Go to: https://github.com/vevevedk/vvv-frontpage/actions
2. Find "Deploy to Production" workflow
3. Should show "Waiting for approval"
4. Click "Review deployments" → "Approve and deploy"

---

## Verify Environments

### Check environment configuration:
1. Go to: https://github.com/vevevedk/vvv-frontpage/settings/environments
2. Verify:
   - `staging` exists (no protection rules)
   - `production` exists (2 protection rules)

---

## Quick Status Check

### Check recent commits:
```bash
git log --oneline -5
```

### Check current branch:
```bash
git branch --show-current
```

### Check remote branches:
```bash
git branch -r
```
