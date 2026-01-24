# veveve.io DNS Setup - DigitalOcean

**Domain**: veveve.io  
**Server IP**: 143.198.105.78  
**DNS Provider**: DigitalOcean

---

## 🚀 Step-by-Step Setup

### Step 1: Add Domain to DigitalOcean

1. **Log in to DigitalOcean**
   - Go to: https://cloud.digitalocean.com
   - Navigate to: **Networking** → **Domains**

2. **Add Domain**
   - Click **"Add a domain"** button (top right)
   - Enter domain name: `veveve.io`
   - Click **"Add Domain"**

---

### Step 2: Create A Records

After adding the domain, you'll see the DNS records page for `veveve.io`.

**Create First A Record (Root Domain)**:
1. In the DNS records section, click **"Add record"**
2. Select record type: **A**
3. Configure:
   - **Hostname**: `@` (or leave blank - represents root domain)
   - **Will direct to**: `143.198.105.78`
   - **TTL**: `3600` (or leave default)
4. Click **"Create Record"**

**Create Second A Record (WWW Subdomain)**:
1. Click **"Add record"** again
2. Select record type: **A**
3. Configure:
   - **Hostname**: `www`
   - **Will direct to**: `143.198.105.78`
   - **TTL**: `3600` (or leave default)
4. Click **"Create Record"**

---

### Step 3: Update Nameservers at Domain Registrar

DigitalOcean will provide nameservers for your domain. You need to update these at your domain registrar (where you purchased veveve.io).

**Get DigitalOcean Nameservers**:
1. In DigitalOcean, go to the `veveve.io` domain page
2. Look for **"Nameservers"** section
3. You'll see something like:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```
4. Copy these nameservers

**Update at Your Registrar**:
1. Log in to where you purchased veveve.io
2. Find **"DNS Settings"** or **"Nameservers"** section
3. Change from default nameservers to DigitalOcean's:
   - Replace existing nameservers with:
     - `ns1.digitalocean.com`
     - `ns2.digitalocean.com`
     - `ns3.digitalocean.com`
4. Save changes

**Common Registrars**:
- **Namecheap**: Domain List → Manage → Advanced DNS → Nameservers
- **GoDaddy**: My Products → DNS → Nameservers
- **Google Domains**: DNS → Name servers
- **Cloudflare**: DNS → Nameservers (if purchased there)

---

## ⏱️ Wait for DNS Propagation

After updating nameservers:
- **Propagation time**: 5 minutes to 48 hours
- **Usually**: 15-60 minutes
- **Check periodically** until DNS resolves

---

## ✅ Verify DNS Setup

**Check if DNS is working**:

```bash
# Check root domain
dig veveve.io +short
# Should return: 143.198.105.78

# Check www subdomain
dig www.veveve.io +short
# Should return: 143.198.105.78

# Or use nslookup
nslookup veveve.io
nslookup www.veveve.io
```

**Online Tools** (if you don't have dig/nslookup):
- https://dnschecker.org/#A/veveve.io
- https://www.whatsmydns.net/#A/veveve.io

---

## 📋 Expected DNS Records

After setup, your DigitalOcean DNS should show:

| Type | Hostname | Value | TTL |
|------|----------|-------|-----|
| A | @ | 143.198.105.78 | 3600 |
| A | www | 143.198.105.78 | 3600 |

**Note**: DigitalOcean may also auto-create some NS and SOA records - that's normal.

---

## 🔒 Next Steps After DNS Works

Once `dig veveve.io +short` returns `143.198.105.78`:

1. **Set up Nginx** (see `VEVEVE_IO_NEXT_STEPS.md`)
2. **Set up SSL certificate** with certbot
3. **Test the site**

---

## 🐛 Troubleshooting

### DNS Not Resolving?

1. **Check nameservers are updated**:
   ```bash
   dig NS veveve.io +short
   # Should show DigitalOcean nameservers
   ```

2. **Wait longer**: DNS can take up to 48 hours (rare, usually < 1 hour)

3. **Check A records in DigitalOcean**:
   - Go to Networking → Domains → veveve.io
   - Verify A records exist and point to `143.198.105.78`

4. **Clear DNS cache** (local):
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   
   # Windows
   ipconfig /flushdns
   ```

### Wrong IP Address?

- Double-check server IP: `143.198.105.78`
- Verify in DigitalOcean: Droplets → vvv-app-web-v02 → IPv4

---

## 📞 Quick Reference

**DigitalOcean DNS Dashboard**:  
https://cloud.digitalocean.com/networking/domains

**Server IP**: `143.198.105.78`

**Domain**: `veveve.io`

**Verification Command**:  
```bash
dig veveve.io +short
```

---

**Once DNS is working, let me know and we'll proceed with Nginx and SSL setup!**
