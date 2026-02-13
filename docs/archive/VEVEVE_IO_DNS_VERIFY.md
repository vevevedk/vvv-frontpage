# veveve.io DNS Verification - Check Nameservers

**Issue**: DNS still resolving to GoDaddy, not your server  
**Action**: Verify nameservers are correctly updated at GoDaddy

---

## 🔍 Step 1: Verify Nameservers

Check what nameservers are actually active:

```bash
# Check nameservers
dig NS veveve.io +short

# Should show DigitalOcean nameservers:
# ns1.digitalocean.com
# ns2.digitalocean.com
# ns3.digitalocean.com

# If you still see GoDaddy nameservers (ns73.domaincontrol.com, ns74.domaincontrol.com),
# then nameservers weren't saved properly at GoDaddy
```

---

## ✅ Step 2: Double-Check GoDaddy Settings

**If nameservers still show GoDaddy**, go back to GoDaddy and verify:

1. **Log in to GoDaddy**
2. **Go to**: My Products → Domains → `veveve.io` → DNS
3. **Find "Nameservers" section**
4. **Verify they show**:
   - `ns1.digitalocean.com`
   - `ns2.digitalocean.com`
   - `ns3.digitalocean.com`
5. **If they show GoDaddy nameservers**, update them again and **make sure to SAVE**

---

## ⏱️ Step 3: Wait for Propagation

Even if nameservers are correct, propagation takes time:

- **Nameserver changes**: 1-4 hours
- **A record propagation**: Additional time after nameservers update

**Check periodically**:
```bash
# Check nameservers
dig NS veveve.io +short

# Check A record
dig veveve.io +short
# Should eventually return: 143.198.105.78
```

**Check globally**: https://dnschecker.org/#A/veveve.io

---

## 🚀 Alternative: Test with Direct IP

While waiting, you can test if your server is ready by accessing it directly:

```bash
# Test Nginx on your server
curl -I http://143.198.105.78

# Test if Next.js is running
curl -I http://143.198.105.78:3000
```

This won't help with certbot, but confirms your server is ready.

---

## 📋 When DNS is Ready

Once `dig veveve.io +short` returns `143.198.105.78`:

1. **Verify from server**:
   ```bash
   # From your server, test HTTP
   curl -I http://veveve.io
   # Should NOT show GoDaddy headers
   # Should show your Nginx server
   ```

2. **Retry certbot**:
   ```bash
   sudo certbot --nginx -d veveve.io -d www.veveve.io
   ```

---

## 🐛 If Nameservers Keep Reverting

If GoDaddy nameservers keep reverting back:

1. **Check if domain is locked** at GoDaddy
2. **Check if there's a domain protection service** enabled
3. **Contact GoDaddy support** if nameservers won't stay updated

---

**Action**: First verify nameservers with `dig NS veveve.io +short`. If they still show GoDaddy, go back to GoDaddy and update them again, making sure to save.
