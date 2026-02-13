# Direct Deployment to vvv-app-web-v02

**Simpler approach**: Clone repo and deploy fresh (no migration export needed)

---

## 🚀 Quick Deployment Steps

### Step 1: Clone Repository on New Server

```bash
# SSH to new server
ssh vvv-web-deploy@143.198.105.78

# Clone repository
cd /var/www
sudo rm -rf vvv-frontpage  # Remove if exists
git clone <repository-url> vvv-frontpage
cd vvv-frontpage
```

### Step 2: Create Environment Files

```bash
# Copy example files
cp env/backend.env.example env/backend.env
cp env/frontend.env.example env/frontend.env

# Edit with your values
nano env/backend.env
nano env/frontend.env
```

**Required values for `env/backend.env`:**
```bash
DJANGO_SECRET_KEY=<generate-new-or-use-existing>
DJANGO_SETTINGS_MODULE=api.settings.prod
ALLOWED_HOSTS=veveve.dk,www.veveve.dk
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=vvv_database
DATABASE_USER=vvv_user
DATABASE_PASSWORD=<secure-password>
REDIS_URL=redis://redis:6379/0
```

**Required values for `env/frontend.env`:**
```bash
NEXT_PUBLIC_APP_URL=https://veveve.dk
NEXT_PUBLIC_API_URL=https://veveve.dk/api
JWT_SECRET=<generate-new-or-use-existing>
DB_HOST=postgres
DB_USER=vvv_user
DB_NAME=vvv_database
DB_PASSWORD=<same-as-backend>
DB_PORT=5432
```

### Step 3: Setup Nginx

```bash
# Copy Nginx configuration
sudo cp deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage

# Enable site
sudo ln -s /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 4: Start Docker Services

```bash
cd /var/www/vvv-frontpage

# Start database and Redis first
docker-compose up -d postgres redis

# Wait for services to initialize
sleep 10

# Start all services
docker-compose up -d

# Run migrations (creates database schema)
docker-compose exec -T backend python manage.py migrate --noinput

# Create superuser (optional, for admin access)
docker-compose exec -T backend python manage.py createsuperuser

# Collect static files
docker-compose exec -T backend python manage.py collectstatic --noinput

# Verify services
docker-compose ps
docker-compose logs --tail=50
```

### Step 5: Setup SSL (After DNS Update)

```bash
# Update DNS first: veveve.dk → 143.198.105.78
# Then run:
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

### Step 6: Verify Deployment

```bash
# Check services
docker-compose ps

# Test locally
curl http://localhost:3000
curl http://localhost:8001/api/health/

# Test externally (after DNS update)
curl https://veveve.dk
curl https://veveve.dk/api/health
```

---

## 🔄 If You Need Existing Data

If you need to transfer data from the old server:

### Option A: Database Only
```bash
# On old server: Export database
docker-compose exec -T postgres pg_dump -U vvv_user vvv_database > /tmp/database.sql

# Transfer to new server
scp /tmp/database.sql vvv-web-deploy@143.198.105.78:/tmp/

# On new server: Import database
cat /tmp/database.sql | docker-compose exec -T postgres psql -U vvv_user -d vvv_database
```

### Option B: Full Migration Script
```bash
# Use the migration script (if you want everything)
bash scripts/migrate-server.sh import /path/to/migration.tar.gz
```

---

## ✅ After Initial Deployment

Once deployed, **GitHub Actions will automatically handle future deployments**:

1. Push to `main` branch
2. GitHub Actions builds Docker images
3. Automatically deploys to server using configured secrets
4. No manual steps needed!

---

## 🎯 Summary

**For fresh deployment:**
- ✅ Clone repo
- ✅ Create env files
- ✅ Start Docker services
- ✅ Setup Nginx
- ✅ Done!

**For data migration:**
- Use migration script OR
- Export/import database only

---

**This is much simpler than the full migration process!**


