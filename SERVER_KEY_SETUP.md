# Server SSH Key Setup via DigitalOcean Console

## 📋 Overview

After generating a new SSH key without a passphrase, you need to add the **public key** to the server's `authorized_keys` file for the `vvv-web-deploy` user.

## 🔑 Step 1: Get Your Public Key

On your local machine, display the public key:

```bash
cat ~/.ssh/vvv_web_deploy_key.pub
```

**Copy the entire output** - it should look like:
```
ssh-ed25519 AAAA... your-email@example.com
```

## 🖥️ Step 2: Add Key via DigitalOcean Console

1. **Log in to DigitalOcean Console**
   - Go to https://cloud.digitalocean.com
   - Navigate to your droplet: `vvv-app-web-v02` (143.198.105.78)

2. **Open Console Access**
   - Click on the droplet
   - Click **"Access"** tab or **"Console"** button
   - This will open a web-based terminal (you'll be logged in as root)

3. **Switch to the deploy user and add the key:**

```bash
# Switch to the deploy user
su - vvv-web-deploy

# Create .ssh directory if it doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add the new public key to authorized_keys
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Verify the key was added
cat ~/.ssh/authorized_keys
```

**Important:** Replace `PASTE_YOUR_PUBLIC_KEY_HERE` with the actual public key you copied in Step 1.

## 🔄 Alternative: If You Want to Replace All Keys

If you want to replace all existing keys (not just add a new one):

```bash
# Switch to deploy user
su - vvv-web-deploy

# Backup existing keys (optional)
cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup

# Replace with new key only
echo "PASTE_YOUR_PUBLIC_KEY_HERE" > ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## ✅ Step 3: Test the Connection

After adding the key, test from your local machine:

```bash
ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78
```

You should be able to connect without entering a password.

## 🆘 Troubleshooting

### "Permission denied (publickey)" error
- Verify the public key was added correctly: `cat ~/.ssh/authorized_keys`
- Check file permissions: `ls -la ~/.ssh/`
- Ensure `authorized_keys` is `600` and `.ssh` directory is `700`

### "Too many authentication failures"
- Remove old keys from `authorized_keys` if you're replacing them
- Keep only the new key in the file

### Can't switch to vvv-web-deploy user
- If `su - vvv-web-deploy` doesn't work, try: `sudo -u vvv-web-deploy bash`
- Or create the directory structure as root first:
  ```bash
  mkdir -p /home/vvv-web-deploy/.ssh
  chown vvv-web-deploy:vvv-web-deploy /home/vvv-web-deploy/.ssh
  chmod 700 /home/vvv-web-deploy/.ssh
  ```

## 📝 Quick Reference

**Public key location (local):** `~/.ssh/vvv_web_deploy_key.pub`  
**Server authorized_keys:** `/home/vvv-web-deploy/.ssh/authorized_keys`  
**Required permissions:**
- `~/.ssh` directory: `700` (drwx------)
- `~/.ssh/authorized_keys` file: `600` (-rw-------)

