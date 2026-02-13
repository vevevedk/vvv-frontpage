# veveve.io Nginx Setup - Server Commands

**Issue**: Config file not on server yet  
**Solution**: Create it directly on server

---

## Quick Setup Commands

Run these commands on the server:

```bash
# Create the Nginx config file directly
sudo tee /etc/nginx/sites-available/veveve-io > /dev/null << 'EOF'
# Nginx Configuration for veveve.io
# Server: 143.198.105.78
# Domain: veveve.io, www.veveve.io
# Application: /var/www/vvv-frontpage (shared with veveve.dk)

server {
    server_name veveve.io www.veveve.io;

    # Let's Encrypt HTTP-01 challenge (must be before other location blocks)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }

    # API/admin -> Django backend (Docker) on 8001
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }

    location /admin/ {
        proxy_pass http://127.0.0.1:8001/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Health endpoint
    location = /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 "veveve-io healthy\n";
    }

    # Frontend (Next.js) on 3000
    # Next.js middleware will handle domain-based routing
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    listen 80;
    # SSL will be configured by certbot after DNS is updated
}

# Redirect HTTP to HTTPS (after SSL is configured)
# Uncomment after running certbot:
# server {
#     server_name veveve.io www.veveve.io;
#     listen 80;
#     return 301 https://$host$request_uri;
# }
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/veveve-io /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Alternative: Pull Latest Code (if file is committed)

If you've committed and pushed the file to git:

```bash
cd /var/www/vvv-frontpage
git pull origin main
sudo cp deploy/veveve-io.conf /etc/nginx/sites-available/veveve-io
sudo ln -s /etc/nginx/sites-available/veveve-io /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## After Nginx is Set Up

Once Nginx is configured and reloaded:

1. **Test HTTP**:
   ```bash
   curl -I http://veveve.io
   ```

2. **Set up SSL**:
   ```bash
   sudo certbot --nginx -d veveve.io -d www.veveve.io
   ```

3. **Test HTTPS**:
   ```bash
   curl -I https://veveve.io
   ```
