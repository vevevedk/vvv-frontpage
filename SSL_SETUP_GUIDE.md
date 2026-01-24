# SSL Certificate Setup Guide

This guide explains how to set up SSL certificates for `veveve.dk` using Let's Encrypt and certbot.

## Quick Start

The easiest way to set up SSL is to use the automated script:

```bash
# On the server (143.198.105.78)
cd /var/www/vvv-frontpage
sudo bash scripts/setup-ssl.sh
```

This script will:
- ✅ Check if certbot is installed (installs if needed)
- ✅ Verify DNS is pointing to the server
- ✅ Check Nginx configuration
- ✅ Install SSL certificates for `veveve.dk` and `www.veveve.dk`
- ✅ Configure Nginx automatically for HTTPS
- ✅ Set up automatic renewal
- ✅ Test the HTTPS connection

## Prerequisites

Before running the SSL setup:

1. **DNS must be configured**: Both `veveve.dk` and `www.veveve.dk` must point to `143.198.105.78`
   ```bash
   dig veveve.dk +short
   # Should return: 143.198.105.78
   ```

2. **Nginx must be running**: 
   ```bash
   sudo systemctl status nginx
   # If not running: sudo systemctl start nginx
   ```

3. **Port 80 must be open**: Required for Let's Encrypt HTTP-01 challenge
   ```bash
   sudo netstat -tlnp | grep :80
   # Or: sudo ss -tlnp | grep :80
   ```

4. **HTTP must be working**: The site should be accessible via HTTP before setting up HTTPS
   ```bash
   curl -I http://veveve.dk
   # Should return: HTTP/1.1 200 OK
   ```

## Manual Setup

If you prefer to set up SSL manually:

### Step 1: Install Certbot

```bash
# Update package list
sudo apt update

# Install certbot and nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### Step 2: Configure SSL

```bash
# Run certbot to configure SSL
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

Certbot will:
- Request SSL certificates from Let's Encrypt
- Automatically update your Nginx configuration to include HTTPS
- Set up automatic HTTP to HTTPS redirect
- Configure automatic certificate renewal

### Step 3: Verify SSL

```bash
# Test HTTPS connection
curl -I https://veveve.dk
# Should return: HTTP/2 200 (or 301/302 for redirects)

# Check certificate details
sudo certbot certificates

# Test auto-renewal (dry-run)
sudo certbot renew --dry-run
```

## Automatic Renewal

Certbot sets up automatic renewal via systemd timer:

```bash
# Check if auto-renewal is enabled
sudo systemctl status certbot.timer

# Enable auto-renewal (if not already enabled)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal (dry-run)
sudo certbot renew --dry-run
```

Certificates expire every 90 days, but auto-renewal handles this automatically. Let's Encrypt recommends renewing certificates when they're within 30 days of expiration.

## After SSL Setup

Once SSL is configured, you should:

1. **Update backend environment variables** (if needed):
   ```bash
   # Edit env/backend.env
   cd /var/www/vvv-frontpage
   nano env/backend.env
   ```

   Set:
   ```
   SECURE_SSL_REDIRECT=True
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   ```

2. **Recreate backend container** to apply new settings:
   ```bash
   docker-compose up -d --force-recreate backend
   ```

3. **Test the website**:
   - Frontend: https://veveve.dk
   - API health: https://veveve.dk/api/health
   - Admin: https://veveve.dk/admin/

## Troubleshooting

### Certbot installation fails

If certbot installation fails, check:
- Internet connection: `ping 8.8.8.8`
- Package list: `sudo apt update`
- Repository access: `sudo apt list --upgradable`

### DNS verification fails

If certbot can't verify domain ownership:
- Check DNS: `dig veveve.dk +short`
- Wait for DNS propagation (can take up to 48 hours, usually much faster)
- Verify domain points to server: `curl -I http://veveve.dk`

### Port 80 not accessible

If certbot can't reach port 80:
- Check Nginx is running: `sudo systemctl status nginx`
- Check firewall allows port 80: `sudo ufw status` (if using ufw)
- Verify Nginx listens on port 80: `sudo netstat -tlnp | grep :80`

### Certificate already exists

If certificates already exist:
- View certificates: `sudo certbot certificates`
- Renew manually: `sudo certbot renew`
- Force renewal: `sudo certbot renew --force-renewal`

### Nginx configuration errors

If Nginx config has errors after certbot:
```bash
# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restore from backup (certbot creates backups)
sudo certbot --nginx -d veveve.dk -d www.veveve.dk --dry-run
```

## Certificate Location

After setup, certificates are stored at:

```
/etc/letsencrypt/live/veveve.dk/
├── cert.pem         # Certificate
├── chain.pem        # Certificate chain
├── fullchain.pem    # Full certificate chain (cert + chain)
└── privkey.pem      # Private key
```

**Important**: Keep these files secure! Never share the private key.

## Additional Resources

- Let's Encrypt Documentation: https://letsencrypt.org/docs/
- Certbot Documentation: https://certbot.eff.org/docs/
- Nginx SSL Configuration: https://nginx.org/en/docs/http/configuring_https_servers.html
