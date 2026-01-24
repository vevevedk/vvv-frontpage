# Deployment Next Steps - Quick Action Guide

**Status**: Build fixes applied, ready to continue deployment

---

## 🎯 Immediate Actions

### 1. Check Build Status (2 minutes)

**GitHub Actions:**
- Go to: https://github.com/vevevedk/vvv-frontpage/actions
- Check latest "Deploy to Production" workflow
- ✅ Build should succeed (TypeScript errors fixed)
- ✅ Deployment should clone repo automatically

**If build fails:** Share the error and I'll help fix it.

---

### 2. SSH to Server and Setup (5 minutes)

```bash
ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78
cd /var/www/vvv-frontpage
```

**Verify deployment:**
```bash
# Check if repo was cloned
ls -la

# Check if env files exist
ls -la env/
```

---

### 3. Setup Environment Files (5 minutes)

**Option A: Use setup script (recommended)**
```bash
cd /var/www/vvv-frontpage
bash scripts/setup-env-on-server.sh
```

**Option B: Manual setup**
```bash
# Copy templates
cp env/backend.prod.template env/backend.env
cp env/frontend.prod.template env/frontend.env

# Generate secure keys
openssl rand -base64 32  # For DJANGO_SECRET_KEY
openssl rand -base64 32  # For JWT_SECRET

# Edit files
nano env/backend.env
nano env/frontend.env
```

**Key values to set:**
- `DJANGO_SECRET_KEY` - Generate with `openssl rand -base64 32`
- `JWT_SECRET` - Generate with `openssl rand -base64 32`
- `DATABASE_PASSWORD` - Generate secure password
- `ALLOWED_HOSTS=veveve.dk,www.veveve.dk,143.198.105.78`
- `NEXT_PUBLIC_APP_URL=https://veveve.dk`
- `NEXT_PUBLIC_API_URL=https://veveve.dk/api`

---

### 4. Start Services (2 minutes)

```bash
cd /var/www/vvv-frontpage

# Start database and Redis
docker-compose up -d postgres redis
sleep 10

# Start all services
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs --tail=50
```

---

### 5. Run Migrations (1 minute)

```bash
docker-compose exec backend python manage.py migrate --noinput
docker-compose exec backend python manage.py collectstatic --noinput
```

---

### 6. Setup Nginx (3 minutes)

**As root (via DigitalOcean console):**
```bash
sudo cp /var/www/vvv-frontpage/deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage
sudo ln -s /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 7. Test Locally (2 minutes)

```bash
# Test frontend
curl http://localhost:3000

# Test backend
curl http://localhost:8001/api/health/
```

---

### 8. Setup SSL (After DNS Update)

**Once DNS points to 143.198.105.78:**
```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

---

## ✅ Verification Checklist

- [ ] Build succeeded in GitHub Actions
- [ ] Repository cloned to `/var/www/vvv-frontpage`
- [ ] Environment files created and configured
- [ ] Docker services running (`docker-compose ps`)
- [ ] Migrations applied
- [ ] Nginx configured and reloaded
- [ ] Local tests pass (curl commands)
- [ ] SSL certificate installed (after DNS)
- [ ] External access works (https://veveve.dk)

---

## 📋 Total Time Estimate

- **Setup**: ~20 minutes
- **Testing**: ~5 minutes
- **Total**: ~25 minutes

---

## 🆘 Quick Troubleshooting

**Services not starting?**
```bash
docker-compose logs
docker-compose restart
```

**Database connection failed?**
```bash
docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;"
```

**Nginx 502 error?**
```bash
sudo tail -f /var/log/nginx/error.log
curl http://127.0.0.1:3000  # Test frontend
curl http://127.0.0.1:8001/api/health/  # Test backend
```

---

**Ready to proceed! Start with Step 1 (checking build status).**


