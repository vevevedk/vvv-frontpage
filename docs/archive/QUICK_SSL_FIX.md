# Quick SSL Fix - Run on Web Server

## Step 1: SSH to the correct server
```bash
ssh vvv-web-deploy@143.198.105.78
```

## Step 2: Create certbot directory
```bash
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
sudo chmod -R 755 /var/www/certbot
```

## Step 3: Find and edit nginx config
```bash
# Find the config file
sudo ls -la /etc/nginx/sites-available/ | grep -E "vvv|veveve"

# Edit it (replace 'vvv-frontpage' with actual filename)
sudo nano /etc/nginx/sites-available/vvv-frontpage
```

## Step 4: Add ACME challenge location

In the nginx config file, find the `server` block that starts with:
```nginx
server {
    server_name veveve.dk www.veveve.dk;
```

**Add this block RIGHT AFTER the `server_name` line** (before any `location` blocks):

```nginx
    # Let's Encrypt HTTP-01 challenge (must be before other location blocks)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
```

The config should look like this:
```nginx
server {
    server_name veveve.dk www.veveve.dk;

    # Let's Encrypt HTTP-01 challenge (must be before other location blocks)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }

    # API/admin -> vvv-frontpage backend (Docker) on 8001
    location /api/ {
        proxy_pass http://127.0.0.1:8001/api/;
        ...
    }
    ...
}
```

## Step 5: Test and reload nginx
```bash
# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

## Step 6: Run certbot again
```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

## Alternative: Use standalone mode (if nginx plugin still fails)

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone -d veveve.dk -d www.veveve.dk

# Start nginx
sudo systemctl start nginx

# Then manually configure SSL in nginx config
```
