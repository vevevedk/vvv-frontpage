# Quick Update Backend Configuration

Run these commands on the server:

```bash
cd /var/www/vvv-frontpage

# Backup the file
cp env/backend.env env/backend.env.backup.$(date +%Y%m%d_%H%M%S)

# Update ALLOWED_HOSTS
sed -i 's/^ALLOWED_HOSTS=\(.*\)$/ALLOWED_HOSTS=\1,veveve.io,www.veveve.io/' env/backend.env

# Update CORS_ALLOWED_ORIGINS
sed -i 's|^CORS_ALLOWED_ORIGINS=\(.*\)$|CORS_ALLOWED_ORIGINS=\1,https://veveve.io,https://www.veveve.io|' env/backend.env

# Update CSRF_TRUSTED_ORIGINS
sed -i 's|^CSRF_TRUSTED_ORIGINS=\(.*\)$|CSRF_TRUSTED_ORIGINS=\1,https://veveve.io,https://www.veveve.io|' env/backend.env

# Verify the changes
grep -E '^(ALLOWED_HOSTS|CORS_ALLOWED_ORIGINS|CSRF_TRUSTED_ORIGINS)=' env/backend.env

# Restart backend
docker-compose restart backend
```

Expected output after updates:
```
ALLOWED_HOSTS=localhost,127.0.0.1,backend,veveve.dk,www.veveve.dk,143.198.105.78,veveve.io,www.veveve.io
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io
CSRF_TRUSTED_ORIGINS=https://veveve.dk,https://www.veveve.dk,https://veveve.io,https://www.veveve.io
```
