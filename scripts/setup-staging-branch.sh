#!/usr/bin/env bash
set -euo pipefail

#############################################
# Setup Staging Branch
# Creates staging branch and prepares for CI/CD
#############################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo "🚀 Setting Up Staging Branch"
echo "============================"
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    print_error "Not in a git repository"
    exit 1
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

# Check if staging branch already exists
if git show-ref --verify --quiet refs/heads/staging; then
    print_warning "Staging branch already exists locally"
    read -p "Do you want to switch to it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout staging
        print_success "Switched to staging branch"
    else
        print_info "Keeping current branch"
        exit 0
    fi
else
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "You have uncommitted changes"
        echo ""
        echo "Options:"
        echo "1. Commit changes first"
        echo "2. Stash changes"
        echo "3. Create staging branch anyway (changes will come with you)"
        read -p "Choose option (1/2/3): " -n 1 -r
        echo
        case $REPLY in
            1)
                print_info "Please commit your changes first:"
                echo "  git add ."
                echo "  git commit -m 'your message'"
                exit 0
                ;;
            2)
                git stash
                print_success "Changes stashed"
                ;;
            3)
                print_info "Creating staging branch with uncommitted changes"
                ;;
        esac
    fi
    
    # Create staging branch from current branch
    print_info "Creating staging branch from $CURRENT_BRANCH..."
    git checkout -b staging
    print_success "Created staging branch"
fi

# Check if staging branch exists on remote
if git show-ref --verify --quiet refs/remotes/origin/staging; then
    print_info "Staging branch already exists on remote"
    print_info "Pulling latest changes..."
    git pull origin staging || true
else
    print_info "Pushing staging branch to remote..."
    if git push -u origin staging; then
        print_success "Staging branch pushed to remote"
    else
        print_error "Failed to push staging branch"
        print_info "You may need to push manually: git push -u origin staging"
        exit 1
    fi
fi

echo ""
echo "============================"
print_success "Staging branch setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure GitHub Environments (see GITHUB_ENVIRONMENTS_SETUP.md)"
echo "2. Make a test commit and push to staging to trigger deployment"
echo ""
