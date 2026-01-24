# Current Migration Status

**Date**: December 27, 2025  
**Server**: vvv-app-web-v02 (143.198.105.78)  
**User**: vvv-web-deploy

---

## ✅ Completed

- [x] GitHub Actions secrets configured
  - SSH_HOST: 143.198.105.78
  - SSH_USER: vvv-web-deploy
  - SSH_PRIVATE_KEY: Configured
  - SSH_PORT: 22

- [x] Server directory created
  - `/var/www/vvv-frontpage` created
  - Ownership: `vvv-web-deploy:vvv-web-deploy`
  - Permissions: Correct

- [x] GitHub Actions workflow updated
  - Configured for new server
  - Auto-clone on first deployment
  - Auto-setup Nginx config
  - Handles Docker deployment

---

## 📋 Next Steps

### 1. Trigger First Deployment

**Option A: Push to main**
```bash
# Make a small change and push
git add .
git commit -m "chore: trigger initial deployment to v02 server"
git push origin main
```

**Option B: Manual trigger**
- GitHub → Actions → "Deploy to Production"
- Click "Run workflow" → "Run workflow"

### 2. Monitor Deployment

Watch the GitHub Actions workflow:
- Build and push Docker images
- Deploy to server
- Clone repository (first time)
- Start services

### 3. Configure Environment Files

After first deployment completes, SSH to server:

```bash
ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78
cd /var/www/vvv-frontpage

# Edit environment files
nano env/backend.env
nano env/frontend.env
```

**Required values:**

`env/backend.env`:
```bash
DJANGO_SECRET_KEY=<generate-secure-key>
DJANGO_SETTINGS_MODULE=api.settings.prod
ALLOWED_HOSTS=veveve.dk,www.veveve.dk
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=vvv_database
DATABASE_USER=vvv_user
DATABASE_PASSWORD=<secure-password>
REDIS_URL=redis://redis:6379/0
```

`env/frontend.env`:
```bash
NEXT_PUBLIC_APP_URL=https://veveve.dk
NEXT_PUBLIC_API_URL=https://veveve.dk/api
JWT_SECRET=<generate-secure-key>
DB_HOST=postgres
DB_USER=vvv_user
DB_NAME=vvv_database
DB_PASSWORD=<same-as-backend>
DB_PORT=5432
```

### 4. Restart Services

After editing env files:

```bash
cd /var/www/vvv-frontpage
docker-compose down
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser  # Optional
```

### 5. Setup Nginx (if not auto-configured)

If Nginx wasn't auto-configured by the workflow:

```bash
# As root (via DO console)
sudo cp /var/www/vvv-frontpage/deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage
sudo ln -s /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Setup SSL (After DNS Update)

Once DNS points to 143.198.105.78:

```bash
# As root (via DO console)
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

### 7. Verify Deployment

```bash
# Check services
docker-compose ps

# Test locally
curl http://localhost:3000
curl http://localhost:8001/api/health/

# Test externally (after DNS)
curl https://veveve.dk
curl https://veveve.dk/api/health

# Run verification script
bash scripts/verify-migration.sh veveve.dk
```

---

## 🎯 Quick Action Items

1. **Trigger deployment** (push or manual trigger)
2. **Edit env files** after first deployment
3. **Restart services** with new env values
4. **Update DNS** to point to new server
5. **Setup SSL** after DNS propagates

---

## 📝 Notes

- The workflow will handle most setup automatically
- Environment files are the main manual step
- Nginx setup may need root access (via DO console)
- SSL setup requires DNS to be updated first

---

**Ready to proceed with deployment!**


