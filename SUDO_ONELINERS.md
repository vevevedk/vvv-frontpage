# One-Liner Commands for Sudoers Setup

## Step 1: Find Nginx Path
```bash
which nginx
```

## Step 2: Remove Old Sudoers File
```bash
rm /etc/sudoers.d/vvv-web-deploy
```

## Step 3: Create New Sudoers File (Option A - Specific Commands)
```bash
echo -e "vvv-web-deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx\nvvv-web-deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t\nvvv-web-deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx\nvvv-web-deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx" > /etc/sudoers.d/vvv-web-deploy && chmod 440 /etc/sudoers.d/vvv-web-deploy
```

## Step 3 Alternative: Create New Sudoers File (Option B - Full Sudo - Simpler)
```bash
echo "vvv-web-deploy ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/vvv-web-deploy && chmod 440 /etc/sudoers.d/vvv-web-deploy
```

## Step 4: Verify Syntax
```bash
visudo -c -f /etc/sudoers.d/vvv-web-deploy
```

## Step 5: Test (Switch to Deploy User First)
```bash
su - vvv-web-deploy
```

Then once you're the deploy user:
```bash
sudo nginx -t
```

## Quick Copy-Paste Sequence (Option B - Full Sudo)

```bash
rm /etc/sudoers.d/vvv-web-deploy && echo "vvv-web-deploy ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/vvv-web-deploy && chmod 440 /etc/sudoers.d/vvv-web-deploy && visudo -c -f /etc/sudoers.d/vvv-web-deploy
```

Then test:
```bash
su - vvv-web-deploy -c "sudo nginx -t"
```

