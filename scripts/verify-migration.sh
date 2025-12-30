#!/bin/bash

#############################################
# VVV Frontpage - Post-Migration Verification
# Verifies that migration was successful
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

ERRORS=0
WARNINGS=0

# Check Docker services
check_docker_services() {
    print_header "Checking Docker Services"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "docker-compose not found"
        ((ERRORS++))
        return
    fi
    
    # Check if services are running
    RUNNING=$(docker-compose ps --services --filter "status=running" 2>/dev/null | wc -l)
    TOTAL=$(docker-compose config --services 2>/dev/null | wc -l)
    
    if [ "$RUNNING" -eq "$TOTAL" ]; then
        print_success "All services running ($RUNNING/$TOTAL)"
    else
        print_error "Some services not running ($RUNNING/$TOTAL)"
        docker-compose ps
        ((ERRORS++))
    fi
}

# Check database connectivity
check_database() {
    print_header "Checking Database"
    
    if docker-compose ps postgres | grep -q "Up"; then
        print_success "Postgres container is running"
        
        # Test connection
        if docker-compose exec -T postgres psql -U vvv_user -d vvv_database -c "SELECT 1;" > /dev/null 2>&1; then
            print_success "Database connection successful"
            
            # Check for data
            CLIENT_COUNT=$(docker-compose exec -T postgres psql -U vvv_user -d vvv_database -t -c "SELECT COUNT(*) FROM clients;" 2>/dev/null | tr -d ' \n')
            if [ -n "$CLIENT_COUNT" ] && [ "$CLIENT_COUNT" != "0" ]; then
                print_success "Database has data: $CLIENT_COUNT client(s)"
            else
                print_warning "Database appears empty (no clients found)"
                ((WARNINGS++))
            fi
        else
            print_error "Database connection failed"
            ((ERRORS++))
        fi
    else
        print_error "Postgres container not running"
        ((ERRORS++))
    fi
}

# Check Redis
check_redis() {
    print_header "Checking Redis"
    
    if docker-compose ps redis | grep -q "Up"; then
        print_success "Redis container is running"
        
        if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
            print_success "Redis connection successful"
        else
            print_warning "Redis connection test failed"
            ((WARNINGS++))
        fi
    else
        print_error "Redis container not running"
        ((ERRORS++))
    fi
}

# Check frontend
check_frontend() {
    print_header "Checking Frontend"
    
    if docker-compose ps frontend | grep -q "Up"; then
        print_success "Frontend container is running"
        
        # Check if frontend responds
        if curl -sf http://localhost:3000 > /dev/null 2>&1; then
            print_success "Frontend responding on port 3000"
        else
            print_warning "Frontend not responding on port 3000"
            ((WARNINGS++))
        fi
        
        # Check health endpoint
        if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
            print_success "Frontend health endpoint responding"
        else
            print_warning "Frontend health endpoint not responding"
            ((WARNINGS++))
        fi
    else
        print_error "Frontend container not running"
        ((ERRORS++))
    fi
}

# Check backend
check_backend() {
    print_header "Checking Backend"
    
    if docker-compose ps backend | grep -q "Up"; then
        print_success "Backend container is running"
        
        # Check if backend responds
        if curl -sf http://localhost:8001/api/health/ > /dev/null 2>&1 || curl -sf http://localhost:8001/api/test/ > /dev/null 2>&1; then
            print_success "Backend responding on port 8001"
        else
            print_warning "Backend not responding on port 8001"
            ((WARNINGS++))
        fi
    else
        print_error "Backend container not running"
        ((ERRORS++))
    fi
}

# Check Nginx
check_nginx() {
    print_header "Checking Nginx"
    
    if systemctl is-active --quiet nginx 2>/dev/null; then
        print_success "Nginx service is running"
        
        if sudo nginx -t > /dev/null 2>&1; then
            print_success "Nginx configuration is valid"
        else
            print_error "Nginx configuration has errors"
            sudo nginx -t
            ((ERRORS++))
        fi
        
        # Check if veveve.dk config exists
        if [ -f "/etc/nginx/sites-available/veveve.dk" ]; then
            print_success "Nginx config file exists"
        else
            print_warning "Nginx config file not found"
            ((WARNINGS++))
        fi
    else
        print_warning "Nginx service not running (may be using container nginx)"
        ((WARNINGS++))
    fi
}

