# Root Setup Commands for DigitalOcean Console

**Log in as root via DigitalOcean Console** and run these commands:

---

## Commands to Run as Root

```bash
# Create directory structure
mkdir -p /var/www/vvv-frontpage

# Set ownership to deploy user
chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage

# Set proper permissions (755 for directory, files will be set by user)
chmod 755 /var/www/vvv-frontpage

# Verify
ls -la /var/www/
```

**Expected output:**
```
drwxr-xr-x  2 vvv-web-deploy vvv-web-deploy 4096 Dec 27 14:45 vvv-frontpage
```

---

## Optional: Setup Nginx Directory (if needed)

```bash
# Create Nginx config directory structure (if it doesn't exist)
mkdir -p /etc/nginx/sites-available
mkdir -p /etc/nginx/sites-enabled

# Verify Nginx is installed
nginx -v
```

---

## Verify Setup

After running the commands, switch back to the deploy user and verify:

```bash
# As vvv-web-deploy user
ls -la /var/www/
cd /var/www/vvv-frontpage
pwd
```

You should be able to:
- ✅ See the directory
- ✅ Navigate into it
- ✅ Create files in it

---

## After Directory is Created

Once the directory is set up, you can:

1. **Trigger GitHub Actions deployment** (push to main or manual trigger)
2. The workflow will automatically clone the repo
3. Then edit environment files and start services

---

**That's it! The directory will be ready for GitHub Actions to deploy.**


