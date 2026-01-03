# Simple Single-Line Commands for DO Console

## Problem
DigitalOcean console has issues with multi-line commands. Use these one-line commands instead.

## Step-by-Step (Run Each Command Separately)

**1. Create the .ssh directory:**
```bash
mkdir -p /home/vvv-web-deploy/.ssh
```

**2. Set directory permissions:**
```bash
chmod 700 /home/vvv-web-deploy/.ssh
```

**3. Add your public key:**
```bash
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGCEvp20a2KpkZUvbtYdKtrh/P80ZxO+2PcqSBgbtsNG iversen@iversens-MacBook-Air.local" >> /home/vvv-web-deploy/.ssh/authorized_keys
```

**4. Set file permissions:**
```bash
chmod 600 /home/vvv-web-deploy/.ssh/authorized_keys
```

**5. Set ownership:**
```bash
chown -R vvv-web-deploy:vvv-web-deploy /home/vvv-web-deploy/.ssh
```

**6. Verify it worked:**
```bash
cat /home/vvv-web-deploy/.ssh/authorized_keys
```

## Alternative: If Echo Doesn't Work

If the echo command has issues, you can use a different approach:

**1. Create/edit the file directly:**
```bash
nano /home/vvv-web-deploy/.ssh/authorized_keys
```

Then paste this line:
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGCEvp20a2KpkZUvbtYdKtrh/P80ZxO+2PcqSBgbtsNG iversen@iversens-MacBook-Air.local
```

Press Ctrl+X, then Y, then Enter to save.

**2. Set permissions:**
```bash
chmod 600 /home/vvv-web-deploy/.ssh/authorized_keys
```

**3. Set ownership:**
```bash
chown -R vvv-web-deploy:vvv-web-deploy /home/vvv-web-deploy/.ssh
```

## Quick Copy-Paste Version

Copy and paste these commands ONE AT A TIME:

```bash
mkdir -p /home/vvv-web-deploy/.ssh && chmod 700 /home/vvv-web-deploy/.ssh
```

```bash
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGCEvp20a2KpkZUvbtYdKtrh/P80ZxO+2PcqSBgbtsNG iversen@iversens-MacBook-Air.local" >> /home/vvv-web-deploy/.ssh/authorized_keys
```

```bash
chmod 600 /home/vvv-web-deploy/.ssh/authorized_keys && chown -R vvv-web-deploy:vvv-web-deploy /home/vvv-web-deploy/.ssh
```

```bash
cat /home/vvv-web-deploy/.ssh/authorized_keys
```

## After Setup

Exit the console and test from your local machine:
```bash
ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78
```

Then test GitHub Actions deployment!

