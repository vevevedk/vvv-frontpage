# veveve.io DNS Setup Guide

**Domain Purchased**: ✅ veveve.io  
**Next Step**: Configure DNS in DigitalOcean

---

## 🚀 Quick DNS Setup

### Step 1: Access Domain Management

**Where did you purchase?**
- If Namecheap/GoDaddy/etc: Go to domain management panel
- If Cloudflare: Already in Cloudflare dashboard
- If DigitalOcean: Go to Networking → Domains

### Step 2: Configure DNS Records

You need to create these DNS records pointing to your server:

```
Type  Name            Value           TTL
A     veveve.io       143.198.105.78  300
A     www.veveve.io   143.198.105.78  300
```

### Step 3: Update Nameservers (If Needed)

**Option A: Use DigitalOcean Nameservers** (Recommended for simplicity)
- Point domain to DigitalOcean nameservers
- Manage DNS in DigitalOcean

**Option B: Use Cloudflare Nameservers** (Recommended for performance)
- Point domain to Cloudflare nameservers
- Free DNS, free SSL, DDoS protection
- Better performance globally

**Option C: Keep Current Nameservers**
- Add A records in current registrar's DNS panel

---

## 📋 Detailed Setup Instructions

### If Using DigitalOcean DNS

1. **Go to DigitalOcean Control Panel**
   - Networking → Domains
   - Click "Add a domain"

2. **Add Domain**
   - Enter: `veveve.io`
   - Click "Add Domain"

3. **Create A Records**
   - Click on `veveve.io` domain
   - Add A record:
     - Hostname: `@` (or leave blank)
     - Will direct to: `143.198.105.78`
   - Add A record:
     - Hostname: `www`
     - Will direct to: `143.198.105.78`

4. **Update Nameservers at Registrar**
   - Go to your domain registrar
   - Find nameserver settings
   - Update to DigitalOcean nameservers (provided in DO panel)

### If Using Cloudflare (Recommended)

1. **Add Domain to Cloudflare**
   - Go to Cloudflare dashboard
   - Add site → Enter `veveve.io`
   - Select free plan

2. **Cloudflare will provide nameservers**
   - Example: `alice.ns.cloudflare.com`, `bob.ns.cloudflare.com`
   - Copy these nameservers

3. **Update Nameservers at Registrar**
   - Go to your domain registrar
   - Update nameservers to Cloudflare's

4. **Create A Records in Cloudflare**
   - DNS → Records
   - Add A record: `veveve.io` → `143.198.105.78`
   - Add A record: `www.veveve.io` → `143.198.105.78`
   - Proxy status: DNS only (gray cloud) initially

---

## ⏱️ DNS Propagation

After updating nameservers/DNS:
- **Wait**: 5 minutes to 48 hours (usually < 1 hour)
- **Check**: `dig veveve.io +short` or `nslookup veveve.io`
- **Should return**: `143.198.105.78`

---

## ✅ Verification Commands

Once DNS is configured, verify:

```bash
# Check DNS resolution
dig veveve.io +short
# Should return: 143.198.105.78

dig www.veveve.io +short
# Should return: 143.198.105.78

# Or use nslookup
nslookup veveve.io
```

---

## 🔒 Next Steps After DNS

Once DNS propagates:
1. Set up SSL certificate (certbot)
2. Configure Nginx
3. Deploy application

**I'll help with these once DNS is configured!**
