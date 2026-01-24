# Fix Nameservers in GoDaddy - Correct Method

**Issue Found**: You added `ns3.digitalocean.com` as a DNS record, but the domain is still using GoDaddy nameservers.

**The Problem**:
- You're on the **DNS Records** page
- You added `ns3.digitalocean.com` as an NS record
- But the domain is still configured to use **GoDaddy nameservers** (that's why `ns73.domaincontrol.com` and `ns74.domaincontrol.com` show "Can't delete/edit")

**The Solution**: Change the nameservers in the **Nameservers tab**, not the DNS records page.

---

## ✅ Correct Steps to Fix Nameservers

### Step 1: Navigate to Nameservers Tab

1. In GoDaddy, you're currently on the **"DNS"** or **"DNS Records"** page
2. Look for a **"Nameservers"** tab at the top of the page
3. Click on the **"Nameservers"** tab
   - This is different from the DNS records page
   - This is where you configure which nameservers the domain uses

### Step 2: Change Nameserver Type

In the Nameservers tab, you should see:

**Current setting** (probably):
- "GoDaddy nameservers" (selected)
- Or "Default" nameservers

**What to do**:
1. Click **"Change"** or **"Edit"** button
2. Select **"Custom"** or **"I'll use my own nameservers"**
3. You'll see input fields for nameservers

### Step 3: Enter DigitalOcean Nameservers

Enter these **3 nameservers** (one per field):
```
ns1.digitalocean.com
ns2.digitalocean.com
ns3.digitalocean.com
```

**Important**: 
- Enter all 3 nameservers
- Make sure they're exactly as shown above (no trailing dots in the input fields, though GoDaddy might add them)

### Step 4: Save and Confirm

1. Click **"Save"** or **"Update"**
2. **Confirm** if prompted
3. Look for confirmation message: "Nameservers updated successfully"

### Step 5: Clean Up DNS Records (Optional)

After changing nameservers:
1. Go back to the **"DNS Records"** tab
2. You can **delete** the `ns3.digitalocean.com` NS record you added
   - It's not needed when nameservers are properly configured
   - The nameservers tab handles this automatically

---

## 🔍 How to Find Nameservers Tab

**If you can't find the Nameservers tab**:

1. **From DNS Records page**:
   - Look for tabs at the top: "DNS Records", "Nameservers", etc.
   - Click "Nameservers"

2. **From Domain Management**:
   - Go to: My Products → Domains → `veveve.io`
   - Look for "Nameservers" link or button
   - It might be in a sidebar or top menu

3. **Direct URL** (might work):
   - https://dcc.godaddy.com/domains/veveve.io/nameservers
   - Or similar path in your GoDaddy account

---

## ✅ What Should Happen After Fixing

1. **Wait 15-30 minutes** after saving
2. **Check nameservers**:
   ```bash
   dig NS veveve.io +short
   ```
   Should show **only**:
   ```
   ns1.digitalocean.com.
   ns2.digitalocean.com.
   ns3.digitalocean.com.
   ```
   (No more GoDaddy nameservers)

3. **Check A record**:
   ```bash
   dig veveve.io +short
   ```
   Should return: `143.198.105.78`

---

## 🚨 Key Difference

**DNS Records page** (where you are now):
- Shows individual DNS records (A, CNAME, NS, etc.)
- NS records here are for subdomains or custom routing
- **NOT** where you change the domain's primary nameservers

**Nameservers tab** (where you need to go):
- Controls which DNS servers are authoritative for the domain
- This is what `dig NS veveve.io` queries
- **THIS** is where you change from GoDaddy to DigitalOcean

---

## 📋 Summary

1. **Go to Nameservers tab** (not DNS records)
2. **Change from "GoDaddy" to "Custom"**
3. **Enter all 3 DigitalOcean nameservers**
4. **Save and confirm**
5. **Wait 15-30 minutes**
6. **Verify**: `dig NS veveve.io +short` should show only DigitalOcean

---

**Next Action**: Find and click the **"Nameservers"** tab in GoDaddy, then change from GoDaddy nameservers to Custom nameservers with the 3 DigitalOcean nameservers.
