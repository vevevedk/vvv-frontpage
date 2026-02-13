# Minimal Initial Setup for GitHub Actions Deployment

**Good news**: GitHub Actions can handle most of the initial setup automatically! You only need to do a few manual steps.

---

## ✅ What GitHub Actions Will Do Automatically

When you trigger the first deployment, the workflow will:

1. ✅ **Clone the repository** (if not already present)
2. ✅ **Create environment files** from examples (you'll need to edit them)
3. ✅ **Setup Nginx configuration** (if not already done)
4. ✅ **Build and push Docker images**
5. ✅ **Deploy to server**
6. ✅ **Start services**

---

## 🔧 Minimal Manual Setup Required

You only need to do these **one-time** steps:

### Step 1: Ensure Directory Exists (Usually Already Done)

The server should already have `/var/www/vvv-frontpage` created, but verify:

```bash
ssh vvv-web-deploy@143.198.105.78
ls -la /var/www/vvv-frontpage
```

If it doesn't exist, create it:
```bash
sudo mkdir -p /var/www/vvv-frontpage
sudo chown vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage
```

### Step 2: Trigger First Deployment

**Option A: Push to main branch**
```bash
git push origin main
```

**Option B: Manual workflow trigger**
- Go to GitHub → Actions tab
- Select "Deploy to Production" workflow
- Click "Run workflow" → "Run workflow"

### Step 3: Edit Environment Files (After First Deployment)

After the first deployment runs, SSH to the server and edit the environment files:

```bash
ssh vvv-web-deploy@143.198.105.78
cd /var/www/vvv-frontpage
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

### Step 4: Restart Services

After updating environment files:

```bash
cd /var/www/vvv-frontpage
docker-compose down
docker-compose up -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser  # Optional
```

### Step 5: Setup SSL (After DNS Update)

Once DNS points to the server:

```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

---

## 🚀 That's It!

After these steps:
- ✅ GitHub Actions will handle all future deployments automatically
- ✅ Just push to `main` branch and it deploys
- ✅ No manual steps needed for regular deployments

---

## 📝 Summary

**Minimal setup:**
1. Verify `/var/www/vvv-frontpage` exists (usually pre-configured)
2. Trigger GitHub Actions deployment (push or manual trigger)
3. Edit environment files with real values
4. Restart services
5. Setup SSL after DNS update

**Total manual work: ~10 minutes** (mostly editing env files)

---

## ⚠️ Important Notes

- The first deployment will create env files from examples - **you must edit them** with real values
- Environment files contain secrets - never commit them to the repo
- After editing env files, restart services to pick up changes
- SSL setup requires DNS to point to the server first

---

**This is the simplest approach - let GitHub Actions do the heavy lifting!**


