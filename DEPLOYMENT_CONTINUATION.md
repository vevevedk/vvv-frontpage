# Deployment Continuation Guide

**Current Status**: Build fixes applied, waiting for successful build  
**Next**: Configure server after deployment completes

---

## 🔍 Step 1: Verify Build Success

Check GitHub Actions:
1. Go to: https://github.com/vevevedk/vvv-frontpage/actions
2. Find latest "Deploy to Production" workflow
3. Verify:
   - ✅ "Build and Push Docker Images" job succeeded
   - ✅ "Deploy to Server" job succeeded
   - ✅ "Health Check" job (if it runs)

---

## 🚀 Step 2: SSH to Server and Verify Deployment

```bash
ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78
cd /var/www/vvv-frontpage

# Check if repo was cloned
ls -la

# Check Docker services
docker-compose ps

# Check logs
docker-compose logs --tail=50
```

**Expected:**
- Repository should be cloned
- Environment files should exist (from examples)
- Docker services may not be running yet (need env config)

---

## ⚙️ Step 3: Configure Environment Files

### Backend Environment (`env/backend.env`)

```bash
nano env/backend.env
```

**Required values:**
```bash
# Django Settings
DJANGO_SECRET_KEY=<generate-secure-random-key>
DJANGO_SETTINGS_MODULE=api.settings.prod
ALLOWED_HOSTS=veveve.dk,www.veveve.dk,143.198.105.78

# Database (Docker service names)
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=vvv_database
DATABASE_USER=vvv_user
DATABASE_PASSWORD=<secure-password>

# Redis
REDIS_URL=redis://redis:6379/0

# CORS (if needed)
CORS_ALLOWED_ORIGINS=https://veveve.dk,https://www.veveve.dk
CSRF_TRUSTED_ORIGINS=https://veveve.dk,https://www.veveve.dk
```

### Frontend Environment (`env/frontend.env`)

```bash
nano env/frontend.env
```

**Required values:**
```bash
# Application URLs
NEXT_PUBLIC_APP_URL=https://veveve.dk
NEXT_PUBLIC_API_URL=https://veveve.dk/api

# JWT Secret (must match backend if using shared auth)
JWT_SECRET=<generate-secure-random-key>

# Database (for API routes)
DB_HOST=postgres
DB_USER=vvv_user
DB_NAME=vvv_database
DB_PASSWORD=<same-as-backend>
DB_PORT=5432

# Node Environment
NODE_ENV=production
```

**Generate secure keys:**
```bash
# On server, generate random keys:
openssl rand -base64 32  # For DJANGO_SECRET_KEY
openssl rand -base64 32  # For JWT_SECRET
```

---

## 🐳 Step 4: Start Docker Services

```bash
cd /var/www/vvv-frontpage

# Start database and Redis first
docker-compose up -d postgres redis

# Wait for services to initialize
sleep 10

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs --tail=50
```

---

## 📊 Step 5: Run Database Migrations

```bash
# Run Django migrations
docker-compose exec backend python manage.py migrate --noinput

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Create superuser (optional, for admin access)
docker-compose exec backend python manage.py createsuperuser
```

---

## 🌐 Step 6: Configure Nginx

**As root (via DigitalOcean console):**

```bash
# Copy Nginx configuration
sudo cp /var/www/vvv-frontpage/deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage

# Enable site
sudo ln -s /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

**Or if deploy user has sudo:**
```bash
sudo cp deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage
sudo ln -s /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔒 Step 7: Setup SSL Certificate

**After DNS is updated to point to 143.198.105.78:**

```bash
# As root (via DO console)
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

**Or if deploy user has sudo:**
```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

---

## ✅ Step 8: Verify Deployment

### Check Services
```bash
# Docker services
docker-compose ps

# Test locally
curl http://localhost:3000
curl http://localhost:8001/api/health/

# Test externally (after DNS/SSL)
curl https://veveve.dk
curl https://veveve.dk/api/health
```

### Run Verification Script
```bash
cd /var/www/vvv-frontpage
bash scripts/verify-migration.sh veveve.dk
```

### Manual Checks
- [ ] Frontend loads: `https://veveve.dk`
- [ ] Landing page displays correctly
- [ ] API health endpoint: `https://veveve.dk/api/health`
- [ ] Login page works: `https://veveve.dk/login`
- [ ] No console errors in browser
- [ ] Database queries work

---

## 🔄 Step 9: Future Deployments

After initial setup, **GitHub Actions will handle all future deployments automatically**:

1. Push to `main` branch
2. GitHub Actions builds and deploys
3. No manual steps needed!

---

## 🆘 Troubleshooting

### Services Not Starting
```bash
# Check logs
docker-compose logs

# Check environment files
cat env/backend.env
cat env/frontend.env

# Restart services
docker-compose restart
```

### Database Connection Issues
```bash
# Check postgres is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;"

# Check credentials in env files
```

### Nginx 502 Bad Gateway
```bash
# Check services are running
docker-compose ps

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Verify ports
curl http://127.0.0.1:3000  # Frontend
curl http://127.0.0.1:8001/api/health/  # Backend
```

---

## 📝 Quick Reference

**Server**: 143.198.105.78  
**User**: vvv-web-deploy  
**Directory**: `/var/www/vvv-frontpage`  
**Domain**: veveve.dk

**Key Commands:**
```bash
# SSH to server
ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78

# Navigate to app
cd /var/www/vvv-frontpage

# Check services
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

---

**Ready to continue! Follow the steps above after the build completes.**


