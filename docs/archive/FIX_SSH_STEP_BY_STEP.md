# Step-by-Step: Fix SSH Authentication for GitHub Actions

## 🎯 Goal
Fix the SSH authentication failure so GitHub Actions can deploy to the server.

---

## Step 1: Verify Your Local Key Works ✅

**On your local machine:**

```bash
# Test SSH connection (this should work)
ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78
```

If this works, proceed to Step 2. If not, you need to add the public key to the server first.

---

## Step 2: Get Your Private Key Content

**On your local machine:**

```bash
# Display the entire private key
cat ~/.ssh/vvv_web_deploy_key
```

**What to copy:**
- Copy the ENTIRE output
- It should start with: `-----BEGIN OPENSSH PRIVATE KEY-----`
- It should end with: `-----END OPENSSH PRIVATE KEY-----`
- It should have multiple lines in between

**Important:** Make sure you copy ALL lines, including the headers and all the key content.

---

## Step 3: Verify Key Pair Match

**On your local machine:**

```bash
# Extract the public key from your private key
ssh-keygen -y -f ~/.ssh/vvv_web_deploy_key
```

**On the server** (SSH in first):

```bash
# View the public key on the server
cat ~/.ssh/authorized_keys
```

**Compare:** The output from `ssh-keygen -y` should match what's in `authorized_keys` on the server.

If they don't match, you need to add the correct public key to the server (see Step 4).

---

## Step 4: Verify Server Setup (If Needed)

**SSH to the server:**

```bash
ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78
```

**Once connected, check permissions:**

```bash
# Check .ssh directory
ls -ld ~/.ssh
# Should show: drwx------ (700)

# Check authorized_keys
ls -l ~/.ssh/authorized_keys
# Should show: -rw------- (600)

# View the public key
cat ~/.ssh/authorized_keys
```

**If permissions are wrong, fix them:**

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

**If the public key doesn't match, add it:**

```bash
# On your local machine, get the public key:
ssh-keygen -y -f ~/.ssh/vvv_web_deploy_key

# Then on the server, add it (replace with your actual public key):
echo "ssh-ed25519 AAAA... your-key-here" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## Step 5: Update GitHub Secret

**In GitHub:**

1. **Go to your repository:**
   - Navigate to: `https://github.com/vevevedk/vvv-frontpage`

2. **Open Settings:**
   - Click on **"Settings"** tab (top menu)

3. **Go to Secrets:**
   - In the left sidebar, click **"Secrets and variables"**
   - Click **"Actions"**

4. **Find SSH_PRIVATE_KEY:**
   - Look for `SSH_PRIVATE_KEY` in the list
   - Click on it (or click the pencil icon to edit)

5. **Update the secret:**
   - Click **"Update"** button
   - **Delete everything** in the "Value" field
   - **Paste your entire private key** (from Step 2)
   - **Important:** Make sure the key includes:
     - `-----BEGIN OPENSSH PRIVATE KEY-----` at the start
     - `-----END OPENSSH PRIVATE KEY-----` at the end
     - All the key content in between (multiple lines)
   - Click **"Update secret"**

6. **Verify the secret:**
   - The secret should show as `••••••••` (masked)
   - You should see "Updated" confirmation

---

## Step 6: Test the Deployment

**Option A: Trigger manually**

1. Go to **"Actions"** tab in GitHub
2. Click **"Deploy to Production"** workflow
3. Click **"Run workflow"** button (top right)
4. Select **"main"** branch
5. Click **"Run workflow"**

**Option B: Push a small change**

```bash
# Make a small change (like updating a comment)
# Then commit and push
git commit --allow-empty -m "test: Trigger deployment"
git push origin main
```

---

## Step 7: Check the Results

**In GitHub Actions:**

1. Go to **"Actions"** tab
2. Click on the latest workflow run
3. Click on **"Deploy to Server"** job
4. Check the logs

**Success indicators:**
- ✅ SSH connection succeeds
- ✅ Script starts executing
- ✅ No "authentication failed" errors

**If it still fails:**
- Check the error message
- Verify the key format (should have newlines)
- Make sure the public key on server matches the private key

---

## 🔍 Troubleshooting

### Error: "unable to authenticate"

**Check:**
1. Private key in GitHub Secrets has all newlines preserved
2. Private key includes BEGIN/END markers
3. Public key on server matches private key
4. Server permissions are correct (700 for .ssh, 600 for authorized_keys)

### Error: "Permission denied"

**Check:**
1. File permissions on server
2. File ownership (should be vvv-web-deploy:vvv-web-deploy)
3. Public key is in authorized_keys file

### Key format issues

**If copying from terminal:**
- Some terminals may corrupt newlines
- Try copying from a text editor instead
- Or use: `pbcopy < ~/.ssh/vvv_web_deploy_key` (macOS) to copy directly

---

## ✅ Verification Checklist

Before testing, verify:

- [ ] Local SSH works: `ssh -i ~/.ssh/vvv_web_deploy_key vvv-web-deploy@143.198.105.78`
- [ ] Public key on server matches private key (`ssh-keygen -y` output matches `authorized_keys`)
- [ ] Server permissions are correct (700/600)
- [ ] Private key copied to GitHub Secrets includes full key with headers
- [ ] All newlines preserved in GitHub Secret
- [ ] GitHub Secret updated successfully

---

## 📝 Quick Reference

**Local private key:** `~/.ssh/vvv_web_deploy_key`  
**Server authorized_keys:** `/home/vvv-web-deploy/.ssh/authorized_keys`  
**GitHub Secret name:** `SSH_PRIVATE_KEY`  
**Server user:** `vvv-web-deploy`  
**Server IP:** `143.198.105.78`

---

**After completing these steps, the deployment should work!** 🚀

