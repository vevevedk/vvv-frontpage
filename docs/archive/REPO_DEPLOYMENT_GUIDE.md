# Repository Deployment Guide

**Issue**: GitHub no longer supports password authentication for Git operations. You must use either SSH keys or Personal Access Tokens.

---

## How veveve.dk Repository Was Deployed

The `veveve.dk` repository is deployed **automatically via GitHub Actions**, not manually cloned on the server.

### Deployment Process

1. **Push to GitHub** → Triggers GitHub Actions workflow
2. **GitHub Actions** → Builds Docker images and pushes to GitHub Container Registry
3. **GitHub Actions** → SSH's to server and runs deployment script
4. **Deployment Script** → Clones/pulls repository using GitHub Actions authentication (automatic)

The key is that **GitHub Actions has built-in authentication** - it doesn't need username/password.

---

## Solutions for Manual Repository Clone

If you need to manually clone a repository on the server, you have **three options**:

### Option 1: Use SSH with SSH Keys (Recommended)

**Step 1: Generate SSH Key on Server**

```bash
# On the server (as vvv-web-deploy user)
ssh-keygen -t ed25519 -C "deployment-key" -f ~/.ssh/github_deploy
```

**Step 2: Add Public Key to GitHub**

```bash
# Display the public key
cat ~/.ssh/github_deploy.pub
```

Then:
1. Go to GitHub → Settings → SSH and GPG keys
2. Click "New SSH key"
3. Paste the public key content
4. Save

**Step 3: Clone Using SSH**

```bash
# Use SSH URL instead of HTTPS
git clone git@github.com:vevevedk/smagalagellrup.git /opt/smagalagellerup
```

**Or configure Git to use SSH for GitHub:**

```bash
# Add to ~/.ssh/config
cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy
    IdentitiesOnly yes
EOF

chmod 600 ~/.ssh/config

# Now you can clone using HTTPS URL, but it will use SSH
git clone https://github.com/vevevedk/smagalagellrup.git /opt/smagalagellerup
```

---

### Option 2: Use HTTPS with Personal Access Token

