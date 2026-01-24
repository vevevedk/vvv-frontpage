# Verify GoDaddy Nameserver Configuration

**Issue**: DNS still returning GoDaddy IPs instead of DigitalOcean IP (143.198.105.78)

**Current Status**:
```bash
dig veveve.io +short
# Returns: 76.223.105.230, 13.248.243.5 (GoDaddy IPs)
# Expected: 143.198.105.78 (Your server)
```

## 🔍 What to Check in GoDaddy

### Step 1: Log into GoDaddy

1. Go to: https://www.godaddy.com
2. Log in to your account
3. Navigate to **My Products** → **Domains**
4. Find `veveve.io` and click **Manage**

### Step 2: Check Nameservers

1. In the domain management page, look for **Nameservers** or **DNS** section
2. Click on **Nameservers** or **Change Nameservers**

**Expected Configuration**:
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

**If you see GoDaddy nameservers** (like `ns73.domaincontrol.com`, `ns74.domaincontrol.com`):
- The nameserver change was **not saved**
- You need to update them to DigitalOcean nameservers

### Step 3: Update Nameservers (If Needed)

1. Click **Change** or **Edit** on nameservers
2. Select **Custom** or **I'll use my own nameservers**
3. Enter the three DigitalOcean nameservers:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```
4. **IMPORTANT**: Click **Save** or **Update**
5. Confirm the change if prompted

### Step 4: Verify Nameservers Are Saved

After saving, check that the nameservers are actually updated:

```bash
# Check nameservers
dig NS veveve.io +short

# Should show:
# ns1.digitalocean.com.
# ns2.digitalocean.com.
# ns3.digitalocean.com.
```

**If you still see GoDaddy nameservers**:
- The change might not have been saved
- Try updating again
- Wait a few minutes and check again

## 🔧 Common Issues

### Issue 1: Nameservers Not Saved
**Symptom**: `dig NS veveve.io` still shows GoDaddy nameservers

**Solution**:
1. Go back to GoDaddy
2. Verify nameservers are set to DigitalOcean
3. Make sure you clicked **Save**
4. Some registrars require confirmation email - check your email

### Issue 2: Nameservers Saved But DNS Not Working
**Symptom**: Nameservers show DigitalOcean, but `dig veveve.io` still returns GoDaddy IPs

**Possible Causes**:
1. **DNS cache** - Wait 5-10 minutes, then check again
2. **DigitalOcean DNS not configured** - Check DigitalOcean DNS records
3. **Propagation delay** - Can take up to 24 hours (usually 1-2 hours)

**Solution**:
1. Verify DigitalOcean DNS records are correct:
   ```bash
   dig @ns1.digitalocean.com veveve.io +short
   # Should return: 143.198.105.78
   ```
2. If DigitalOcean DNS is correct, it's just propagation - wait longer

### Issue 3: GoDaddy Requires Confirmation
**Symptom**: Nameserver change shows as "pending" or requires email confirmation

**Solution**:
1. Check your email for confirmation link
2. Click the confirmation link
3. Wait for confirmation to process (usually instant, can take up to 15 minutes)

## ✅ Verification Checklist

After updating nameservers in GoDaddy:

- [ ] Nameservers saved in GoDaddy UI
- [ ] `dig NS veveve.io +short` shows DigitalOcean nameservers
- [ ] `dig @ns1.digitalocean.com veveve.io +short` returns `143.198.105.78`
- [ ] Wait 15-30 minutes, then check `dig veveve.io +short`
- [ ] If still showing GoDaddy IPs, wait another hour and check again

## 📝 Step-by-Step GoDaddy UI Navigation

1. **Login**: https://www.godaddy.com → Sign In
2. **My Products**: Click "My Products" in top menu
3. **Domains**: Click "Domains" tab
4. **Find Domain**: Find `veveve.io` in the list
5. **Manage**: Click "Manage" or "DNS" button
6. **Nameservers**: Look for "Nameservers" section
7. **Change**: Click "Change" or "Edit"
8. **Custom**: Select "Custom" or "I'll use my own nameservers"
9. **Enter**: Type the three DigitalOcean nameservers
10. **Save**: Click "Save" or "Update"
11. **Confirm**: Confirm the change if prompted

## 🎯 Expected Timeline

- **Immediate**: Nameservers updated in GoDaddy
- **5-15 minutes**: Nameserver change propagates
- **15-30 minutes**: DNS starts resolving to DigitalOcean
- **1-2 hours**: Full global DNS propagation
- **Up to 24 hours**: Complete propagation (rare, usually faster)

## 🚨 If Nameservers Are Correct But DNS Still Wrong

If `dig NS veveve.io` shows DigitalOcean nameservers, but `dig veveve.io` still returns GoDaddy IPs:

1. **Check DigitalOcean DNS**:
   ```bash
   dig @ns1.digitalocean.com veveve.io +short
   ```
   - If this returns `143.198.105.78` → DNS is correct, just wait for propagation
   - If this returns wrong IP → Fix A records in DigitalOcean

2. **Check DigitalOcean A Records**:
   - Log into DigitalOcean
   - Go to Networking → Domains
   - Select `veveve.io`
   - Verify A records:
     - `@` → `143.198.105.78`
     - `www` → `143.198.105.78`

3. **Wait for Propagation**: DNS changes can take time to propagate globally

## 📞 Next Steps

1. **Check GoDaddy UI** - Verify nameservers are set to DigitalOcean
2. **Save if needed** - Make sure changes are saved
3. **Verify nameservers** - Run `dig NS veveve.io +short`
4. **Wait 15-30 minutes** - Then check `dig veveve.io +short` again
5. **If still wrong** - Check DigitalOcean DNS records

---

**Once DNS resolves correctly** (`dig veveve.io +short` returns `143.198.105.78`):
- Proceed with SSL setup: `sudo certbot --nginx -d veveve.io -d www.veveve.io`
- Update backend: `bash scripts/update-veveve-io-backend.sh`
