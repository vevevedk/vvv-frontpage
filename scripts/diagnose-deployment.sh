#!/bin/bash
# Diagnostic script for vvv-frontpage deployment on vvv-app-web-v02
# Run this on the server to identify issues

set -e

echo "=== vvv-frontpage Deployment Diagnostics ==="
echo ""

# Check Docker containers
echo "1. Docker Containers Status:"
cd /var/www/vvv-frontpage
docker-compose ps
echo ""

# Check if Nginx config exists
echo "2. Nginx Configuration Files:"
if [ -f "/etc/nginx/sites-available/vvv-frontpage" ]; then
    echo "✅ Config file exists: /etc/nginx/sites-available/vvv-frontpage"
else
    echo "❌ Config file missing: /etc/nginx/sites-available/vvv-frontpage"
fi

if [ -L "/etc/nginx/sites-enabled/vvv-frontpage" ]; then
    echo "✅ Site is enabled: /etc/nginx/sites-enabled/vvv-frontpage"
elif [ -f "/etc/nginx/sites-enabled/vvv-frontpage" ]; then
    echo "✅ Site is enabled: /etc/nginx/sites-enabled/vvv-frontpage (file, not symlink)"
else
    echo "❌ Site is NOT enabled: /etc/nginx/sites-enabled/vvv-frontpage"
fi
echo ""

# Check Nginx status
echo "3. Nginx Status:"
sudo systemctl status nginx --no-pager | head -10
echo ""

# Check what Nginx is listening on
echo "4. Nginx Listening Ports:"
sudo netstat -tlnp | grep nginx || sudo ss -tlnp | grep nginx || echo "Could not check listening ports"
echo ""

# Check if port 80 is open
echo "5. Port 80 Status:"
if sudo netstat -tlnp | grep -q ":80 " || sudo ss -tlnp | grep -q ":80 "; then
    echo "✅ Port 80 is listening"
else
    echo "❌ Port 80 is NOT listening"
fi
echo ""

# Test local connectivity
echo "6. Local Service Connectivity:"
echo "Frontend (port 3000):"
curl -s -o /dev/null -w "  HTTP Status: %{http_code}\n" http://127.0.0.1:3000/ || echo "  ❌ Failed to connect"
echo ""

echo "Backend (port 8001):"
curl -s -o /dev/null -w "  HTTP Status: %{http_code}\n" http://127.0.0.1:8001/api/health || echo "  ❌ Failed to connect"
echo ""

echo "Nginx health endpoint:"
curl -s -o /dev/null -w "  HTTP Status: %{http_code}\n" http://127.0.0.1/health || echo "  ❌ Failed to connect"
echo ""

# Check environment files
echo "7. Environment Files:"
if [ -f "/var/www/vvv-frontpage/env/backend.env" ]; then
    echo "✅ backend.env exists"
    if grep -q "SECURE_SSL_REDIRECT" /var/www/vvv-frontpage/env/backend.env; then
        echo "   SECURE_SSL_REDIRECT setting:"
        grep "SECURE_SSL_REDIRECT" /var/www/vvv-frontpage/env/backend.env || echo "   (not found)"
    fi
else
    echo "❌ backend.env missing"
fi

if [ -f "/var/www/vvv-frontpage/env/frontend.env" ]; then
    echo "✅ frontend.env exists"
else
    echo "❌ frontend.env missing"
fi
echo ""

# Check DNS
echo "8. DNS Resolution:"
echo "veveve.dk:"
dig +short veveve.dk || echo "  ❌ DNS lookup failed"
echo "www.veveve.dk:"
dig +short www.veveve.dk || echo "  ❌ DNS lookup failed"
echo ""

# Check firewall
echo "9. Firewall Status (if ufw is installed):"
if command -v ufw &> /dev/null; then
    sudo ufw status | head -5
else
    echo "ufw not installed (check iptables or cloud firewall)"
fi
echo ""

echo "=== Diagnostics Complete ==="
echo ""
echo "Next steps:"
echo "1. If Nginx site is not enabled, run:"
echo "   sudo ln -sf /etc/nginx/sites-available/vvv-frontpage /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "2. If backend is redirecting to HTTPS, check env/backend.env for SECURE_SSL_REDIRECT"
echo "   Set SECURE_SSL_REDIRECT=False for HTTP testing"
echo ""
echo "3. If port 80 is not listening, check Nginx config and firewall rules"

