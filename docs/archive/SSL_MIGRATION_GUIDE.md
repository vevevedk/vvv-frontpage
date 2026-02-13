# SSL Certificate Setup Guide - Migration Process

This guide documents the complete process for setting up SSL certificates on a production server using Let's Encrypt and certbot. This process was successfully used for `veveve.dk` migration.

**Target Server**: vvv-app-web-v02 (143.198.105.78)  
**Domain**: veveve.dk, www.veveve.dk  
**Date**: January 2026

---

## Prerequisites

Before starting, ensure:

1. **DNS is configured**: Domain must point to the server IP
   ```bash
   dig veveve.dk +short
   # Should return: 143.198.105.78
   ```

2. **Nginx is installed and running**:
   ```bash
   sudo systemctl status nginx
   # If not running: sudo systemctl start nginx
   ```

3. **HTTP is working**: Website should be accessible via HTTP
   ```bash
   curl -I http://veveve.dk
   # Should return: HTTP/1.1 200 OK
   ```

4. **Port 80 is open**: Required for Let's Encrypt HTTP-01 challenge
   ```bash
   sudo netstat -tlnp | grep :80
   # Or: sudo ss -tlnp | grep :80
   ```

5. **Nginx configuration exists**: Site config should be in `/etc/nginx/sites-available/`

---

## Step-by-Step Process

### Step 1: Install Certbot

```bash
# Update package list
sudo apt update

# Install certbot and nginx plugin
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

**Expected output**: Certbot version (e.g., `certbot 2.9.0`)

---

### Step 2: Prepare Nginx Configuration

**Important**: The nginx configuration must include an ACME challenge location block BEFORE running certbot.

#### 2.1: Create Certbot Directory

```bash
# Create the webroot directory for ACME challenges
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
sudo chmod -R 755 /var/www/certbot
```

#### 2.2: Add ACME Challenge Location Block

Edit your nginx configuration file:

```bash
# Find your nginx config file
sudo ls -la /etc/nginx/sites-available/ | grep -E "vvv|veveve"

# Edit the config (replace 'vvv-frontpage' with your actual filename)
sudo vim /etc/nginx/sites-available/vvv-frontpage
```

In the nginx config, find the `server` block and add this location block **immediately after** the `server_name` line (before any other `location` blocks):

```nginx
server {
    server_name veveve.dk www.veveve.dk;
    
    # Let's Encrypt HTTP-01 challenge (must be before other location blocks)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    # Other location blocks...
    location /api/ {
        ...
    }
    ...
}
```

**Critical**: The ACME challenge location block must be:
- Inside the `server { ... }` block
- After the `server_name` line
- Before any other location blocks
- NOT in a commented section

#### 2.3: Test and Reload Nginx

```bash
# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

**Expected output**: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

---

### Step 3: Run Certbot

#### Option A: Interactive Mode (Recommended for first time)

```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk
```

Certbot will prompt for:
1. **Email address**: Enter your email for renewal notifications
2. **Terms of service**: Agree (type 'Y')
3. **Redirect HTTP to HTTPS**: Choose option 2 (redirect)

#### Option B: Non-Interactive Mode (For automation)

```bash
sudo certbot --nginx -d veveve.dk -d www.veveve.dk \
  --non-interactive \
  --agree-tos \
  --redirect \
  --email your-email@example.com
```

Replace `your-email@example.com` with your actual email address.

---

### Step 4: Verify SSL Installation

#### 4.1: Check Certificate Status

```bash
# View certificate details
sudo certbot certificates

# Expected output shows:
# - Certificate path: /etc/letsencrypt/live/veveve.dk/
# - Expiration date
# - Domains covered
```

#### 4.2: Test HTTPS Connection

```bash
# Test HTTPS (should return 200 OK)
curl -I https://veveve.dk

# Test HTTP redirect (should return 301 redirecting to HTTPS)
curl -I http://veveve.dk

# Expected: Location: https://veveve.dk/
```

