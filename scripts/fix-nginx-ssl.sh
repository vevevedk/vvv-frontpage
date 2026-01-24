#!/bin/bash
# Fix Nginx Config for SSL Certificate Setup
# This script properly adds the ACME challenge location to nginx config

set -e

NGINX_CONFIG="/etc/nginx/sites-available/vvv-frontpage"

echo "🔧 Fixing Nginx Configuration for SSL"
echo "======================================"
echo ""

# Step 1: Restore from backup if it exists
if [ -f "${NGINX_CONFIG}.backup" ]; then
    echo "Restoring from backup..."
    sudo cp "${NGINX_CONFIG}.backup" "$NGINX_CONFIG"
    echo "✅ Restored from backup"
fi

# Step 2: Check if config exists
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Config file not found: $NGINX_CONFIG"
    exit 1
fi

# Step 3: Create a temporary file with the ACME challenge block
TEMP_CONFIG=$(mktemp)

# Read the config and add ACME challenge block in the right place
sudo awk '
/server_name veveve.dk www.veveve.dk;/ {
    print $0
    
    # Check if ACME challenge block already exists
    getline
    if ($0 ~ /\.well-known\/acme-challenge/) {
        print $0
        # Skip the rest of the ACME challenge block if it exists
        while (getline > 0) {
            if ($0 ~ /^[[:space:]]*}[[:space:]]*$/) {
                print $0
                break
            }
            print $0
        }
    } else {
        # Add ACME challenge block
        print "    # Let'\''s Encrypt HTTP-01 challenge (must be before other location blocks)"
        print "    location /.well-known/acme-challenge/ {"
        print "        root /var/www/certbot;"
        print "        try_files $uri =404;"
        print "    }"
        print ""
        # Print the line we read
        print $0
    }
    next
}
{ print }
' "$NGINX_CONFIG" > "$TEMP_CONFIG"

# Step 4: Replace the config file
sudo cp "$TEMP_CONFIG" "$NGINX_CONFIG"
sudo chmod 644 "$NGINX_CONFIG"
rm "$TEMP_CONFIG"

echo "✅ Updated nginx configuration"

# Step 5: Test nginx configuration
echo ""
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    echo "Restoring backup..."
    if [ -f "${NGINX_CONFIG}.backup" ]; then
        sudo cp "${NGINX_CONFIG}.backup" "$NGINX_CONFIG"
    fi
    exit 1
fi

# Step 6: Reload nginx
echo ""
echo "Reloading nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded successfully"

echo ""
echo "✅ Configuration fixed!"
echo ""
echo "Now you can run:"
echo "  sudo certbot --nginx -d veveve.dk -d www.veveve.dk"
