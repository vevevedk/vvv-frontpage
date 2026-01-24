# veveve.io - Verify Nameservers Are Updated

**Issue**: DNS still resolving to GoDaddy after several hours  
**Action**: Verify nameservers are actually updated at GoDaddy

---

## 🔍 Critical Check: Nameservers

```bash
# Check what nameservers are active
dig NS veveve.io +short
```

**Expected** (DigitalOcean):
- `ns1.digitalocean.com`
- `ns2.digitalocean.com`
- `ns3.digitalocean.com`

**If you see** (GoDaddy):
- `ns73.domaincontrol.com`
- `ns74.domaincontrol.com`

**Then nameservers weren't saved properly at GoDaddy!**

---

## ✅ If Nameservers Show GoDaddy

**Go back to GoDaddy and update them**:

1. **Log in to GoDaddy**: https://www.godaddy.com
2. **Go to**: My Products → Domains → `veveve.io` → DNS
3. **Find "Nameservers" section** (usually at top of DNS page)
4. **Click "Change"** or "Edit"
5. **Select "Custom"** or "I'll use my own nameservers"
6. **Enter these 3 nameservers**:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```
7. **Click "Save"** or "Update"
8. **Confirm the save** if prompted

**Important**: Make sure you see a confirmation message that nameservers were updated.

---

## ⏱️ After Updating Nameservers

**Wait 30-60 minutes**, then check:

```bash
# Check nameservers (should now show DigitalOcean)
dig NS veveve.io +short

# Check A record (should eventually show your IP)
dig veveve.io +short
# Should return: 143.198.105.78
```

**Check globally**: https://dnschecker.org/#NS/veveve.io

---

## 🐛 If Nameservers Keep Reverting

If GoDaddy nameservers keep coming back:

1. **Check domain lock status** at GoDaddy
2. **Check for domain protection services** that might prevent changes
3. **Contact GoDaddy support** - nameservers should update within minutes

---

## 📋 Timeline After Nameservers Update

- **0-30 minutes**: Nameservers propagate globally
- **30-60 minutes**: A records start propagating
- **1-4 hours**: Full global DNS propagation

---

**Action**: Run `dig NS veveve.io +short` and share the result. This will tell us if nameservers need to be updated again.