#### 4.3: Test in Browser

- Visit `https://veveve.dk` in a browser
- Check for the padlock icon in the address bar
- Verify the site loads correctly

---

### Step 5: Verify Auto-Renewal

Certbot automatically sets up renewal, but verify it's configured:

```bash
# Check if auto-renewal timer is enabled
sudo systemctl status certbot.timer

# Test renewal (dry-run)
sudo certbot renew --dry-run
```

**Expected output**: `Congratulations, all renewals succeeded`

---

## Troubleshooting

### Issue 1: Certbot Installation Fails

**Symptoms**: `certbot: command not found` or package installation errors

**Solution**:
```bash
# Update package list
sudo apt update

# Try installing again
sudo apt install -y certbot python3-certbot-nginx

# If still failing, check internet connection
ping 8.8.8.8
```

---

### Issue 2: Nginx Configuration Syntax Error

**Symptoms**: 
```
nginx: configuration file /etc/nginx/nginx.conf test failed
"location" directive is not allowed here
```

**Causes**:
- ACME challenge location block added in wrong place (outside server block)
- Location block in commented section
- Duplicate location blocks

**Solution**:
1. Restore from backup:
   ```bash
   sudo cp /etc/nginx/sites-available/vvv-frontpage.backup /etc/nginx/sites-available/vvv-frontpage
   ```

2. Check config structure:
   ```bash
   sudo cat /etc/nginx/sites-available/vvv-frontpage
   ```

3. Ensure ACME challenge block is:
   - Inside `server { ... }` block
   - After `server_name` line
   - Before other location blocks
   - Not duplicated

4. Test and reload:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

### Issue 3: Certbot Can't Verify Domain (404 Error)

**Symptoms**:
```
Certbot failed to authenticate some domains
Invalid response from http://veveve.dk/.well-known/acme-challenge/...
```

**Causes**:
- ACME challenge location block missing from nginx config
- Certbot directory doesn't exist or wrong permissions
- Port 80 not accessible

**Solution**:
1. Check ACME challenge location exists in nginx config:
   ```bash
   sudo grep -A 5 "\.well-known/acme-challenge" /etc/nginx/sites-available/vvv-frontpage
   ```

2. Verify certbot directory exists and has correct permissions:
   ```bash
   sudo ls -la /var/www/certbot
   sudo mkdir -p /var/www/certbot
   sudo chown -R www-data:www-data /var/www/certbot
   ```

3. Verify port 80 is listening:
   ```bash
   sudo netstat -tlnp | grep :80
   ```

4. Test ACME challenge path manually:
   ```bash
   echo "test" | sudo tee /var/www/certbot/test.txt
   curl http://veveve.dk/.well-known/acme-challenge/test.txt
   sudo rm /var/www/certbot/test.txt
   ```

---

### Issue 4: Certificate Already Exists

**Symptoms**:
```
Certificate not yet due for renewal
You have an existing certificate...
```

**Solutions**:

**Option A**: Use existing certificate (recommended if valid)
```bash
# Just verify it's working
sudo certbot certificates
curl -I https://veveve.dk
```

**Option B**: Force renewal/reinstall
```bash
# Interactive - choose option 2 (Renew & replace)
sudo certbot --nginx -d veveve.dk -d www.veveve.dk

# Or force renewal
sudo certbot renew --force-renewal
```

---

### Issue 5: DNS Not Pointing to Server

**Symptoms**:
- Certbot can't verify domain
- DNS resolution shows different IP

**Solution**:
1. Check DNS:
   ```bash
   dig veveve.dk +short
   # Should return your server IP (143.198.105.78)
   ```

2. If DNS is wrong:
   - Update DNS A records to point to server IP
   - Wait for DNS propagation (can take up to 48 hours, usually much faster)
   - Re-run certbot after DNS propagates

---

## Common Nginx Configuration Patterns

### Pattern 1: HTTP Server (Before SSL)

