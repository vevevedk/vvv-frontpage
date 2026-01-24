# Staging Environment Setup Guide

## Overview

This guide explains how to set up a staging environment for testing changes before deploying to production.

**Workflow**:
1. **Develop** → Push to `staging` branch → Deploys to staging environment
2. **Test** → Run smoke tests on staging
3. **Approve** → Merge to `main` → Deploys to production (after staging approval)

---

## 🏗️ Architecture

### Staging Environment
- **Directory**: `/var/www/vvv-frontpage-staging`
- **Frontend Port**: `3001` (production uses `3000`)
- **Backend Port**: `8002` (production uses `8001`)
- **Docker Images**: Tagged with `staging-latest` and `staging-<sha>`
- **Subdomain**: `staging.veveve.io` (optional, can test via IP:port)

### Production Environment
- **Directory**: `/var/www/vvv-frontpage`
- **Frontend Port**: `3000`
- **Backend Port**: `8001`
- **Docker Images**: Tagged with `latest`
- **Domains**: `veveve.io`, `veveve.dk`

---

## 📋 Setup Steps

### 1. Create Staging Branch

```bash
# Create and push staging branch
git checkout -b staging
git push -u origin staging
```

### 2. Configure GitHub Secrets (if needed)

**Required Secrets** (should already exist):
- `SSH_HOST` - Server IP (143.198.105.78)
- `SSH_USER` - SSH user (vvv-web-deploy)
- `SSH_PRIVATE_KEY` - SSH private key
- `SSH_PORT` - SSH port (22)

**Optional Staging Secrets**:
- `NEXT_PUBLIC_API_URL_STAGING` - Staging API URL (defaults to `/api`)
- `NEXT_PUBLIC_APP_URL_STAGING` - Staging app URL (defaults to `https://staging.veveve.io`)

### 3. Set Up Staging Directory on Server

**On the server**:
```bash
# Create staging directory
sudo mkdir -p /var/www/vvv-frontpage-staging
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage-staging

# Clone staging branch
cd /var/www/vvv-frontpage-staging
git clone -b staging https://github.com/vevevedk/vvv-frontpage.git .
```

### 4. Create Staging Environment Files

```bash
cd /var/www/vvv-frontpage-staging

# Copy production env files as starting point
cp /var/www/vvv-frontpage/env/backend.env env/backend.staging.env
cp /var/www/vvv-frontpage/env/frontend.env env/frontend.staging.env

# Edit staging-specific values
nano env/backend.staging.env
# Update ALLOWED_HOSTS to include staging.veveve.io
# Update CORS_ALLOWED_ORIGINS to include https://staging.veveve.io

nano env/frontend.staging.env
# Update NEXT_PUBLIC_APP_URL to https://staging.veveve.io
# Update NEXT_PUBLIC_API_URL to /api (relative)
```

### 5. Create Staging Docker Compose Override

**File**: `docker-compose.staging.yml`
```yaml
version: '3.8'
services:
  backend:
    image: ghcr.io/vevevedk/vvv-backend:staging-latest
    ports:
      - "8002:8000"  # Different port for staging
    env_file:
      - ./env/backend.staging.env
  frontend:
    image: ghcr.io/vevevedk/vvv-frontend:staging-latest
    ports:
      - "3001:3000"  # Different port for staging
    env_file:
      - ./env/frontend.staging.env
```

### 6. Configure Staging Subdomain (Optional)

**In DigitalOcean DNS**:
- Add A record: `staging` → `143.198.105.78`

**In Nginx** (on server):
```bash
# Create staging Nginx config
sudo cp /var/www/vvv-frontpage-staging/deploy/veveve-io.conf /etc/nginx/sites-available/staging-veveve-io
sudo nano /etc/nginx/sites-available/staging-veveve-io
# Update server_name to staging.veveve.io
# Update proxy_pass ports to 3001 and 8002
# Update SSL certificate paths if using separate cert

# Enable staging site
sudo ln -s /etc/nginx/sites-available/staging-veveve-io /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL certificate for staging
sudo certbot --nginx -d staging.veveve.io
```

---

## 🔄 Workflow Process

### Development → Staging

1. **Create feature branch**:
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push to staging**:
   ```bash
   git checkout staging
   git merge feature/my-feature
   git push origin staging
   ```

4. **GitHub Actions automatically**:
   - Builds Docker images with `staging-latest` tag
   - Deploys to staging environment
   - Runs smoke tests

5. **Review staging deployment**:
   - Check GitHub Actions workflow results
   - Visit `https://staging.veveve.io` (if configured)
   - Or test via server IP:port

### Staging → Production

1. **After staging tests pass**:
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

2. **GitHub Actions automatically**:
   - Builds Docker images with `latest` tag
   - Deploys to production
   - Runs health checks

3. **Monitor production deployment**:
   - Check GitHub Actions workflow
   - Verify `https://veveve.io` and `https://veveve.dk`

