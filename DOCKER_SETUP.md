# Docker Setup on Server

## Problem
Deployment fails with `docker: command not found` and `docker-compose: command not found`.

## Solution Options

### Option 1: Install Docker (If Not Installed)

**On the server (as root), run:**

```bash
# Update package index
apt update

# Install Docker
apt install -y docker.io docker-compose

# Start Docker service
systemctl start docker
systemctl enable docker

# Add deploy user to docker group (so they can run docker without sudo)
usermod -aG docker vvv-web-deploy
```

**Then the deploy user needs to log out and back in for group changes to take effect.**

### Option 2: Check if Docker is Installed but Not in PATH

**Check if Docker exists:**
```bash
which docker
which docker-compose
ls -la /usr/bin/docker
ls -la /usr/local/bin/docker
```

**If Docker exists but not in PATH, we can:**
1. Add it to PATH in the workflow
2. Use full path in the workflow
3. Create symlinks

### Option 3: Use Full Paths in Workflow

If Docker is installed but not in PATH, we can update the workflow to use full paths like:
- `/usr/bin/docker`
- `/usr/local/bin/docker`
- Or find the actual path and use it

## Quick Check Commands

**As root on server:**
```bash
# Check if Docker is installed
docker --version
docker-compose --version

# Check if Docker service is running
systemctl status docker

# Check if deploy user is in docker group
groups vvv-web-deploy
```

## Recommended: Install Docker

If Docker isn't installed, install it using Option 1 above. This is the cleanest solution.

