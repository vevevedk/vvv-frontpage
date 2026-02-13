# Update GitHub Secret - Exact Steps

## ✅ Your Key is Correct

Your private key looks properly formatted:
- ✅ Has `-----BEGIN OPENSSH PRIVATE KEY-----`
- ✅ Has key content
- ✅ Has `-----END OPENSSH PRIVATE KEY-----`
- ✅ Public key matches: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGCEvp20a2KpkZUvbtYdKtrh/P80ZxO+2PcqSBgbtsNG`

## Step 1: Verify Server Has Matching Key

**On the server** (you're already connected):

```bash
cat ~/.ssh/authorized_keys
```

**Expected output:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGCEvp20a2KpkZUvbtYdKtrh/P80ZxO+2PcqSBgbtsNG iversen@iversens-MacBook-Air.local
```

If it matches, proceed to Step 2. If not, add it:
```bash
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGCEvp20a2KpkZUvbtYdKtrh/P80ZxO+2PcqSBgbtsNG iversen@iversens-MacBook-Air.local" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Step 2: Copy Your Private Key

**On your local machine**, copy this EXACT text:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBghL6dtGtiqZGVL27WHSra4fz/NGcTvtj3KkgYG7bDRgAAAKjbnN4h25ze
IQAAAAtzc2gtZWQyNTUxOQAAACBghL6dtGtiqZGVL27WHSra4fz/NGcTvtj3KkgYG7bDRg
AAAEDMTvyae2WPqT9r74sV43WBzqE9t5f6jUekhbYSZPVtVGCEvp20a2KpkZUvbtYdKtrh
/P80ZxO+2PcqSBgbtsNGAAAAIml2ZXJzZW5AaXZlcnNlbnMtTWFjQm9vay1BaXIubG9jYW
wBAgM=
-----END OPENSSH PRIVATE KEY-----
```

**Important:** Copy ALL lines including the blank line at the end.

## Step 3: Update GitHub Secret

1. **Go to GitHub:**
   - Open: https://github.com/vevevedk/vvv-frontpage/settings/secrets/actions

2. **Find SSH_PRIVATE_KEY:**
   - Look for `SSH_PRIVATE_KEY` in the list
   - Click on it (or the pencil/edit icon)

3. **Update the value:**
   - Click **"Update"** button
   - **Select ALL text** in the "Value" field and delete it
   - **Paste your private key** (from Step 2 above)
   - Make sure it includes:
     - The BEGIN line
     - All 5 lines of key content
     - The END line
     - A blank line at the end (optional but fine)
   - Click **"Update secret"**

4. **Verify:**
   - You should see "Secret updated" confirmation
   - The secret should show as masked (`••••••••`)

## Step 4: Test Deployment

1. Go to: https://github.com/vevevedk/vvv-frontpage/actions
2. Click **"Deploy to Production"** workflow
3. Click **"Run workflow"** (top right)
4. Select **"main"** branch
5. Click **"Run workflow"**
6. Watch the **"Deploy to Server"** job

**Success:** You should see SSH connection succeed and the deployment script start running.

**If it still fails:** Check the error message and let me know what it says.

