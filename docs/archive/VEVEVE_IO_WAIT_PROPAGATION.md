# veveve.io - Waiting for DNS Propagation

**Status**: ✅ Nameservers updated correctly in GoDaddy  
**Next**: Wait for DNS propagation (15-60 minutes)

---

## ⏱️ Timeline

- **0-15 minutes**: Nameserver change propagates
- **15-30 minutes**: DNS starts resolving to DigitalOcean
- **30-60 minutes**: Most DNS servers updated
- **1-2 hours**: Full global propagation (usually faster)

---

## ✅ Verification Commands

### Check 1: Nameservers (15-30 minutes)

```bash
dig NS veveve.io +short
```

**Expected** (after propagation):
```
ns1.digitalocean.com.
ns2.digitalocean.com.
ns3.digitalocean.com.
```

**If you still see GoDaddy nameservers**: Wait a bit longer, then check again.

---

### Check 2: A Record (30-60 minutes)

```bash
dig veveve.io +short
```

**Expected**:
```
143.198.105.78
```

**If you still see GoDaddy IPs**: Wait longer, then check again.

---

### Check 3: DigitalOcean DNS Directly (Do This Now)

```bash
dig @ns1.digitalocean.com veveve.io +short
```

**Expected**: `143.198.105.78`

**If this returns the correct IP**: ✅ DigitalOcean DNS is configured correctly, just waiting for propagation.

**If this returns wrong IP**: Need to check A records in DigitalOcean.

---

## 🌍 Check Globally (Optional)

Visit: https://dnschecker.org/#A/veveve.io

This shows DNS propagation status across the world. You'll see:
- Some locations showing `143.198.105.78` ✅ (propagated)
- Some locations showing GoDaddy IPs ⏳ (still propagating)

---

## 🎯 When DNS is Ready

Once `dig veveve.io +short` returns `143.198.105.78`:

### 1. Set Up SSL Certificate

**On the server**:
```bash
# Ensure certbot directory exists
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot

# Run certbot
sudo certbot --nginx -d veveve.io -d www.veveve.io
```

**Expected**: SSL certificate issued, HTTPS configured automatically.

---

### 2. Update Backend Configuration

**On the server**:
```bash
cd /var/www/vvv-frontpage
bash scripts/update-veveve-io-backend.sh
docker-compose restart django
# or
docker compose restart django
```

**What this does**:
- Adds `veveve.io` to ALLOWED_HOSTS
- Adds `https://veveve.io` to CORS_ALLOWED_ORIGINS
- Adds `https://veveve.io` to CSRF_TRUSTED_ORIGINS

---

### 3. Test Everything

```bash
# 1. Test HTTP redirect
curl -I http://veveve.io
# Should show: 301 redirect to https://veveve.io

# 2. Test HTTPS frontpage
curl -I https://veveve.io
# Should show: 200 OK

# 3. Test API endpoint
curl https://veveve.io/api/health
# Should return: health check response

# 4. Test in browser
# Visit: https://veveve.io
# Should show: English frontpage
```

---

## 📋 Quick Check Script

You can run this periodically to check status:

```bash
# Check nameservers
echo "Nameservers:"
dig NS veveve.io +short

# Check A record
echo -e "\nA Record:"
dig veveve.io +short

# Check DigitalOcean directly
echo -e "\nDigitalOcean DNS:"
dig @ns1.digitalocean.com veveve.io +short
```

**When all three show DigitalOcean/your IP**: DNS is ready! 🎉

---

## ⏰ Recommended Check Times

- **15 minutes**: Check nameservers
- **30 minutes**: Check A record
- **60 minutes**: Check again if not ready
- **When ready**: Proceed with SSL setup

---

## 🚨 If Still Not Working After 2 Hours

If after 2 hours `dig veveve.io +short` still returns GoDaddy IPs:

1. **Verify nameservers are saved** in GoDaddy UI
2. **Check DigitalOcean A records** are correct
3. **Clear DNS cache**: `sudo dscacheutil -flushcache` (macOS)
4. **Check globally**: https://dnschecker.org/#A/veveve.io

---

**Next Action**: Wait 15-30 minutes, then run `dig veveve.io +short`. When it returns `143.198.105.78`, proceed with SSL setup!
