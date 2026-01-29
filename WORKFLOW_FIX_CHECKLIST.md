# Workflow Fix Checklist - Step by Step

## 🎯 Goal
Fix all failing GitHub Actions workflows (staging and production deployments)

---

## Step 1: Check GitHub Secrets ⚠️ MOST LIKELY ISSUE

### Action Required:
1. Go to: https://github.com/vevevedk/vvv-frontpage/settings/secrets/actions
2. Verify these secrets exist:

**Required Secrets**:
- [ ] `SSH_HOST` = `143.198.105.78`
- [ ] `SSH_USER` = `vvv-web-deploy`
- [ ] `SSH_PRIVATE_KEY` = (full private key content, including `-----BEGIN` and `-----END` lines)
- [ ] `SSH_PORT` = `22` (optional, but recommended)

**Optional Secrets** (for frontend build):
- [ ] `NEXT_PUBLIC_API_URL` = (optional)
- [ ] `NEXT_PUBLIC_APP_URL` = (optional)

### If Secrets Missing:
1. Click **"New repository secret"**
2. Add each secret with correct name and value
3. Save

### Test SSH Key Format:
The `SSH_PRIVATE_KEY` should look like:
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
...
-----END OPENSSH PRIVATE KEY-----
```

**NOT** just the public key or a single line.

---

## Step 2: Verify Server Setup

### SSH to Server:
```bash
ssh vvv-web-deploy@143.198.105.78
```

### Check Production Directory:
```bash
ls -la /var/www/vvv-frontpage
```

**If missing, create it**:
```bash
sudo mkdir -p /var/www/vvv-frontpage
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage
```

### Check Staging Directory:
```bash
ls -la /var/www/vvv-frontpage-staging
```

**If missing, create it**:
```bash
sudo mkdir -p /var/www/vvv-frontpage-staging
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage-staging
```

### Check Docker Installation:
```bash
docker --version
docker-compose --version
```

**If missing, install**:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker vvv-web-deploy
# Log out and back in, or run: newgrp docker
```

### Verify Docker Group:
```bash
groups | grep docker
```

**If not in group, add**:
```bash
sudo usermod -aG docker vvv-web-deploy
newgrp docker  # Or log out and back in
```

---

## Step 3: Check Workflow Error Messages

### In GitHub:
1. Go to: https://github.com/vevevedk/vvv-frontpage/actions
2. Click on a failed workflow (e.g., "Deploy to Production #36")
3. Click on the failed job (red X)
4. Scroll to bottom of logs
5. **Copy the error message**

### Common Error Patterns:

**Error: "Permission denied (publickey)"**
- → SSH key not configured or wrong format
- → Fix: Check `SSH_PRIVATE_KEY` secret

**Error: "DEPLOY_DIR does not exist"**
- → Server directory missing
- → Fix: Create directory on server (Step 2)

**Error: "Docker is not installed"**
- → Docker not installed
- → Fix: Install Docker (Step 2)

**Error: "file not found: ./backend/Dockerfile"**
- → Dockerfile path issue
- → Fix: Verify Dockerfiles exist (they do!)

**Error: "Build failed"**
- → Docker build error
- → Fix: Check build logs for specific error

---

## Step 4: Test Workflow Manually

### Test Production Workflow:
1. Go to: Actions → "Deploy to Production"
2. Click **"Run workflow"** (top right)
3. Select branch: `main`
4. Check "Skip build" if you want to test deployment only
5. Click **"Run workflow"**
6. Watch for errors

### Test Staging Workflow:
1. Go to: Actions → "Deploy to Staging"
2. Click **"Run workflow"**
3. Select branch: `staging`
4. Click **"Run workflow"**
5. Watch for errors

---

## Step 5: Fix Based on Error

### If SSH Fails:
- Verify secrets are correct
- Test SSH manually: `ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78`
- Check SSH key format in GitHub secrets

### If Directory Missing:
- Create on server: `sudo mkdir -p /var/www/vvv-frontpage && sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage`

### If Docker Missing:
- Install on server: `sudo apt install -y docker.io docker-compose && sudo usermod -aG docker vvv-web-deploy`

### If Build Fails:
- Check Dockerfile syntax
- Verify all files exist
- Check build logs for specific error

---

## ✅ Quick Verification

### After Fixing:

1. **Re-run workflow**:
   - Go to failed workflow
   - Click "Re-run jobs"
   - Watch for success

2. **Check workflow status**:
   - Should show ✅ (green checkmark)
   - All jobs should complete

3. **Verify deployment**:
   - Check server: `docker-compose ps` (in deployment directory)
   - Check services are running

---

## 📋 Priority Order

1. **Check GitHub Secrets** (most likely issue) ← START HERE
2. **Verify server directories exist**
3. **Check Docker is installed**
4. **Review actual error messages from workflows**
5. **Fix specific issues found**

---

## 🚀 Next Action

**Start with Step 1**: Check GitHub Secrets are configured correctly!

Then share the specific error message from a failed workflow and we'll fix it.
