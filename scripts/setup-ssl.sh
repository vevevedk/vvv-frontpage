#!/bin/bash
# SSL Setup Script for veveve.dk
# This script installs certbot and configures SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

DOMAIN="veveve.dk"
WWW_DOMAIN="www.veveve.dk"

echo "🔒 SSL Certificate Setup for $DOMAIN"
echo "======================================"
echo ""

# Step 1: Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    print_status "Checking sudo access..."
    if ! sudo -n true 2>/dev/null; then
        print_error "This script needs sudo privileges. Please run with sudo or as root."
        exit 1
    fi
    SUDO="sudo"
else
    SUDO=""
fi

print_success "Have required privileges"

# Step 2: Check if certbot is installed
print_status "Checking if certbot is installed..."
if command -v certbot &> /dev/null; then
    CERTBOT_VERSION=$(certbot --version | cut -d' ' -f2)
    print_success "Certbot is installed (version: $CERTBOT_VERSION)"
else
    print_warning "Certbot is not installed. Installing now..."
    
    print_status "Updating package list..."
    $SUDO apt update
    
    print_status "Installing certbot and nginx plugin..."
    $SUDO apt install -y certbot python3-certbot-nginx
    
    if command -v certbot &> /dev/null; then
        print_success "Certbot installed successfully"
    else
        print_error "Failed to install certbot"
        exit 1
    fi
fi

# Step 3: Verify DNS is pointing to this server
print_status "Verifying DNS configuration..."
CURRENT_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "unknown")
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1 || echo "unknown")

if [ "$DOMAIN_IP" != "unknown" ] && [ "$DOMAIN_IP" != "" ]; then
    print_status "Domain $DOMAIN resolves to: $DOMAIN_IP"
    print_status "Current server IP: $CURRENT_IP"
    
    if [ "$DOMAIN_IP" = "$CURRENT_IP" ]; then
        print_success "DNS is correctly pointing to this server"
    else
        print_warning "DNS may not be pointing to this server yet"
        print_warning "Domain IP: $DOMAIN_IP, Server IP: $CURRENT_IP"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Aborted. Please update DNS first."
            exit 1
        fi
    fi
else
    print_warning "Could not resolve DNS for $DOMAIN. Continuing anyway..."
fi

# Step 4: Check if nginx is running and configured
print_status "Checking Nginx status..."
if $SUDO systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx is not running. Please start it first: sudo systemctl start nginx"
    exit 1
fi

print_status "Checking Nginx configuration..."
if [ -f "/etc/nginx/sites-available/vvv-frontpage" ] || [ -f "/etc/nginx/sites-available/vvv-frontpage-v02" ]; then
    print_success "Nginx site configuration found"
    
    # Test nginx config
    if $SUDO nginx -t 2>&1 | grep -q "successful"; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration has errors:"
        $SUDO nginx -t
        exit 1
    fi
else
    print_warning "Nginx site configuration not found at standard location"
    print_status "This is okay - certbot will configure it automatically"
fi

# Step 5: Check if port 80 is open
print_status "Checking if port 80 is accessible..."
if $SUDO netstat -tlnp | grep -q ":80 " || $SUDO ss -tlnp | grep -q ":80 "; then
    print_success "Port 80 is listening"
else
    print_error "Port 80 is not listening. Nginx needs to listen on port 80 for certbot to work."
    exit 1
fi

# Step 6: Check if certificates already exist
print_status "Checking for existing certificates..."
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    print_warning "SSL certificates already exist for $DOMAIN"
    read -p "Do you want to renew/reinstall? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Checking certificate expiration..."
        $SUDO certbot certificates
        print_success "Using existing certificates"
        exit 0
    fi
fi

# Step 7: Run certbot to configure SSL
print_status "Configuring SSL certificate with certbot..."
print_status "This will:"
print_status "  1. Request certificates from Let's Encrypt"
print_status "  2. Automatically configure Nginx for HTTPS"
print_status "  3. Set up automatic renewal"
echo ""

$SUDO certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --redirect

if [ $? -eq 0 ]; then
    print_success "SSL certificate configured successfully!"
else
    print_error "SSL certificate configuration failed"
    exit 1
fi

# Step 8: Verify SSL certificate
print_status "Verifying SSL certificate..."
sleep 2

if $SUDO certbot certificates | grep -q "$DOMAIN"; then
    print_success "Certificate found in certbot"
else
    print_warning "Certificate not found in certbot list, but installation may have succeeded"
fi

# Step 9: Test HTTPS connection
print_status "Testing HTTPS connection..."
sleep 3

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I --max-time 10 https://$DOMAIN 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
    print_success "HTTPS is working! (HTTP Status: $HTTP_STATUS)"
else
    print_warning "HTTPS test returned status: $HTTP_STATUS"
    print_warning "This might be normal if the site redirects or requires authentication"
fi

# Step 10: Verify auto-renewal is set up
print_status "Checking auto-renewal setup..."
if $SUDO systemctl is-enabled certbot.timer &> /dev/null; then
    print_success "Certbot auto-renewal timer is enabled"
else
    print_warning "Certbot auto-renewal timer is not enabled"
    print_status "Enabling auto-renewal..."
    $SUDO systemctl enable certbot.timer
    $SUDO systemctl start certbot.timer
    print_success "Auto-renewal enabled"
fi

# Step 11: Test renewal (dry-run)
print_status "Testing certificate renewal (dry-run)..."
if $SUDO certbot renew --dry-run 2>&1 | grep -q "Congratulations"; then
    print_success "Certificate renewal test passed"
else
    print_warning "Certificate renewal test had issues (this may be normal)"
fi

# Summary
echo ""
echo "======================================"
print_success "SSL Setup Complete!"
echo ""
echo "Summary:"
echo "  - Domain: $DOMAIN, $WWW_DOMAIN"
echo "  - SSL certificate: /etc/letsencrypt/live/$DOMAIN"
echo "  - Auto-renewal: Enabled"
echo ""
echo "Next steps:"
echo "  1. Test the website: https://$DOMAIN"
echo "  2. Update backend env if needed (SECURE_SSL_REDIRECT=True)"
echo "  3. Monitor certificate expiration: sudo certbot certificates"
echo ""
