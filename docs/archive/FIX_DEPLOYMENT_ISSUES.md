# Fix Current Deployment Issues

## Issues Found

1. ✅ **Containers are running** (frontend, backend, postgres, redis, worker)
2. ❌ **Beat service failing** - Database password authentication failed
3. ❌ **Nginx not installed** - Need to install and configure
4. ❌ **Environment files** - Need to configure database passwords

## Fix 1: Install Nginx

**On the server (as root or with sudo):**

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Fix 2: Configure Nginx

**Copy the Nginx config:**

```bash
cd /var/www/vvv-frontpage
sudo cp deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage
sudo ln -sf /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Fix 3: Configure Environment Files

**Check what environment files exist:**

```bash
cd /var/www/vvv-frontpage
ls -la env/
cat env/backend.env.example
```

**Create/update environment files with correct database passwords:**

The database password error suggests the environment variables don't match. Check:
- `env/backend.env` - Should have `POSTGRES_PASSWORD` matching what's in docker-compose.yml
- Or check `docker-compose.yml` for the database password

**Quick fix - check docker-compose.yml:**

```bash
cd /var/www/vvv-frontpage
grep -i password docker-compose.yml
```

The password in the environment file must match what's in docker-compose.yml.

## Fix 4: Restart Services

After fixing environment files:

```bash
cd /var/www/vvv-frontpage
docker-compose down
docker-compose up -d
docker-compose ps
```

## Test After Fixes

```bash
# Test frontend locally
curl http://localhost:3000

# Test backend
curl http://localhost:8001/api/health/

# Test via Nginx (after setup)
curl http://localhost
```


