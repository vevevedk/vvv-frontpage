#!/bin/bash
# Final fix for nginx config - restore clean and add ACME challenge properly

set -e

CONFIG="/etc/nginx/sites-available/vvv-frontpage"

echo "🔧 Fixing Nginx Configuration"
echo "============================="
echo ""

# Step 1: Restore from clean backup
echo "Restoring from clean backup..."
sudo cp "$CONFIG.backup" "$CONFIG"
echo "✅ Restored clean config"

# Step 2: Add ACME challenge block in the correct place
echo "Adding ACME challenge location block..."

# Create a temporary file
TEMP=$(mktemp)

# Use sed to insert the ACME challenge block right after server_name line
sudo sed '/server_name veveve.dk www.veveve.dk;/a\
    # Let'\''s Encrypt HTTP-01 challenge (must be before other location blocks)\
    location /.well-known/acme-challenge/ {\
        root /var/www/certbot;\
        try_files $uri =404;\
    }\
' "$CONFIG" > "$TEMP"

# Replace the config
sudo cp "$TEMP" "$CONFIG"
sudo chmod 644 "$CONFIG"
rm "$TEMP"

echo "✅ Added ACME challenge block"

# Step 3: Test nginx config
echo ""
echo "Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Configuration still has errors"
    echo "Restoring backup again..."
    sudo cp "$CONFIG.backup" "$CONFIG"
    exit 1
fi

# Step 4: Reload nginx
echo ""
echo "Reloading nginx..."
sudo systemctl reload nginx
echo "✅ Nginx reloaded successfully"

echo ""
echo "✅ Configuration fixed!"
echo ""
echo "Now you can run:"
echo "  sudo certbot --nginx -d veveve.dk -d www.veveve.dk"
echo ""