# Check SSL
check_ssl() {
    print_header "Checking SSL Certificate"
    
    if [ -f "/etc/letsencrypt/live/veveve.dk/fullchain.pem" ]; then
        print_success "SSL certificate file exists"
        
        # Check expiration
        EXPIRY=$(sudo openssl x509 -enddate -noout -in /etc/letsencrypt/live/veveve.dk/fullchain.pem 2>/dev/null | cut -d= -f2)
        if [ -n "$EXPIRY" ]; then
            print_info "Certificate expires: $EXPIRY"
        fi
    else
        print_warning "SSL certificate not found (may need to run certbot)"
        ((WARNINGS++))
    fi
}

# Check external access
check_external() {
    print_header "Checking External Access"
    
    DOMAIN="${1:-veveve.dk}"
    
    # Check DNS
    DNS_IP=$(dig +short $DOMAIN | tail -1)
    if [ -n "$DNS_IP" ]; then
        print_success "DNS resolves: $DOMAIN -> $DNS_IP"
        
        # Check if it's pointing to this server
        SERVER_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "unknown")
        if [ "$DNS_IP" = "$SERVER_IP" ] || [ "$SERVER_IP" = "unknown" ]; then
            print_info "DNS appears to point to this server"
        else
            print_warning "DNS may not point to this server (DNS: $DNS_IP, Server: $SERVER_IP)"
            ((WARNINGS++))
        fi
    else
        print_warning "DNS not resolving for $DOMAIN"
        ((WARNINGS++))
    fi
    
    # Check HTTPS
    if curl -sfI "https://$DOMAIN" > /dev/null 2>&1; then
        print_success "HTTPS accessible: https://$DOMAIN"
    else
        print_warning "HTTPS not accessible: https://$DOMAIN"
        ((WARNINGS++))
    fi
    
    # Check API health
    if curl -sf "https://$DOMAIN/api/health" > /dev/null 2>&1; then
        print_success "API health endpoint accessible"
    else
        print_warning "API health endpoint not accessible"
        ((WARNINGS++))
    fi
}

# Check environment files
check_environment() {
    print_header "Checking Environment Files"
    
    if [ -f "env/backend.env" ]; then
        print_success "Backend environment file exists"
        
        # Check for required variables
        if grep -q "DJANGO_SECRET_KEY" env/backend.env; then
            print_success "DJANGO_SECRET_KEY is set"
        else
            print_warning "DJANGO_SECRET_KEY not found in backend.env"
            ((WARNINGS++))
        fi
    else
        print_error "Backend environment file not found"
        ((ERRORS++))
    fi
    
    if [ -f "env/frontend.env" ]; then
        print_success "Frontend environment file exists"
        
        if grep -q "NEXT_PUBLIC_API_URL" env/frontend.env; then
            print_success "NEXT_PUBLIC_API_URL is set"
        else
            print_warning "NEXT_PUBLIC_API_URL not found in frontend.env"
            ((WARNINGS++))
        fi
    else
        print_error "Frontend environment file not found"
        ((ERRORS++))
    fi
}

# Main
main() {
    print_header "VVV Frontpage Migration Verification"
    
    APP_DIR="${APP_DIR:-/opt/vvv-frontpage}"
    if [ ! -d "$APP_DIR" ]; then
        APP_DIR="/var/www/vvv-frontpage"
    fi
    if [ ! -d "$APP_DIR" ]; then
        APP_DIR="$HOME/vvv-frontpage"
    fi
    
    if [ ! -d "$APP_DIR" ]; then
        print_error "Application directory not found: $APP_DIR"
        exit 1
    fi
    
    cd "$APP_DIR"
    
    check_docker_services
    check_database
    check_redis
    check_frontend
    check_backend
    check_nginx
    check_ssl
    check_environment
    
    # External checks (optional, pass domain as argument)
    if [ -n "$1" ]; then
        check_external "$1"
    fi
    
    # Summary
    print_header "Verification Summary"
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        print_success "All checks passed! Migration appears successful."
        exit 0
    elif [ $ERRORS -eq 0 ]; then
        print_warning "Migration completed with $WARNINGS warning(s). Review warnings above."
        exit 0
    else
        print_error "Migration verification failed with $ERRORS error(s) and $WARNINGS warning(s)."
        exit 1
    fi
}

main "$@"

