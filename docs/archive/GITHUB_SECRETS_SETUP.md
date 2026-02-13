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
- **Value**: (Content of the SSH private key - see generation instructions below)
- **Description**: SSH private key for authentication (should be generated without passphrase for CI/CD)
- **Note**: Paste the entire private key including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`
- **Important**: For CI/CD, use a key **without a passphrase** (see generation instructions below)

### 4. SSH_PORT (Optional)
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

## 🔑 Generate SSH Key (No Passphrase)

**For CI/CD, generate a new SSH key without a passphrase:**

```bash
# Generate a new ED25519 key without a passphrase
ssh-keygen -t ed25519 -f ~/.ssh/vvv_web_deploy_key -N ""

# Display the private key (to copy to GitHub Secrets)
cat ~/.ssh/vvv_web_deploy_key

# Display the public key (to add to server)
cat ~/.ssh/vvv_web_deploy_key.pub
```

**Then on the server (as root or vvv-web-deploy user):**
```bash
# Add the public key to authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "PASTE_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Or if you need to overwrite an existing key:**
```bash
# Generate new key (will overwrite existing)
ssh-keygen -t ed25519 -f ~/.ssh/vvv_web_deploy_key -N "" -y

# Then add the new public key to the server's authorized_keys
```

## 📝 Step-by-Step Instructions

1. **Generate SSH key** (see instructions above) if you haven't already

2. **Add public key to server:**
   - SSH to the server: `ssh vvv-web-deploy@143.198.105.78`
   - Add the public key to `~/.ssh/authorized_keys`

3. **Click "New repository secret"** (green button in GitHub)

4. **For each secret above:**
   - Enter the **Name** exactly as shown
   - Paste the **Value** (be careful with SSH_PRIVATE_KEY - include full key)
   - Click **"Add secret"**

5. **Verify all secrets are added:**
   - You should see 4-6 secrets listed under "Repository secrets"
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
- Check file permissions on server: `chmod 600 ~/.ssh/authorized_keys` and `chmod 700 ~/.ssh`

### "ssh: this private key is passphrase protected" error
- Generate a new SSH key without a passphrase: `ssh-keygen -t ed25519 -f ~/.ssh/vvv_web_deploy_key -N ""`
- Update the `SSH_PRIVATE_KEY` secret with the new key
- Add the new public key to the server's `~/.ssh/authorized_keys`

### "Connection refused" error
- Verify `SSH_HOST` is correct: `143.198.105.78`
- Check `SSH_PORT` if using non-standard port
- Ensure server firewall allows SSH connections

### "Host key verification failed"
- This is normal on first connection
- GitHub Actions will automatically accept the host key

---

**After adding secrets, the GitHub Actions workflow will be ready to deploy to the new server!**

