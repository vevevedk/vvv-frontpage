# Fix Nginx Path in Sudoers

## Problem
`sudo nginx -t` fails with "command not found" because sudo doesn't preserve PATH.

## Solution: Find Nginx Path and Update Sudoers

**On the server (as root), run these commands:**

**Step 1: Find where nginx is installed**
```bash
which nginx
```

**Step 2: Check common locations**
```bash
ls -la /usr/sbin/nginx
ls -la /usr/bin/nginx
ls -la /usr/local/sbin/nginx
```

**Step 3: Update sudoers with full path**

Once you know the path (let's say it's `/usr/sbin/nginx`), update the sudoers file:

```bash
nano /etc/sudoers.d/vvv-web-deploy
```

Change the line to use the full path:
```
vvv-web-deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
vvv-web-deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
vvv-web-deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
```

Or if you want to allow all nginx commands with the full path:
```
vvv-web-deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx *
vvv-web-deploy ALL=(ALL) NOPASSWD: /bin/systemctl * nginx
```

**Step 4: Save and verify**
- Press `Ctrl+X`, then `Y`, then `Enter`
- Run: `visudo -c -f /etc/sudoers.d/vvv-web-deploy`

**Step 5: Test with full path**
```bash
su - vvv-web-deploy
sudo /usr/sbin/nginx -t
```

## Quick One-Liners

**Find nginx:**
```bash
which nginx || find /usr -name nginx 2>/dev/null
```

**Update sudoers (replace /usr/sbin/nginx with actual path):**
```bash
echo "vvv-web-deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t" > /etc/sudoers.d/vvv-web-deploy && echo "vvv-web-deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx" >> /etc/sudoers.d/vvv-web-deploy && echo "vvv-web-deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx" >> /etc/sudoers.d/vvv-web-deploy && chmod 440 /etc/sudoers.d/vvv-web-deploy
```