```nginx
server {
    server_name example.com www.example.com;
    
    # Let's Encrypt HTTP-01 challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        try_files $uri =404;
    }
    
    # Your application locations
    location / {
        proxy_pass http://127.0.0.1:3000;
        # ... other proxy settings
    }
    
    listen 80;
}
```

### Pattern 2: HTTPS Server (After SSL - Certbot auto-generates this)

Certbot automatically modifies your config to:
- Add SSL certificate paths
- Add HTTPS server block
- Configure HTTP to HTTPS redirect

The final config will have both HTTP and HTTPS server blocks.

---

## Quick Reference Commands

```bash
# Install certbot
sudo apt update && sudo apt install -y certbot python3-certbot-nginx

# Create certbot directory
sudo mkdir -p /var/www/certbot && sudo chown -R www-data:www-data /var/www/certbot

# Get SSL certificate (interactive)
sudo certbot --nginx -d example.com -d www.example.com

# Get SSL certificate (non-interactive)
sudo certbot --nginx -d example.com -d www.example.com --non-interactive --agree-tos --redirect --email admin@example.com

# View certificates
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Test HTTPS
curl -I https://example.com

# Check auto-renewal status
sudo systemctl status certbot.timer
```

---

## Post-SSL Setup Checklist

After SSL is successfully configured:

- [x] HTTPS is accessible: `curl -I https://veveve.dk`
- [x] HTTP redirects to HTTPS: `curl -I http://veveve.dk` (should return 301)
- [x] Certificate is valid: `sudo certbot certificates`
- [x] Auto-renewal is enabled: `sudo systemctl status certbot.timer`
- [x] Website loads correctly in browser
- [ ] Test all application endpoints (API, admin, etc.)
- [ ] Update application environment variables if needed (SECURE_SSL_REDIRECT=True)
- [ ] Monitor certificate expiration date

---

## Notes for Other Teams

### Key Learnings

1. **ACME Challenge Location**: Must be added to nginx config BEFORE running certbot. This is often missed and causes authentication failures.

2. **Location Block Placement**: The ACME challenge location must be:
   - Inside the server block
   - After server_name
   - Before other location blocks
   - Not in comments

3. **DNS Must Be Correct**: Certbot requires DNS to point to the server IP. Check DNS before starting.

4. **Backup Config First**: Always create a backup of nginx config before modifications:
   ```bash
   sudo cp /etc/nginx/sites-available/site.conf /etc/nginx/sites-available/site.conf.backup
   ```

5. **Test Before Certbot**: Always test nginx config (`sudo nginx -t`) before running certbot.

### Time Estimates

- **Install certbot**: 2-3 minutes
- **Configure nginx**: 5-10 minutes (if issues occur)
- **Run certbot**: 1-2 minutes
- **Verification**: 2-3 minutes
- **Total**: ~15-20 minutes (if everything goes smoothly)

### Common Pitfalls

1. ❌ Running certbot before adding ACME challenge location to nginx
2. ❌ Adding location block in wrong place (outside server block or in comments)
3. ❌ Not testing nginx config before reloading
4. ❌ DNS not pointing to server
5. ❌ Port 80 not accessible

---

## Additional Resources

- **Let's Encrypt Documentation**: https://letsencrypt.org/docs/
- **Certbot Documentation**: https://certbot.eff.org/docs/
- **Nginx SSL Configuration**: https://nginx.org/en/docs/http/configuring_https_servers.html
- **Certbot Nginx Plugin**: https://eff-certbot.readthedocs.io/en/stable/using.html#nginx

---

## Support

If you encounter issues not covered in this guide:

1. Check certbot logs: `/var/log/letsencrypt/letsencrypt.log`
2. Check nginx error logs: `/var/log/nginx/error.log`
3. Run certbot with verbose output: `sudo certbot --nginx -d example.com -d www.example.com -v`
4. Review troubleshooting section above

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Tested On**: Ubuntu 24.04 (Noble), Nginx 1.24.0, Certbot 2.9.0
