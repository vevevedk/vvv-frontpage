# Server Migration - Quick Reference

## 🚀 Quick Start

### On Old Server (Export)
```bash
cd /opt/vvv-frontpage  # or your app directory
bash scripts/migrate-server.sh export
# Follow instructions to transfer archive to new server
```

### On New Server (Import)
```bash
# Transfer archive first (scp, rsync, etc.)
cd /opt/vvv-frontpage
bash scripts/migrate-server.sh import /tmp/vvv-migration-*.tar.gz

# Review and update environment files
nano env/backend.env
nano env/frontend.env

# Start services
docker-compose up -d

# Verify
bash scripts/verify-migration.sh veveve.dk
```

---

## 📝 GitHub Actions Secrets Update

After migration, update these secrets in GitHub:

**Repository → Settings → Secrets and variables → Actions**

1. **SSH_HOST**: New server IP or hostname
2. **SSH_USER**: New server username  
3. **SSH_PRIVATE_KEY**: New server SSH private key
4. **SSH_PORT**: New server SSH port (default: 22)

### Generate SSH Key (if needed)
```bash
# On new server
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Copy private key to GitHub secret
cat ~/.ssh/github_actions
```

---

## 🔧 Environment Variables to Update

### `env/backend.env`
- `ALLOWED_HOSTS` - Update if domain changed
- `DATABASE_HOST` - Usually `postgres` (Docker service name)
- Any external API URLs

### `env/frontend.env`
- `NEXT_PUBLIC_APP_URL` - New server URL
- `NEXT_PUBLIC_API_URL` - New server API URL
- Any external service URLs

---

## 🌐 DNS Update

```bash
# Update A records for:
# - veveve.dk → new server IP
# - www.veveve.dk → new server IP

# Lower TTL before migration (300s) for faster cutover
# Verify propagation:
dig veveve.dk +short
```

---

## 🔒 SSL Certificate

```bash
# If domain already points to new server:
sudo certbot --nginx -d veveve.dk -d www.veveve.dk

# Verify:
sudo certbot certificates
```

---

## ✅ Verification Checklist

- [ ] All Docker services running: `docker-compose ps`
- [ ] Database accessible: `docker-compose exec postgres psql -U vvv_user -d vvv_database -c "SELECT 1;"`
- [ ] Frontend responds: `curl http://localhost:3000`
- [ ] Backend responds: `curl http://localhost:8001/api/health/`
- [ ] Nginx configured: `sudo nginx -t`
- [ ] HTTPS works: `curl https://veveve.dk`
- [ ] GitHub Actions secrets updated
- [ ] Test deployment via GitHub Actions

---

## 🆘 Common Issues

### Port Already in Use
```bash
sudo netstat -tulpn | grep -E ':(3000|8001)'
# Update docker-compose.yml ports if needed
```

### Database Connection Failed
```bash
# Check postgres is running
docker-compose ps postgres

# Check credentials in env/backend.env
# Verify database exists
docker-compose exec postgres psql -U vvv_user -l
```

### Nginx 502 Bad Gateway
```bash
# Check services are running
docker-compose ps

# Check nginx upstream config
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# Verify ports match
curl http://127.0.0.1:3000  # Frontend
curl http://127.0.0.1:8001/api/health/  # Backend
```

---

## 📞 Full Documentation

See [SERVER_MIGRATION_GUIDE.md](./SERVER_MIGRATION_GUIDE.md) for complete details.


