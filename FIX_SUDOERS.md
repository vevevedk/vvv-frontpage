# Fix Sudoers Configuration

## Problem

The sudoers configuration might have syntax issues. When specifying commands with arguments in sudoers, the syntax needs to be precise.

## Solution: Fix the Sudoers File

**On the server (as root), run these commands:**

**1. Find the actual nginx path:**
```bash
which nginx
```

**2. Check nginx -t path:**
```bash
nginx -t 2>&1 | head -1
```

**3. Update sudoers with correct syntax:**

The issue is that sudoers needs commands to be specified correctly. Try this:

```bash
# Remove the old file
rm /etc/sudoers.d/vvv-web-deploy

# Create new one with proper syntax
cat > /etc/sudoers.d/vvv-web-deploy << 'EOF'
vvv-web-deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx
vvv-web-deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
vvv-web-deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart nginx
vvv-web-deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
EOF

# Set permissions
chmod 440 /etc/sudoers.d/vvv-web-deploy

# Verify syntax
visudo -c -f /etc/sudoers.d/vvv-web-deploy
```

**4. Test it:**

```bash
# Test as the deploy user
su - vvv-web-deploy
sudo nginx -t
exit
```

## Alternative: Simpler Approach

If the above doesn't work, try allowing all nginx-related commands:

```bash
cat > /etc/sudoers.d/vvv-web-deploy << 'EOF'
vvv-web-deploy ALL=(ALL) NOPASSWD: /usr/sbin/nginx *
vvv-web-deploy ALL=(ALL) NOPASSWD: /bin/systemctl * nginx
EOF

chmod 440 /etc/sudoers.d/vvv-web-deploy
visudo -c -f /etc/sudoers.d/vvv-web-deploy
```

## Verify Nginx Path

First, check where nginx actually is:

```bash
which nginx
whereis nginx
```

Common locations:
- `/usr/sbin/nginx`
- `/usr/bin/nginx`
- `/usr/local/sbin/nginx`

Then update the sudoers file with the correct path.

