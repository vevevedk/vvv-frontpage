# After Updating Nameservers in GoDaddy

**Status**: Nameservers updated in GoDaddy ✅  
**Next**: Wait for propagation and verify DNS

---

## ⏱️ Step 1: Wait for DNS Propagation

After updating nameservers in GoDaddy:
- **Wait**: 15-60 minutes (can take up to 48 hours, but usually < 1 hour)
- **Propagation time**: Depends on DNS cache TTLs globally

---

## ✅ Step 2: Verify Nameservers Changed

After waiting 15-30 minutes, check:

```bash
# Should now show DigitalOcean nameservers (not GoDaddy)
dig NS veveve.io +short
# Should return:
# ns1.digitalocean.com
# ns2.digitalocean.com
# ns3.digitalocean.com
```

**If you still see GoDaddy nameservers** (`ns73.domaincontrol.com`, `ns74.domaincontrol.com`):
- Wait longer (propagation can take 1-2 hours)
- Clear DNS cache: `sudo dscacheutil -flushcache` (macOS)
- Check from different location: https://dnschecker.org/#NS/veveve.io

---

## ✅ Step 3: Fix A Record in DigitalOcean

**Important**: I noticed in DigitalOcean you have an A record pointing to "WebsiteBuilder Site" - this needs to be changed!

1. **Go to DigitalOcean DNS**:
   - https://cloud.digitalocean.com/networking/domains
   - Click on `veveve.io`

2. **Find the A record** with `Name: @` and `Data: WebsiteBuilder Site`

3. **Edit or Delete it**:
   - Click the edit (pencil) icon
   - Change `Data` to: `143.198.105.78`
   - Or delete it and create a new one

4. **Create/Verify A Records**:
   - **A Record 1** (Root domain):
     - Type: `A`
     - Name: `@` (or blank)
     - Data: `143.198.105.78`
     - TTL: `1 Hour` (or default)
   
   - **A Record 2** (WWW subdomain):
     - Type: `A`
     - Name: `www`
     - Data: `143.198.105.78`
     - TTL: `1 Hour` (or default)

---

## ✅ Step 4: Verify A Records Work

Once nameservers are updated AND A records are correct:

```bash
# Should now show your server IP
dig veveve.io +short
# Should return: 143.198.105.78

dig www.veveve.io +short
# Should return: 143.198.105.78
```

**If still showing wrong IPs**:
- Wait longer for full propagation
- Verify A records in DigitalOcean are correct
- Check globally: https://dnschecker.org/#A/veveve.io

---

## 📋 Checklist

Before DNS will fully work:

- [x] Nameservers updated in GoDaddy to DigitalOcean's
- [ ] Wait 15-60 minutes for propagation
- [ ] Verify nameservers changed: `dig NS veveve.io +short`
- [ ] Fix A record in DigitalOcean (change from "WebsiteBuilder Site" to `143.198.105.78`)
- [ ] Create A record for `www` → `143.198.105.78`
- [ ] Verify A records: `dig veveve.io +short` returns `143.198.105.78`

---

## 🚀 After DNS Works

Once `dig veveve.io +short` returns `143.198.105.78`:

1. **Set up Nginx** on server
2. **Set up SSL certificate** with certbot
3. **Test the site**

---

**Next Action**: Fix the A record in DigitalOcean (change from "WebsiteBuilder Site" to `143.198.105.78`), then wait and verify!
