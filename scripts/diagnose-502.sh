#!/bin/bash

# Diagnose 502 Bad Gateway errors for veveve.dk ONLY
# This script ONLY checks veveve.dk and will NOT affect other applications

set -e

# SAFETY: Only work with veveve.dk
TARGET_DOMAIN="veveve.dk"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo "🔍 Diagnosing 502 Bad Gateway Errors for veveve.dk ONLY"
echo "======================================================="
echo "⚠️  This script will ONLY check veveve.dk"
echo "⚠️  Other applications will NOT be affected"
echo ""

# Check if we're on the production server
if [[ ! -f "docker-compose.yml" ]]; then
    print_error "docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

echo ""
print_info "1. Checking Docker container status..."
docker-compose ps

echo ""
print_info "2. Checking port availability..."
echo "Port 3000 (Frontend):"
if lsof -i :3000 > /dev/null 2>&1; then
    lsof -i :3000
    print_status "Port 3000 is in use"
else
    print_error "Port 3000 is NOT in use"
fi

echo ""
echo "Port 8001 (Backend):"
if lsof -i :8001 > /dev/null 2>&1; then
    lsof -i :8001
    print_status "Port 8001 is in use"
else
    print_error "Port 8001 is NOT in use"
fi

echo ""
print_info "3. Testing local connectivity..."
echo "Testing localhost:3000 (Frontend):"
if curl -f -s --max-time 5 http://localhost:3000 > /dev/null; then
    print_status "Frontend responding on localhost:3000"
else
    print_error "Frontend NOT responding on localhost:3000"
fi

echo ""
echo "Testing localhost:8001/api (Backend):"
if curl -f -s --max-time 5 http://localhost:8001/api/ > /dev/null; then
    print_status "Backend API responding on localhost:8001"
else
    print_error "Backend API NOT responding on localhost:8001"
fi

echo ""
print_info "4. Checking nginx configuration..."
if sudo nginx -t 2>/dev/null; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration has errors:"
    sudo nginx -t
fi

echo ""
print_info "5. Checking nginx error logs..."
if [[ -f "/var/log/nginx/error.log" ]]; then
    echo "Recent nginx errors:"
    sudo tail -10 /var/log/nginx/error.log | grep -E "(error|502|Bad Gateway)" || echo "No recent errors found"
else
    print_warning "Nginx error log not found"
fi

echo ""
print_info "6. Checking container logs..."
echo "Frontend logs (last 5 lines):"
docker-compose logs frontend --tail=5 2>/dev/null || print_error "Could not get frontend logs"

echo ""
echo "Backend logs (last 5 lines):"
docker-compose logs backend --tail=5 2>/dev/null || print_error "Could not get backend logs"

echo ""
print_info "7. Checking nginx configuration file..."
if [[ -f "/etc/nginx/sites-enabled/veveve.dk" ]]; then
    print_status "Nginx config file exists"
    echo "Backend proxy_pass setting:"
    grep -A 1 "location /api/" /etc/nginx/sites-enabled/veveve.dk || echo "No /api/ location found"
    echo ""
    echo "Frontend proxy_pass setting:"
    grep -A 1 "location / {" /etc/nginx/sites-enabled/veveve.dk || echo "No root location found"
else
    print_error "Nginx config file not found at /etc/nginx/sites-enabled/veveve.dk"
fi

echo ""
print_info "8. Testing external connectivity for veveve.dk..."
if curl -f -s --max-time 10 https://$TARGET_DOMAIN > /dev/null; then
    print_status "$TARGET_DOMAIN is accessible externally"
else
    print_error "$TARGET_DOMAIN is NOT accessible externally"
fi

echo ""
print_info "9. Summary and recommendations..."
echo "====================================="

# Count issues
issues=0

if ! lsof -i :3000 > /dev/null 2>&1; then
    ((issues++))
    echo "❌ Issue $issues: Frontend not running on port 3000"
fi

if ! lsof -i :8001 > /dev/null 2>&1; then
    ((issues++))
    echo "❌ Issue $issues: Backend not running on port 8001"
fi

if ! curl -f -s --max-time 5 http://localhost:3000 > /dev/null; then
    ((issues++))
    echo "❌ Issue $issues: Frontend not responding locally"
fi

if ! curl -f -s --max-time 5 http://localhost:8001/api/ > /dev/null; then
    ((issues++))
    echo "❌ Issue $issues: Backend not responding locally"
fi

if [[ $issues -eq 0 ]]; then
    print_status "No obvious issues found. The problem might be nginx configuration or external connectivity."
    echo ""
    echo "📋 Next steps:"
    echo "1. Run: sudo systemctl reload nginx"
    echo "2. Check: curl -I https://veveve.dk"
    echo "3. If still failing, run: ./scripts/fix-502-errors.sh"
else
    echo ""
    print_warning "Found $issues issues that need to be fixed."
    echo ""
    echo "📋 Recommended fix:"
    echo "Run: ./scripts/fix-502-errors.sh"
fi

echo ""