**Step 1: Create Personal Access Token**

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name (e.g., "Server Deployment")
4. Select scopes: `repo` (full control of private repositories)
5. Generate token
6. **Copy the token immediately** (you won't see it again!)

**Step 2: Clone Using Token**

```bash
# Use token as password when prompted
git clone https://github.com/vevevedk/smagalagellrup.git /opt/smagalagellerup

# When prompted:
# Username: your-github-username
# Password: <paste-token-here>
```

**Or embed token in URL (less secure, but works):**

```bash
git clone https://<token>@github.com/vevevedk/smagalagellrup.git /opt/smagalagellerup
```

**Or configure Git credential helper:**

```bash
# Store credentials
git config --global credential.helper store

# Clone (will prompt once, then save)
git clone https://github.com/vevevedk/smagalagellrup.git /opt/smagalagellerup
# Enter username and token when prompted
```

---

### Option 3: Use GitHub Actions Deployment (Best for Production)

This is how `veveve.dk` is deployed. Set up automated deployment:

**Step 1: Create GitHub Actions Workflow**

Create `.github/workflows/deploy.yml` in the repository:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          port: ${{ secrets.SSH_PORT || 22 }}
          script: |
            set -e
            DEPLOY_DIR="/opt/smagalagellerup"
            
            # Clone if doesn't exist
            if [ ! -d "$DEPLOY_DIR/.git" ]; then
              mkdir -p "$DEPLOY_DIR"
              git clone https://github.com/${{ github.repository }}.git "$DEPLOY_DIR"
            else
              cd "$DEPLOY_DIR"
              git pull origin main
            fi
            
            # Your deployment commands here
            cd "$DEPLOY_DIR"
            # docker-compose up -d
            # etc.
```

**Step 2: Configure GitHub Secrets**

Repository → Settings → Secrets and variables → Actions:

- `SSH_HOST`: `143.198.105.78`
- `SSH_USER`: `vvv-web-deploy`
- `SSH_PRIVATE_KEY`: SSH private key for server access
- `SSH_PORT`: `22` (optional)

**Step 3: Deploy**

- Push to `main` branch (automatic), OR
- Go to Actions tab → Run workflow manually

**Benefits:**
- ✅ No authentication issues (GitHub Actions handles it)
- ✅ Automated deployments
- ✅ Consistent process
- ✅ No manual steps needed

---

## Quick Fix for Current Issue

For the immediate problem, use **Option 1 (SSH)** or **Option 2 (Personal Access Token)**:

### Quick SSH Setup

```bash
# On server
ssh-keygen -t ed25519 -C "deployment" -f ~/.ssh/github_deploy -N ""

# Display public key
cat ~/.ssh/github_deploy.pub

# Add this key to GitHub (Settings → SSH and GPG keys)

# Then clone using SSH
git clone git@github.com:vevevedk/smagalagellrup.git /opt/smagalagellerup
```

### Quick Token Setup

```bash
# Create token on GitHub (see instructions above)
# Then clone:
git clone https://github.com/vevevedk/smagalagellrup.git /opt/smagalagellerup
# Username: your-github-username
# Password: <paste-token>
```

---

## Complete Setup Script for smagalagellerup

Here's a complete script they can use:

```bash
#!/bin/bash
# Setup script for smagalagellerup deployment

set -e

# Configuration
REPO_URL="https://github.com/vevevedk/smagalagellrup.git"
DEPLOY_DIR="/opt/smagalagellerup"
DEPLOY_USER="vvv-web-deploy"

echo "🚀 Setting up smagalagellerup deployment"
echo "========================================"

# Step 1: Create directory
echo "📁 Creating directory..."
sudo mkdir -p "$DEPLOY_DIR"
sudo chown -R $DEPLOY_USER:$DEPLOY_USER "$DEPLOY_DIR"

# Step 2: Setup SSH key for GitHub (if not exists)
if [ ! -f ~/.ssh/github_deploy ]; then
    echo "🔑 Generating SSH key for GitHub..."
    ssh-keygen -t ed25519 -C "deployment-key" -f ~/.ssh/github_deploy -N ""
    echo ""
    echo "⚠️  IMPORTANT: Add this public key to GitHub:"
    echo "   Go to: GitHub → Settings → SSH and GPG keys → New SSH key"
    echo ""
    cat ~/.ssh/github_deploy.pub
    echo ""
    read -p "Press Enter after adding the key to GitHub..."
fi

# Step 3: Configure SSH for GitHub
if ! grep -q "Host github.com" ~/.ssh/config 2>/dev/null; then
    echo "⚙️  Configuring SSH for GitHub..."
    cat >> ~/.ssh/config << 'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/github_deploy
    IdentitiesOnly yes
EOF
    chmod 600 ~/.ssh/config
fi

# Step 4: Clone repository
echo "📦 Cloning repository..."
cd "$DEPLOY_DIR"
if [ -d ".git" ]; then
    echo "Repository already exists, pulling latest..."
    git pull origin main
else
    # Try SSH first, fallback to HTTPS with token
    if git clone git@github.com:vevevedk/smagalagellrup.git . 2>/dev/null; then
        echo "✅ Cloned using SSH"
    else
        echo "⚠️  SSH clone failed. Please use Personal Access Token:"
        echo "   1. Create token: GitHub → Settings → Developer settings → Personal access tokens"
        echo "   2. Clone manually: git clone https://github.com/vevevedk/smagalagellrup.git ."
        echo "   3. Use token as password when prompted"
        exit 1
    fi
fi

# Step 5: Setup Docker network
echo "🐳 Creating Docker network..."
docker network create web || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Review and configure environment files"
echo "  2. Start services: docker-compose up -d"
echo "  3. Configure Nginx"
echo "  4. Setup SSL certificate"
```

---

## Summary

**For veveve.dk**: Deployed via GitHub Actions (automatic, no manual clone needed)

**For smagalagellerup**: Choose one:
1. **SSH keys** (recommended for long-term)
2. **Personal Access Token** (quick fix)
3. **GitHub Actions** (best for production, like veveve.dk)

**The error they're seeing** is because GitHub deprecated password authentication. They must use one of the methods above.

---

## Additional Notes

### Why GitHub Actions Works

GitHub Actions has built-in authentication via `GITHUB_TOKEN` secret, so it can clone repositories without manual authentication. This is why the veveve.dk deployment works automatically.

### Security Best Practices

1. **SSH keys**: More secure, no token expiration
2. **Personal Access Tokens**: Set expiration date, limit scopes
3. **GitHub Actions**: Best for automated deployments

### Troubleshooting

**"Permission denied (publickey)"**:
- SSH key not added to GitHub
- Wrong SSH key being used
- SSH config not set up correctly

**"Invalid username or token"**:
- Token expired
- Token doesn't have `repo` scope
- Wrong token used

**"Repository not found"**:
- Repository is private and token/key doesn't have access
- Wrong repository URL
- Repository doesn't exist

---

**Last Updated**: January 11, 2026
