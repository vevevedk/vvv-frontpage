# Fix Workflow Failures - Action Plan

## 🔍 Current Issues

Multiple workflows are failing:
- ❌ Deploy to Production #36
- ❌ Build and Push Docker Images #126
- ❌ Deploy to Staging #1
- ❌ Build and Push Docker Images #125

## 📋 Systematic Debugging Steps

### Step 1: Identify the Failure Point

For each failed workflow, check:
1. **Which job failed?**
   - `build-and-push` → Docker build issue
   - `deploy` or `deploy-staging` → Server/SSH issue
   - `smoke-tests` or `health-check` → Test issue

2. **What's the error message?**
   - Click on failed job → Scroll to bottom → Copy error

### Step 2: Common Issues & Fixes

#### Issue A: Docker Build Fails

**Symptoms**:
- `build-and-push` job fails
- Error: "Dockerfile not found" or build errors

**Check**:
```bash
# Verify Dockerfiles exist
ls -la backend/Dockerfile
ls -la frontend.Dockerfile
```

**Fix**:
- Ensure Dockerfiles exist in correct locations
- Check Dockerfile syntax
- Verify build context includes all needed files

---

#### Issue B: SSH Connection Fails

**Symptoms**:
- `deploy` or `deploy-staging` job fails
- Error: "Permission denied" or "Connection refused"

**Check GitHub Secrets**:
1. Go to: Settings → Secrets and variables → Actions
2. Verify these exist:
   - `SSH_HOST` = `143.198.105.78`
   - `SSH_USER` = `vvv-web-deploy`
   - `SSH_PRIVATE_KEY` = (full private key, including `-----BEGIN` and `-----END`)
   - `SSH_PORT` = `22` (optional)

**Test SSH manually**:
```bash
# On your local machine
ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78
```

**Fix**:
- Add/update secrets in GitHub
- Ensure SSH key format is correct (full key, not just public key)

---

#### Issue C: Server Directory Missing

**Symptoms**:
- Error: "DEPLOY_DIR does not exist" or "No such file or directory"

**Fix on server**:
```bash
# SSH to server
ssh vvv-web-deploy@143.198.105.78

# Create production directory
sudo mkdir -p /var/www/vvv-frontpage
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage

# Create staging directory
sudo mkdir -p /var/www/vvv-frontpage-staging
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage-staging
```

---

#### Issue D: Docker Not Installed

**Symptoms**:
- Error: "Docker is not installed or not in PATH"

**Fix on server**:
```bash
# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker vvv-web-deploy

# Log out and back in for group changes to take effect
# Or run: newgrp docker
```

---

#### Issue E: Dockerfile Path Issues

**Symptoms**:
- Error: "file not found" or "context not found"

**Check workflow files**:
- `.github/workflows/deploy.yml` uses: `file: ./backend/Dockerfile`
- `.github/workflows/staging.yml` uses: `file: ./backend/Dockerfile`
- Verify these paths are correct

---

## 🔧 Quick Fix Checklist

### On GitHub (GitHub UI):

- [ ] Check Secrets: Settings → Secrets and variables → Actions
  - [ ] `SSH_HOST` exists
  - [ ] `SSH_USER` exists
  - [ ] `SSH_PRIVATE_KEY` exists (full key)
  - [ ] `SSH_PORT` exists (optional)

### On Server:

- [ ] Production directory exists: `/var/www/vvv-frontpage`
- [ ] Staging directory exists: `/var/www/vvv-frontpage-staging`
- [ ] Docker installed: `docker --version`
- [ ] Docker Compose installed: `docker-compose --version`
- [ ] User in docker group: `groups | grep docker`

### In Repository:

- [ ] `backend/Dockerfile` exists
- [ ] `frontend.Dockerfile` exists (or `frontend/Dockerfile`)
- [ ] Workflow files reference correct Dockerfile paths

---

## 🚀 Next Steps

1. **Check one failed workflow**:
   - Click on "Deploy to Production #36"
   - Click on failed job
   - Copy the error message

2. **Verify server setup**:
   ```bash
   # SSH to server and run:
   ls -la /var/www/vvv-frontpage
   docker --version
   docker-compose --version
   ```

3. **Verify GitHub Secrets**:
   - Go to: Settings → Secrets and variables → Actions
   - Check all required secrets exist

4. **Fix the issue** based on error message

5. **Re-run workflow**:
   - Go to Actions tab
   - Click on workflow
   - Click "Re-run jobs"

---

## 📝 Most Likely Issues

Based on common failures:

1. **Missing GitHub Secrets** (most common)
   - SSH keys not configured
   - Solution: Add secrets in GitHub Settings

2. **Server directory missing**
   - `/var/www/vvv-frontpage` doesn't exist
   - Solution: Create directory on server

3. **Docker not installed**
   - Docker commands fail
   - Solution: Install Docker on server

4. **Dockerfile path wrong**
   - Workflow can't find Dockerfile
   - Solution: Check Dockerfile location and workflow paths

---

**Action**: Check the error message from a failed workflow and we'll fix it!
