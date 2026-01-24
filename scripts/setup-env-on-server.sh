#!/bin/bash

#############################################
# Setup Environment Files on Server
# Run this on the server after first deployment
#############################################

set -e

# Colors
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

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

APP_DIR="${APP_DIR:-/var/www/vvv-frontpage}"

if [ ! -d "$APP_DIR" ]; then
    print_warning "Application directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

print_header "Setting Up Environment Files"

# Generate secure keys
DJANGO_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)

print_info "Generated secure keys:"
print_info "  DJANGO_SECRET_KEY: ${DJANGO_SECRET:0:20}..."
print_info "  JWT_SECRET: ${JWT_SECRET:0:20}..."
print_info "  DB_PASSWORD: ${DB_PASSWORD:0:20}..."

# Setup backend.env
if [ -f "env/backend.env" ]; then
    print_warning "env/backend.env already exists, backing up..."
    cp env/backend.env "env/backend.env.backup.$(date +%Y%m%d-%H%M%S)"
fi

if [ -f "env/backend.prod.template" ]; then
    print_info "Creating env/backend.env from template..."
    sed -e "s|<generate-with-openssl-rand-base64-32>|$DJANGO_SECRET|g" \
        -e "s|<generate-secure-password>|$DB_PASSWORD|g" \
        env/backend.prod.template > env/backend.env
    print_success "env/backend.env created"
else
    print_warning "Template not found, creating from example..."
    if [ -f "env/backend.env.example" ]; then
        cp env/backend.env.example env/backend.env
        # Update values
        sed -i "s|DJANGO_SECRET_KEY=.*|DJANGO_SECRET_KEY=$DJANGO_SECRET|g" env/backend.env
        sed -i "s|DATABASE_PASSWORD=.*|DATABASE_PASSWORD=$DB_PASSWORD|g" env/backend.env
        sed -i "s|ALLOWED_HOSTS=.*|ALLOWED_HOSTS=veveve.dk,www.veveve.dk,143.198.105.78|g" env/backend.env
        print_success "env/backend.env created from example"
    else
        print_warning "No template or example found. Please create env/backend.env manually."
    fi
fi

# Setup frontend.env
if [ -f "env/frontend.env" ]; then
    print_warning "env/frontend.env already exists, backing up..."
    cp env/frontend.env "env/frontend.env.backup.$(date +%Y%m%d-%H%M%S)"
fi

if [ -f "env/frontend.prod.template" ]; then
    print_info "Creating env/frontend.env from template..."
    sed -e "s|<generate-with-openssl-rand-base64-32>|$JWT_SECRET|g" \
        -e "s|<same-as-backend-DATABASE_PASSWORD>|$DB_PASSWORD|g" \
        env/frontend.prod.template > env/frontend.env
    print_success "env/frontend.env created"
else
    print_warning "Template not found, creating from example..."
    if [ -f "env/frontend.env.example" ]; then
        cp env/frontend.env.example env/frontend.env
        # Update values
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|g" env/frontend.env
        sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|g" env/frontend.env
        sed -i "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=https://veveve.dk|g" env/frontend.env
        sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=https://veveve.dk/api|g" env/frontend.env
        print_success "env/frontend.env created from example"
    else
        print_warning "No template or example found. Please create env/frontend.env manually."
    fi
fi

print_header "Environment Files Setup Complete"

print_info "Files created:"
print_info "  - env/backend.env"
print_info "  - env/frontend.env"

print_warning "⚠️  IMPORTANT: Review and update the environment files:"
print_info "   nano env/backend.env"
print_info "   nano env/frontend.env"

print_info ""
print_info "Next steps:"
print_info "1. Review environment files (update any missing values)"
print_info "2. Start services: docker-compose up -d"
print_info "3. Run migrations: docker-compose exec backend python manage.py migrate"
print_info "4. Setup Nginx: sudo cp deploy/vvv-frontpage-v02.conf /etc/nginx/sites-available/vvv-frontpage"