---

## 🧪 Smoke Tests

### Automated Smoke Tests

The staging workflow includes automated smoke tests:

1. **Frontend Accessibility**
   - Tests if frontend is accessible
   - Checks HTTP 200 status

2. **Domain Routing**
   - Tests veveve.io shows English PPC content
   - Tests veveve.dk shows Danish content

3. **Login Redirects**
   - Tests veveve.dk/login redirects to veveve.io/login

4. **API Endpoints**
   - Tests `/api/test/` endpoint
   - Tests health endpoints

5. **SSL Certificates**
   - Verifies SSL certificates are valid

6. **HTTPS Redirects**
   - Tests HTTP to HTTPS redirects

7. **Performance**
   - Checks response times (< 3s)

### Manual Smoke Tests

**Run manually**:
```bash
# Test frontend
curl -I https://staging.veveve.io
# or
curl -I http://143.198.105.78:3001

# Test API
curl https://staging.veveve.io/api/test/
# or
curl http://143.198.105.78:8002/api/test/

# Test domain routing
curl https://veveve.io | grep -i "PPC"
curl https://veveve.dk | grep -i "Danish\|Dansk"
```

---

## 📊 GitHub Actions Workflows

### 1. Staging Workflow (`.github/workflows/staging.yml`)

**Triggers**:
- Push to `staging` or `develop` branch
- Pull request to `main`
- Manual workflow dispatch

**Jobs**:
1. **build-and-push**: Builds and pushes staging Docker images
2. **deploy-staging**: Deploys to staging environment
3. **smoke-tests**: Runs comprehensive smoke tests

### 2. Production Workflow (`.github/workflows/deploy.yml`)

**Triggers**:
- Push to `main` branch
- Manual workflow dispatch

**Jobs**:
1. **build-and-push**: Builds and pushes production Docker images
2. **deploy**: Deploys to production
3. **health-check**: Runs health checks

### 3. Smoke Tests Workflow (`.github/workflows/smoke-tests.yml`)

**Triggers**:
- Manual workflow dispatch

**Purpose**: Run smoke tests on any environment

---

## 🔒 Environment Protection Rules

### Recommended GitHub Settings

1. **Staging Environment**:
   - No protection rules (auto-deploy on push)
   - Allows testing without approval

2. **Production Environment**:
   - **Required reviewers**: At least 1 approval
   - **Wait timer**: 0 minutes (or set delay if needed)
   - **Deployment branches**: Only `main` branch

**To configure**:
1. Go to: Repository → Settings → Environments
2. Create/Edit "production" environment
3. Add required reviewers
4. Set deployment branch restrictions

---

## 🚨 Rollback Process

### Staging Rollback

```bash
# On server
cd /var/www/vvv-frontpage-staging
git checkout <previous-commit>
docker-compose -f docker-compose.yml -f docker-compose.staging.yml pull
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
```

### Production Rollback

```bash
# On server
cd /var/www/vvv-frontpage
git checkout <previous-commit>
docker-compose pull
docker-compose up -d
```

---

## 📝 Best Practices

1. **Always test in staging first**
   - Never push directly to `main`
   - Use `staging` branch for testing

2. **Run smoke tests before merging**
   - Verify all critical functionality
   - Check domain routing
   - Test API endpoints

3. **Review staging deployment**
   - Check GitHub Actions logs
   - Test manually if needed
   - Get team approval before merging to `main`

4. **Monitor production after deployment**
   - Watch GitHub Actions workflow
   - Check application logs
   - Monitor error rates

---

## 🔍 Troubleshooting

### Staging Not Deploying

**Check**:
- Staging branch exists and is pushed
- GitHub Actions workflow is enabled
- SSH secrets are configured
- Server has staging directory

### Smoke Tests Failing

**Check**:
- Services are running: `docker-compose ps`
- Ports are not conflicting
- Environment files are correct
- DNS/subdomain is configured (if using staging.veveve.io)

### Port Conflicts

**If ports are in use**:
- Check what's using the ports: `sudo netstat -tlnp | grep -E '3001|8002'`
- Stop conflicting services
- Or change ports in `docker-compose.staging.yml`

---

## ✅ Checklist

### Initial Setup
- [ ] Create `staging` branch
- [ ] Push `staging` branch to GitHub
- [ ] Create staging directory on server
- [ ] Create staging environment files
- [ ] Create `docker-compose.staging.yml`
- [ ] Configure staging subdomain (optional)
- [ ] Set up SSL for staging subdomain (optional)
- [ ] Configure GitHub environment protection rules

### Before Each Deployment
- [ ] Test changes locally
- [ ] Push to `staging` branch
- [ ] Verify staging deployment succeeds
- [ ] Run smoke tests
- [ ] Review staging environment
- [ ] Get approval (if required)
- [ ] Merge to `main`

---

**Next Steps**: Create `staging` branch and push to trigger first staging deployment!
