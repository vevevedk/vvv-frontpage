# veveve.io DNS Troubleshooting

**Issue**: DNS is resolving to wrong IPs (76.223.105.230, 13.248.243.5)  
**Expected**: Should resolve to `143.198.105.78`

---

## 🔍 Diagnosis

The IPs you're seeing (`76.223.105.230`, `13.248.243.5`) are likely:
- **Cloudflare IPs** (if domain was previously on Cloudflare)
- **CDN/Proxy IPs** (if there's a proxy in front)
- **Old DNS records** (if nameservers haven't been updated)

---

## ✅ Step-by-Step Fix

### Step 1: Check Current Nameservers

```bash
dig NS veveve.io +short
```

**What to look for**:
- Should show: `ns1.digitalocean.com`, `ns2.digitalocean.com`, `ns3.digitalocean.com`
- If you see Cloudflare nameservers (like `*.ns.cloudflare.com`), nameservers aren't updated yet

---

### Step 2: Verify A Records in DigitalOcean

1. Go to: https://cloud.digitalocean.com/networking/domains
2. Click on `veveve.io`
3. Check DNS records section

**You should see**:
- ✅ A record: `@` → `143.198.105.78`
- ✅ A record: `www` → `143.198.105.78`

**If A records are missing or wrong**:
- Add/edit them to point to `143.198.105.78`

---

### Step 3: Update Nameservers at Registrar

**This is likely the issue** - nameservers at your registrar haven't been updated to DigitalOcean's.

1. **Go to your domain registrar** (where you purchased veveve.io)

2. **Find Nameserver settings**:
   - Namecheap: Domain List → Manage → Advanced DNS → Nameservers
   - GoDaddy: My Products → DNS → Nameservers
   - Google Domains: DNS → Name servers
   - Cloudflare: DNS → Nameservers

3. **Check current nameservers**:
   - If they show Cloudflare nameservers (like `*.ns.cloudflare.com`), that's the problem
   - If they show default registrar nameservers, that's also the problem

4. **Update to DigitalOcean nameservers**:
   - Remove existing nameservers
   - Add:
     - `ns1.digitalocean.com`
     - `ns2.digitalocean.com`
     - `ns3.digitalocean.com`
   - Save changes

---

### Step 4: Wait for Propagation

After updating nameservers:
- **Wait**: 15-60 minutes (can take up to 48 hours, but usually < 1 hour)
- **Check periodically**:
  ```bash
  dig veveve.io +short
  # Should eventually return: 143.198.105.78
  ```

---

## 🧪 Verification Commands

**Check nameservers**:
```bash
dig NS veveve.io +short
# Should show DigitalOcean nameservers
```

**Check A records**:
```bash
dig veveve.io +short
# Should return: 143.198.105.78

dig www.veveve.io +short
# Should return: 143.198.105.78
```

**Check full DNS query**:
```bash
dig veveve.io
# Look for "ANSWER SECTION" - should show A record with 143.198.105.78
```

**Online tools**:
- https://dnschecker.org/#A/veveve.io
- https://www.whatsmydns.net/#A/veveve.io

---

## 🔧 Common Issues

### Issue 1: Still Showing Cloudflare IPs

**Cause**: Nameservers at registrar still point to Cloudflare

**Fix**: Update nameservers at registrar to DigitalOcean's (Step 3 above)

---

### Issue 2: DNS Not Propagating

**Possible causes**:
- Nameservers not updated at registrar
- DNS cache (try: `sudo dscacheutil -flushcache` on macOS)
- Propagation delay (wait longer)

**Fix**: 
1. Verify nameservers are updated
2. Clear local DNS cache
3. Wait 1-2 hours and check again

---

### Issue 3: A Records Missing in DigitalOcean

**Fix**: 
1. Go to DigitalOcean → Networking → Domains → veveve.io
2. Add A records:
   - `@` → `143.198.105.78`
   - `www` → `143.198.105.78`

---

## 📋 Checklist

Before DNS will work:

- [ ] Domain added to DigitalOcean
- [ ] A records created in DigitalOcean (`@` and `www` → `143.198.105.78`)
- [ ] Nameservers updated at registrar to DigitalOcean's
- [ ] Waited 15-60 minutes for propagation
- [ ] Verified with `dig veveve.io +short` returns `143.198.105.78`

---

## 🚀 Once DNS Works

When `dig veveve.io +short` returns `143.198.105.78`:

1. Set up Nginx on server
2. Set up SSL certificate
3. Test the site

---

**Most likely issue**: Nameservers at your registrar haven't been updated to DigitalOcean's yet. Check Step 3 above!
