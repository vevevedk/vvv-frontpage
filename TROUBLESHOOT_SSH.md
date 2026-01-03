# Troubleshooting SSH Authentication in GitHub Actions

## 🔍 Current Issue

GitHub Actions is failing with:
```
ssh: handshake failed: ssh: unable to authenticate, attempted methods [none publickey], no supported methods remain
```

But local SSH works: `ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78`

## ✅ Verification Steps

### 1. Verify the Private Key Format in GitHub Secrets

The `SSH_PRIVATE_KEY` secret must include:
- The **entire** private key
- **All newlines preserved**
- Both header and footer:
  ```
  -----BEGIN OPENSSH PRIVATE KEY-----
  [key content]
  -----END OPENSSH PRIVATE KEY-----
  ```

**Common mistakes:**
- Missing newlines (key should be multi-line)
- Missing header/footer
- Extra spaces or characters
- Only partial key copied

### 2. Get the Correct Private Key

On your local machine:

```bash
# Display the private key (copy everything including headers)
cat ~/.ssh/vvv_web_deploy_key
```

**Important:** Copy the ENTIRE output, including:
- `-----BEGIN OPENSSH PRIVATE KEY-----`
- All the key content (multiple lines)
- `-----END OPENSSH PRIVATE KEY-----`

### 3. Update GitHub Secret

1. Go to: Repository → Settings → Secrets and variables → Actions
2. Find `SSH_PRIVATE_KEY`
3. Click "Update"
4. **Delete the old value completely**
5. Paste the entire private key (from step 2)
6. Make sure newlines are preserved
7. Click "Update secret"

### 4. Verify Key Pair Match

To verify the private key matches the public key on the server:

```bash
# On your local machine, get the public key from the private key
ssh-keygen -y -f ~/.ssh/vvv_web_deploy_key
```

This should output the same public key that's in `~/.ssh/authorized_keys` on the server.

**On the server:**
```bash
cat ~/.ssh/authorized_keys
```

Both should match!

### 5. Check Server Permissions

SSH to the server and verify:

```bash
# Check .ssh directory permissions
ls -ld ~/.ssh
# Should be: drwx------ (700)

# Check authorized_keys permissions
ls -l ~/.ssh/authorized_keys
# Should be: -rw------- (600)

# Check file ownership
# Should be owned by vvv-web-deploy:vvv-web-deploy
```

If permissions are wrong:
```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chown vvv-web-deploy:vvv-web-deploy ~/.ssh
chown vvv-web-deploy:vvv-web-deploy ~/.ssh/authorized_keys
```

## 🔧 Alternative: Use SSH Key File Instead

If the secret approach isn't working, you can try using a key file path, but this requires the key to be in the GitHub Actions runner, which isn't practical. The secret approach should work.

## 🧪 Test the Key Format

You can test if your private key is valid:

```bash
# Test if the key can be read
ssh-keygen -l -f ~/.ssh/vvv_web_deploy_key

# This should output the key fingerprint without errors
```

## 📝 Quick Checklist

- [ ] Private key in GitHub Secrets includes full key with headers
- [ ] All newlines are preserved in the secret
- [ ] Public key on server matches private key (verify with `ssh-keygen -y`)
- [ ] Server permissions are correct (700 for .ssh, 600 for authorized_keys)
- [ ] File ownership is correct (vvv-web-deploy:vvv-web-deploy)
- [ ] Local SSH works (confirmed ✅)

## 🆘 Still Not Working?

If it still fails after all checks:

1. **Generate a completely new key pair:**
   ```bash
   # Remove old key
   rm ~/.ssh/vvv_web_deploy_key ~/.ssh/vvv_web_deploy_key.pub
   
   # Generate new key
   ssh-keygen -t ed25519 -f ~/.ssh/vvv_web_deploy_key -N ""
   
   # Add new public key to server
   cat ~/.ssh/vvv_web_deploy_key.pub
   # Then add to server's authorized_keys
   
   # Update GitHub Secret with new private key
   cat ~/.ssh/vvv_web_deploy_key
   ```

2. **Check GitHub Actions logs** for more detailed error messages

3. **Verify the secret is actually being used** - check the workflow logs to see if the key is being passed correctly

