# Configure Passwordless Sudo for Deployment User

## Problem

The deployment workflow needs sudo access for:
- Nginx configuration management
- Nginx reload

But the `vvv-web-deploy` user doesn't have passwordless sudo configured.

## Solution Options

### Option 1: Configure Passwordless Sudo (Recommended)

**On the server (as root):**

```bash
# Create sudoers file for vvv-web-deploy
echo "vvv-web-deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx, /bin/systemctl restart nginx, /usr/bin/nginx -t" | sudo tee /etc/sudoers.d/vvv-web-deploy

# Set correct permissions
chmod 440 /etc/sudoers.d/vvv-web-deploy

# Verify it works
su - vvv-web-deploy -c "sudo -n nginx -t"
```

This allows the deploy user to run specific commands without a password.

### Option 2: Manual Nginx Setup (Current Workaround)

The workflow now skips sudo commands if passwordless sudo isn't configured. You'll need to:

1. **Set up Nginx configuration manually (one time):**
   ```bash
   sudo cp /var/www/vvv-frontpage/deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage
   sudo ln -sf /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Reload Nginx manually after deployments** (if configuration changes):
   ```bash
   sudo systemctl reload nginx
   ```

### Option 3: More Permissive Sudo (Less Secure)

If you want full sudo access (not recommended):

```bash
echo "vvv-web-deploy ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/vvv-web-deploy
chmod 440 /etc/sudoers.d/vvv-web-deploy
```

## Recommended: Option 1

Configure passwordless sudo for specific commands only. This is secure and allows automated deployments.

**Commands to run on server (as root):**

```bash
echo "vvv-web-deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl reload nginx, /bin/systemctl restart nginx, /usr/bin/nginx -t" | sudo tee /etc/sudoers.d/vvv-web-deploy
chmod 440 /etc/sudoers.d/vvv-web-deploy
```

Then test:
```bash
su - vvv-web-deploy -c "sudo nginx -t"
```

If this works, the deployment workflow will be able to reload Nginx automatically.

