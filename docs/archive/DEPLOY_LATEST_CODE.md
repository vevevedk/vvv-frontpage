# Deploy Latest Code to Server

## Current Status

**Server is on**: `7811f59` (old commit)
**Latest code is**: `f32a3ad` (ESLint fix)

The deployment workflow completed, but the code wasn't pulled to the server.

## Fix: Pull Latest Code

### On Server:

```bash
cd /var/www/vvv-frontpage
git pull origin main
docker-compose pull
docker-compose up -d
```

### Or Let GitHub Actions Deploy

The deployment workflow should have done this, but it may have:
1. Required approval (check GitHub Actions)
2. Failed silently
3. Not run the deploy job

**Check GitHub Actions**:
- Go to: Actions → "Deploy to Production #37"
- Check if "deploy" job completed or is waiting for approval

---

## Manual Deployment Steps

If GitHub Actions didn't deploy, do it manually:

```bash
# On server
cd /var/www/vvv-frontpage

# Pull latest code
git pull origin main

# Pull latest Docker images
docker login ghcr.io -u YOUR_GITHUB_USERNAME
docker pull ghcr.io/vevevedk/vvv-backend:latest
docker pull ghcr.io/vevevedk/vvv-frontend:latest

# Restart services with new images
docker-compose down
docker-compose up -d

# Verify
git log --oneline -1
docker-compose ps
```

---

## Verify Deployment

After pulling latest code:

```bash
# Should show: f32a3ad
git log --oneline -1

# Services should be running
docker-compose ps

# Check if new code is active
# (test the application)
```
