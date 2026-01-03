# GitHub Actions Secrets Setup

## 🔐 Required Secrets

Click **"New repository secret"** button and add these secrets:

### 1. SSH_HOST
- **Name**: `SSH_HOST`
- **Value**: `143.198.105.78`
- **Description**: IP address of the new server (vvv-app-web-v02)

### 2. SSH_USER
- **Name**: `SSH_USER`
- **Value**: `vvv-web-deploy`
- **Description**: SSH username for deployment

### 3. SSH_PRIVATE_KEY
- **Name**: `SSH_PRIVATE_KEY`
- **Value**: (Content of `vvv_web_deploy_key` from secure vault)
- **Description**: SSH private key for authentication
- **Note**: Paste the entire private key including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`

### 4. SSH_PASSPHRASE (Required if key is passphrase-protected)
- **Name**: `SSH_PASSPHRASE`
- **Value**: (The passphrase for the SSH private key)
- **Description**: Passphrase for the SSH private key (if the key is encrypted)
- **Note**: Only add this if your SSH key has a passphrase. If the key doesn't have a passphrase, you can skip this secret.

### 5. SSH_PORT (Optional)
- **Name**: `SSH_PORT`
- **Value**: `22`
- **Description**: SSH port (default is 22, only add if different)

### 6. NEXT_PUBLIC_API_URL (If not already set)
- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: `https://veveve.dk/api`
- **Description**: Public API URL for frontend build

### 7. NEXT_PUBLIC_APP_URL (If not already set)
- **Name**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://veveve.dk`
- **Description**: Public application URL for frontend build

---

## 📝 Step-by-Step Instructions

1. **Click "New repository secret"** (green button)

2. **For each secret above:**
   - Enter the **Name** exactly as shown
   - Paste the **Value** (be careful with SSH_PRIVATE_KEY - include full key)
   - Click **"Add secret"**

3. **Verify all secrets are added:**
   - You should see 5-7 secrets listed under "Repository secrets"
   - Secrets are masked (shown as `••••••••`)

---

## ✅ Verification

After adding secrets, you can test the connection by:

1. **Triggering a manual workflow run:**
   - Go to **Actions** tab
   - Select **"Deploy to Production"** workflow
   - Click **"Run workflow"** → **"Run workflow"**
   - Check if the deployment job succeeds

2. **Or push a small change to main branch:**
   - The workflow will automatically trigger
   - Monitor the **Actions** tab for deployment status

---

## 🔒 Security Notes

- **Never commit secrets to the repository**
- Secrets are encrypted by GitHub
- Only users with write access can view/use secrets
- Secrets are not exposed in workflow logs (they're masked)

---

## 🆘 Troubleshooting

### "Permission denied (publickey)" error
- Verify `SSH_PRIVATE_KEY` includes the full key (begin/end markers)
- Ensure the corresponding public key is in `~/.ssh/authorized_keys` on the server
- If key is passphrase-protected, ensure `SSH_PASSPHRASE` secret is set correctly

### "ssh: this private key is passphrase protected" error
- Add the `SSH_PASSPHRASE` secret with the correct passphrase
- Or generate a new SSH key without a passphrase for CI/CD (recommended for automation)

### "Connection refused" error
- Verify `SSH_HOST` is correct: `143.198.105.78`
- Check `SSH_PORT` if using non-standard port
- Ensure server firewall allows SSH connections

### "Host key verification failed"
- This is normal on first connection
- GitHub Actions will automatically accept the host key

---

**After adding secrets, the GitHub Actions workflow will be ready to deploy to the new server!**

