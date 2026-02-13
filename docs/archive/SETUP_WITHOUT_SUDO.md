# Setup Without Sudo Access

Since `vvv-web-deploy` doesn't have sudo access, we have a few options:

---

## Option 1: Ask Server Admin to Create Directory (Recommended)

Have the server admin run:

```bash
sudo mkdir -p /var/www/vvv-frontpage
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage
```

Then you can proceed with GitHub Actions deployment.

---

## Option 2: Use Home Directory Instead

If you can't get `/var/www` access, we can deploy to the home directory:

```bash
# On server (as vvv-web-deploy, no sudo needed)
mkdir -p ~/vvv-frontpage
cd ~/vvv-frontpage
```

Then update the GitHub Actions workflow to use `~/vvv-frontpage` instead of `/var/www/vvv-frontpage`.

---

## Option 3: Restore Sudo Access

If the migration brief mentioned passwordless sudo was configured, ask the admin to restore it:

```bash
# Admin should run:
sudo visudo
# Add this line:
vvv-web-deploy ALL=(ALL) NOPASSWD: /usr/bin/mkdir, /usr/bin/chown, /usr/sbin/nginx, /usr/bin/systemctl, /usr/bin/certbot
```

This gives limited sudo access only for deployment tasks.

---

## Option 4: Update Workflow for No Sudo

We can modify the workflow to work without sudo, but Nginx configuration will need to be done by admin.

---

**Which option would you prefer?** I recommend Option 1 (ask admin) or Option 3 (restore limited sudo).


