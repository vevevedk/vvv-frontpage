# Debug Workflow Failures

## 🔍 Current Status

I can see several workflow failures:
- ❌ Deploy to Production #36 (failed)
- ❌ Build and Push Docker Images #126 (failed)
- ❌ Deploy to Staging #1 (failed)
- ❌ Build and Push Docker Images #125 (failed)
- ❌ Deploy to Production #35 (failed)

## 🔍 How to Debug

### Step 1: Check Workflow Logs

1. **Click on a failed workflow** (e.g., "Deploy to Production #36")
2. **Look for the failed job** (usually red X icon)
3. **Click on the job** to see detailed logs
4. **Look for error messages** in the logs

### Common Failure Points:

#### Build and Push Docker Images
- **Dockerfile issues**: Syntax errors, missing files
- **Build context problems**: Files not found
- **Registry authentication**: GHCR login issues
- **Image metadata**: Tag generation problems

#### Deploy to Production/Staging
- **SSH connection**: Can't connect to server
- **Server directory**: `/var/www/vvv-frontpage` doesn't exist
- **Docker commands**: Docker not installed or not in PATH
- **Git operations**: Can't clone/pull repository
- **Environment files**: Missing or incorrect env files

---

## 🚨 Common Issues & Fixes

### Issue 1: Docker Build Fails

**Check**:
- Dockerfile syntax
- Build context includes all needed files
- Dependencies are available

**Fix**:
- Check Dockerfile for errors
- Verify all referenced files exist
- Check build logs for specific error

---

### Issue 2: SSH Connection Fails

**Check**:
- GitHub Secrets configured:
  - `SSH_HOST`
  - `SSH_USER`
  - `SSH_PRIVATE_KEY`
  - `SSH_PORT` (optional)

**Fix**:
- Verify secrets in: Settings → Secrets and variables → Actions
- Test SSH connection manually
- Check SSH key format (should be full key, not just public key)

---

### Issue 3: Server Directory Missing

**Error**: `DEPLOY_DIR does not exist`

**Fix**:
```bash
# On server
sudo mkdir -p /var/www/vvv-frontpage
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage
```

---

### Issue 4: Docker Not Available

**Error**: `Docker is not installed or not in PATH`

**Fix**:
```bash
# On server
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker vvv-web-deploy
```

---

### Issue 5: Staging Directory Missing

**Error**: Staging deployment fails

**Fix**:
```bash
# On server
sudo mkdir -p /var/www/vvv-frontpage-staging
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage-staging
```

---

## 📋 Debugging Checklist

### For Each Failed Workflow:

1. **Click on the workflow run**
2. **Identify which job failed**:
   - `build-and-push`?
   - `deploy` or `deploy-staging`?
   - `smoke-tests` or `health-check`?

3. **Click on the failed job**
4. **Read the error message**:
   - Look for red error text
   - Check the last few lines of logs
   - Look for stack traces

5. **Common error patterns**:
   - `Error: Process completed with exit code 1` → Check logs above
   - `Permission denied` → SSH or file permission issue
   - `No such file or directory` → Missing file or directory
   - `Docker: command not found` → Docker not installed
   - `Authentication failed` → SSH or registry auth issue

---

## 🔧 Quick Fixes

### Check GitHub Secrets

1. Go to: **Settings → Secrets and variables → Actions**
2. Verify these secrets exist:
   - `SSH_HOST` (should be: `143.198.105.78`)
   - `SSH_USER` (should be: `vvv-web-deploy`)
   - `SSH_PRIVATE_KEY` (full private key content)
   - `SSH_PORT` (optional, default: `22`)

### Test SSH Connection

```bash
# On your local machine
ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78
```

### Check Server Setup

```bash
# On server
ls -la /var/www/vvv-frontpage
docker --version
docker-compose --version
```

---

## 📝 Next Steps

1. **Click on a failed workflow** to see detailed error
2. **Share the error message** so I can help fix it
3. **Check the specific job that failed** (build vs deploy)
4. **Verify server setup** matches requirements

---

**Action**: Click on one of the failed workflows and check what error it shows!
