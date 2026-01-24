# Fix Server Authorized Keys

## 🔍 Problem Found

The server's `authorized_keys` has a different public key than your private key.

**Server has:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOWdsnZ9kA5UmTeLWeQvADdq4e4RT0pz2RZDpzB2Fb58 vvv-web-deploy-user@new-web-01
```

**Your key should be:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGCEvp20a2KpkZUvbtYdKtrh/P80ZxO+2PcqSBgbtsNG iversen@iversens-MacBook-Air.local
```

## ✅ Solution: Add Your Public Key to Server

**You're already SSH'd to the server, so run this:**

```bash
# Add your public key to authorized_keys
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGCEvp20a2KpkZUvbtYdKtrh/P80ZxO+2PcqSBgbtsNG iversen@iversens-MacBook-Air.local" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# Verify it was added
cat ~/.ssh/authorized_keys
```

**You should now see BOTH keys:**
1. The old one (vvv-web-deploy-user@new-web-01)
2. Your new one (iversen@iversens-MacBook-Air.local)

## 🔄 Alternative: Replace All Keys (If You Want)

If you want to remove the old key and only keep yours:

```bash
# Backup the old key (optional)
cp ~/.ssh/authorized_keys ~/.ssh/authorized_keys.backup

# Replace with only your key
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGCEvp20a2KpkZUvbtYdKtrh/P80ZxO+2PcqSBgbtsNG iversen@iversens-MacBook-Air.local" > ~/.ssh/authorized_keys

# Set permissions
chmod 600 ~/.ssh/authorized_keys

# Verify
cat ~/.ssh/authorized_keys
```

## ✅ After Adding the Key

1. **Test from your local machine:**
   ```bash
   ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78
   ```
   Should work (it already does, but verify)

2. **Update GitHub Secret** (if not done already):
   - Go to: https://github.com/vevevedk/vvv-frontpage/settings/secrets/actions
   - Update `SSH_PRIVATE_KEY` with your private key

3. **Test GitHub Actions deployment:**
   - Go to Actions → "Deploy to Production" → "Run workflow"
   - Should now work!


