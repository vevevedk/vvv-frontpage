# Update Nameservers at GoDaddy for veveve.io

**Current Issue**: Nameservers still point to GoDaddy, not DigitalOcean  
**Current Nameservers**: `ns73.domaincontrol.com`, `ns74.domaincontrol.com` (GoDaddy)  
**Need**: Update to DigitalOcean nameservers

---

## 🎯 Quick Fix

### Step 1: Get DigitalOcean Nameservers

From your DigitalOcean DNS panel, you need these 3 nameservers:
- `ns1.digitalocean.com`
- `ns2.digitalocean.com`
- `ns3.digitalocean.com`

**Or check in DigitalOcean**:
1. Go to: https://cloud.digitalocean.com/networking/domains
2. Click on `veveve.io`
3. Look at the NS records - they should show the 3 nameservers above

---

### Step 2: Update Nameservers in GoDaddy

1. **Log in to GoDaddy**
   - Go to: https://www.godaddy.com
   - Sign in to your account

2. **Navigate to Domain Settings**
   - Go to: **My Products** (or **Domains**)
   - Find `veveve.io` in your domain list
   - Click **"DNS"** or **"Manage DNS"** button

3. **Find Nameservers Section**
   - Look for **"Nameservers"** section
   - It might be at the top of the page or in a separate tab
   - Current nameservers should show:
     - `ns73.domaincontrol.com`
     - `ns74.domaincontrol.com`

4. **Change Nameservers**
   - Click **"Change"** or **"Edit"** button
   - Select **"Custom"** or **"I'll use my own nameservers"**
   - Remove the existing GoDaddy nameservers
   - Add these 3 nameservers (one per line):
     ```
     ns1.digitalocean.com
     ns2.digitalocean.com
     ns3.digitalocean.com
     ```
   - Click **"Save"** or **"Update"**

5. **Confirm Changes**
   - GoDaddy may ask you to confirm
   - Click **"Confirm"** or **"Save"**

---

## ⏱️ Wait for Propagation

After updating nameservers:
- **Wait**: 15-60 minutes (can take up to 48 hours, but usually < 1 hour)
- **Check periodically** until nameservers update

---

## ✅ Verify Nameservers Updated

After waiting, check:

```bash
# Check nameservers (should now show DigitalOcean)
dig NS veveve.io +short
# Should return:
# ns1.digitalocean.com
# ns2.digitalocean.com
# ns3.digitalocean.com
```

**If you still see GoDaddy nameservers**:
- Wait longer (propagation can take time)
- Double-check you saved the changes in GoDaddy
- Try clearing DNS cache: `sudo dscacheutil -flushcache` (macOS)

---

## ✅ Verify A Records Work

Once nameservers are updated, check A records:

```bash
# Check A record (should now show your server IP)
dig veveve.io +short
# Should return: 143.198.105.78

dig www.veveve.io +short
# Should return: 143.198.105.78
```

**If A records still show wrong IPs**:
- Wait a bit longer (DNS propagation)
- Verify A records exist in DigitalOcean:
  - Go to: https://cloud.digitalocean.com/networking/domains → `veveve.io`
  - Check that A records exist:
    - `@` → `143.198.105.78`
    - `www` → `143.198.105.78`

---

## 📋 GoDaddy Interface Guide

**If you can't find Nameservers section**:

1. **My Products Page**:
   - Go to: https://dcc.godaddy.com/products
   - Find `veveve.io`
   - Click the **"DNS"** button

2. **Nameservers Location**:
   - Look for **"Nameservers"** section (usually at top)
   - Or click **"Nameservers"** tab
   - Current should show: `ns73.domaincontrol.com`, `ns74.domaincontrol.com`

3. **Change Option**:
   - Click **"Change"** button
   - Select **"Custom"** or **"I'll use my own nameservers"**
   - Enter the 3 DigitalOcean nameservers
   - Save

---

## 🐛 Troubleshooting

### Still Showing GoDaddy Nameservers?

1. **Check you saved changes** in GoDaddy
2. **Wait longer** - propagation can take 1-2 hours
3. **Clear DNS cache**:
   ```bash
   sudo dscacheutil -flushcache  # macOS
   ```
4. **Check from different location**: https://dnschecker.org/#NS/veveve.io

### A Records Still Wrong?

1. **Verify A records in DigitalOcean**:
   - Must have: `@` → `143.198.105.78` and `www` → `143.198.105.78`
2. **Wait for full propagation** (can take 1-2 hours)
3. **Check globally**: https://dnschecker.org/#A/veveve.io

---

## 🚀 After DNS Works

Once `dig veveve.io +short` returns `143.198.105.78`:

1. **Set up Nginx** on server
2. **Set up SSL certificate** with certbot
3. **Test the site**

---

**Summary**: Update nameservers in GoDaddy to DigitalOcean's 3 nameservers, wait 15-60 minutes, then verify with `dig` commands above.
