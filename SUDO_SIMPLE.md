# Simple Commands for DO Console (Uppercase-Safe)

## Problem
DigitalOcean console converts pasted commands to uppercase. Use these shorter commands or the nano editor method.

## Method 1: Short Commands (One at a Time)

**Command 1:**
```bash
rm /etc/sudoers.d/vvv-web-deploy
```

**Command 2:**
```bash
echo "vvv-web-deploy ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/vvv-web-deploy
```

**Command 3:**
```bash
chmod 440 /etc/sudoers.d/vvv-web-deploy
```

**Command 4:**
```bash
visudo -c -f /etc/sudoers.d/vvv-web-deploy
```

## Method 2: Use Nano Editor (Easiest)

**Step 1: Create the file**
```bash
nano /etc/sudoers.d/vvv-web-deploy
```

**Step 2: In nano, type this line:**
```
vvv-web-deploy ALL=(ALL) NOPASSWD: ALL
```

**Step 3: Save and exit:**
- Press `Ctrl+X`
- Press `Y` (to confirm)
- Press `Enter` (to save)

**Step 4: Set permissions**
```bash
chmod 440 /etc/sudoers.d/vvv-web-deploy
```

**Step 5: Verify**
```bash
visudo -c -f /etc/sudoers.d/vvv-web-deploy
```

## Method 3: Use printf (If echo doesn't work)

**Command 1:**
```bash
rm /etc/sudoers.d/vvv-web-deploy
```

**Command 2:**
```bash
printf "vvv-web-deploy ALL=(ALL) NOPASSWD: ALL\n" > /etc/sudoers.d/vvv-web-deploy
```

**Command 3:**
```bash
chmod 440 /etc/sudoers.d/vvv-web-deploy
```

## Test After Setup

```bash
su - vvv-web-deploy
```

Then:
```bash
sudo nginx -t
```

If it works without asking for password, you're done!

