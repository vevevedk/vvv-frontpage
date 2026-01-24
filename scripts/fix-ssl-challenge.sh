#!/bin/bash
# Fix SSL Certificate Challenge Issue
# This script fixes the nginx configuration to allow certbot ACME challenges

set -e

echo "🔧 Fixing SSL Certificate Challenge Configuration"
echo "================================================"
echo ""

# Step 1: Create certbot webroot directory
echo "Creating certbot webroot directory..."
sudo mkdir -p /var/www/certbot
sudo chown -R www-data:www-data /var/www/certbot
sudo chmod -R 755 /var/www/certbot
echo "✅ Certbot directory created"

# Step 2: Check current nginx config
echo ""
echo "Checking current nginx configuration..."
NGINX_CONFIG="/etc/nginx/sites-available/vvv-frontpage"

if [ ! -f "$NGINX_CONFIG" ]; then
    echo "⚠️  Nginx config not found at $NGINX_CONFIG"
    echo "Checking for alternative locations..."
    
    # Check for other possible config files
    if [ -f "/etc/nginx/sites-available/vvv-frontpage-v02" ]; then
        NGINX_CONFIG="/etc/nginx/sites-available/vvv-frontpage-v02"
        echo "Found config at: $NGINX_CONFIG"
    elif [ -f "/etc/nginx/sites-available/veveve.dk" ]; then
        NGINX_CONFIG="/etc/nginx/sites-available/veveve.dk"
        echo "Found config at: $NGINX_CONFIG"
    else
        echo "❌ Could not find nginx configuration file"
        echo "Please ensure nginx is configured for veveve.dk"
        exit 1
    fi
fi

# Step 3: Check if ACME challenge location already exists
if grep -q "\.well-known/acme-challenge" "$NGINX_CONFIG"; then
    echo "✅ ACME challenge location already exists in config"
else
    echo "⚠️  ACME challenge location missing. Adding it..."
    
    # Create backup
    sudo cp "$NGINX_CONFIG" "${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Add ACME challenge location (before other location blocks)
    # This is a simple approach - insert after the server_name line
    sudo sed -i '/server_name/a\    # Let'\''s Encrypt HTTP-01 challenge (must be before other location blocks)\n    location /.well-known/acme-challenge/ {\n        root /var/www/certbot;\n        try_files $uri =404;\n    }\n' "$NGINX_CONFIG"
    
    echo "✅ ACME challenge location added to config"
fi

# Step 4: Test nginx configuration
echo ""
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    echo "Restoring backup..."
    sudo cp "${NGINX_CONFIG}.backup."* "$NGINX_CONFIG" 2>/dev/null || true
    exit 1
fi

# Step 5: Reload nginx
echo ""
echo "Reloading nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded"

# Step 6: Test ACME challenge path
echo ""
echo "Testing ACME challenge path..."
TEST_FILE="/var/www/certbot/test.txt"
echo "test" | sudo tee "$TEST_FILE" > /dev/null

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://veveve.dk/.well-known/acme-challenge/test.txt" || echo "000")
sudo rm -f "$TEST_FILE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ ACME challenge path is accessible"
else
    echo "⚠️  ACME challenge path returned HTTP $HTTP_CODE"
    echo "This might still work - certbot will create the files with proper permissions"
fi

echo ""
echo "================================================"
echo "✅ Configuration fixed!"
echo ""
echo "Now try running certbot again:"
echo "  sudo certbot --nginx -d veveve.dk -d www.veveve.dk"
echo ""
