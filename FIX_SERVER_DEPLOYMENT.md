# Fix Server Deployment Issues

## Issues Found

1. **Git pull blocked**: `env/backend.env` has local changes
2. **Docker authentication failed**: Need GitHub token to pull from GHCR

## Solution

### Step 1: Handle Local Changes

**Option A: Stash changes** (recommended - keeps your env file):
```bash
cd /var/www/vvv-frontpage
git stash
git pull origin main
git stash pop  # Restore your local env changes
```

**Option B: Commit local changes**:
```bash
cd /var/www/vvv-frontpage
git add env/backend.env
git commit -m "chore: update backend env on server"
git pull origin main
```

**Option C: Discard changes** (if you don't need them):
```bash
cd /var/www/vvv-frontpage
git checkout -- env/backend.env
git pull origin main
```

### Step 2: Fix Docker Authentication

**Option A: Use GitHub Actions token** (if available):
The deployment workflow should handle this automatically, but if you need to do it manually:

1. Create a GitHub Personal Access Token (PAT):
   - Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `read:packages` permission
   - Copy the token

2. Use it to login:
```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

**Option B: Let GitHub Actions handle it** (recommended):
- The deployment workflow should authenticate automatically
- Check if the deploy job actually ran in GitHub Actions

### Step 3: Pull Latest Code and Images

After fixing git and docker auth:

```bash
cd /var/www/vvv-frontpage

# Pull latest code (after handling local changes)
git pull origin main

# Pull latest images (after docker login)
docker pull ghcr.io/vevevedk/vvv-backend:latest
docker pull ghcr.io/vevevedk/vvv-frontend:latest

# Restart services
docker-compose down
docker-compose up -d

# Verify
git log --oneline -1  # Should show: f32a3ad
docker-compose ps
```

---

## Quick Fix (Recommended)

**On server, run**:

```bash
cd /var/www/vvv-frontpage

# Stash local env changes
git stash

# Pull latest code
git pull origin main

# Restore env changes (if needed)
git stash pop

# Restart services (will use existing images for now)
docker-compose restart

# Verify code is updated
git log --oneline -1
```

**Note**: The Docker images are already built and pushed. The services will use the code from the latest commit. If you need the latest Docker images, you'll need to authenticate with GHCR first.

---

## Alternative: Let GitHub Actions Deploy

Instead of manual deployment, check if the GitHub Actions workflow can deploy:

1. Go to: Actions → "Deploy to Production #37"
2. Check if "deploy" job completed or is waiting for approval
3. If waiting, approve it
4. The workflow will handle everything automatically

---

## Verify Deployment

After pulling code:

```bash
# Should show: f32a3ad
git log --oneline -1

# Services should be running
docker-compose ps

# Check if new code is active
# (the ESLint fix should be in the codebase now)
```
