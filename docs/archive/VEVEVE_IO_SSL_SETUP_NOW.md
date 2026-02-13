# veveve.io SSL Setup - Ready to Proceed

**Status**: ✅ DigitalOcean DNS is correct (`143.198.105.78`)  
**Action**: Set up SSL certificate

---

## ✅ Why We Can Proceed

- **DigitalOcean DNS is correct**: `dig @ns1.digitalocean.com veveve.io` returns `143.198.105.78` ✅
- **Let's Encrypt queries authoritative nameservers**: Will use DigitalOcean, not your local DNS
- **Global propagation still happening**: Normal, but doesn't block SSL setup

---

## 🔒 SSL Setup Steps

### Step 1: SSH to Server

```bash
ssh vvv-web-deploy@143.198.105.78
# or use your SSH key
```

### Step 2: Verify Certbot Directory

```bash
# Ensure certbot directory exists (should already exist from veveve.dk)
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
sudo chmod -R 755 /var/www/certbot
```

### Step 3: Verify Nginx Configuration

```bash
# Check that veveve-io config exists
ls -la /etc/nginx/sites-available/veveve-io

# Check that ACME challenge location is configured
grep -A 3 "acme-challenge" /etc/nginx/sites-available/veveve-io
```

**Should show**:
```
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
    try_files $uri =404;
}
```

### Step 4: Test Nginx Configuration

```bash
sudo nginx -t
```

**Expected**: `nginx: configuration file /etc/nginx/nginx.conf test is successful`

### Step 5: Run Certbot

```bash
sudo certbot --nginx -d veveve.io -d www.veveve.io
```

**What to expect**:
- Certbot will ask for email (or use existing account)
- Certbot will verify domain ownership via HTTP-01 challenge
- Certbot will automatically configure Nginx for HTTPS
- Certbot will set up HTTP to HTTPS redirect

**If successful**, you'll see:
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/veveve.io/fullchain.pem
Certbot has set up a scheduled task to automatically renew this certificate.
```

---

## 🚨 If Certbot Fails

### Error: "Invalid response from http://veveve.io/.well-known/acme-challenge/...: 404"

**Possible causes**:
1. DNS not fully propagated (Let's Encrypt can't reach your server)
2. Nginx not running or misconfigured
3. Firewall blocking port 80

**Solutions**:
1. **Wait 30-60 minutes** for more DNS propagation, then retry
2. **Check Nginx is running**: `sudo systemctl status nginx`
3. **Check port 80 is open**: `sudo netstat -tlnp | grep :80`
4. **Test ACME challenge manually**:
   ```bash
   # Create test file
   sudo mkdir -p /var/www/certbot/.well-known/acme-challenge
   echo "test" | sudo tee /var/www/certbot/.well-known/acme-challenge/test
   
   # Test from server
   curl http://localhost/.well-known/acme-challenge/test
   # Should return: test
   
   # Test from external (if DNS is working)
   curl http://veveve.io/.well-known/acme-challenge/test
   # Should return: test
   ```

### Error: "DNS problem: NXDOMAIN looking up A for veveve.io"

**Cause**: Let's Encrypt can't resolve the domain

**Solution**: Wait longer for DNS propagation, then retry

---

## ✅ After SSL is Set Up

### 1. Test HTTPS

```bash
# Test HTTPS
curl -I https://veveve.io
# Should show: 200 OK with SSL certificate

# Test HTTP redirect
curl -I http://veveve.io
# Should show: 301 redirect to https://veveve.io
```

### 2. Update Backend Configuration

```bash
cd /var/www/vvv-frontpage
bash scripts/update-veveve-io-backend.sh
docker-compose restart django
# or
docker compose restart django
```

### 3. Test Everything

```bash
# Test API endpoint
curl https://veveve.io/api/health
# Should return: health check response

# Test in browser
# Visit: https://veveve.io
# Should show: English frontpage
```

---

## 📋 Quick Checklist

- [ ] SSH to server
- [ ] Verify certbot directory exists
- [ ] Verify Nginx config has ACME challenge location
- [ ] Test Nginx config: `sudo nginx -t`
- [ ] Run certbot: `sudo certbot --nginx -d veveve.io -d www.veveve.io`
- [ ] Test HTTPS: `curl -I https://veveve.io`
- [ ] Update backend: `bash scripts/update-veveve-io-backend.sh`
- [ ] Test API: `curl https://veveve.io/api/health`
- [ ] Test in browser: Visit `https://veveve.io`

---

**Ready to proceed?** SSH to the server and run the certbot command. If it fails due to DNS, wait 30-60 minutes and try again.
