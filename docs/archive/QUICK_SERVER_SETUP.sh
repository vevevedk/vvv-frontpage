#!/bin/bash

#############################################
# Quick Server Setup Script
# Run this on the new server to prepare for deployment
#############################################

set -e

echo "🚀 Setting up /var/www/vvv-frontpage directory..."

# Create directory structure
sudo mkdir -p /var/www/vvv-frontpage
sudo chown -R vvv-web-deploy:vvv-web-deploy /var/www/vvv-frontpage

# Verify
ls -la /var/www/

echo "✅ Directory created: /var/www/vvv-frontpage"
echo "✅ Permissions set: vvv-web-deploy:vvv-web-deploy"
echo ""
echo "Next steps:"
echo "1. Trigger GitHub Actions deployment (push to main or manual trigger)"
echo "2. After first deployment, edit env files:"
echo "   cd /var/www/vvv-frontpage"
echo "   nano env/backend.env"
echo "   nano env/frontend.env"
echo "3. Restart services: docker-compose up -d"


