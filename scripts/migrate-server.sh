#!/bin/bash

#############################################
# VVV Frontpage - Server Migration Script
# Helps migrate application from old server to new server
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

# Check if running on old or new server
MODE="${1:-export}"

if [ "$MODE" = "export" ]; then
    # EXPORT MODE: Run on OLD server
    print_header "Exporting Data from Old Server"
    
    APP_DIR="${APP_DIR:-/opt/vvv-frontpage}"
    if [ ! -d "$APP_DIR" ]; then
        APP_DIR="/var/www/vvv-frontpage"
    fi
    if [ ! -d "$APP_DIR" ]; then
        APP_DIR="$HOME/vvv-frontpage"
    fi
    
    if [ ! -d "$APP_DIR" ]; then
        print_error "Application directory not found. Set APP_DIR or run from /opt/vvv-frontpage"
        exit 1
    fi
    
    cd "$APP_DIR"
    
    MIGRATION_DIR="/tmp/vvv-migration-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$MIGRATION_DIR"
    
    print_info "Creating migration package in $MIGRATION_DIR"
    
    # Export database
    print_info "Exporting database..."
    if docker-compose ps postgres | grep -q "Up"; then
        docker-compose exec -T postgres pg_dump -U vvv_user vvv_database > "$MIGRATION_DIR/database.sql" 2>/dev/null || {
            print_warning "Database export failed, trying alternative method..."
            docker-compose exec postgres pg_dump -U vvv_user vvv_database > "$MIGRATION_DIR/database.sql" || {
                print_error "Database export failed. Is postgres container running?"
                exit 1
            }
        }
        print_success "Database exported"
    else
        print_warning "Postgres container not running, skipping database export"
    fi
    
    # Copy environment files
    print_info "Copying environment files..."
    if [ -d "env" ]; then
        cp -r env "$MIGRATION_DIR/" || {
            print_error "Failed to copy environment files"
            exit 1
        }
        print_success "Environment files copied"
    else
        print_warning "env directory not found"
    fi
    
    # Copy docker-compose.yml
    if [ -f "docker-compose.yml" ]; then
        cp docker-compose.yml "$MIGRATION_DIR/" || {
            print_error "Failed to copy docker-compose.yml"
            exit 1
        }
        print_success "docker-compose.yml copied"
    fi
    
    # Copy nginx config if accessible
    if [ -f "/etc/nginx/sites-available/veveve.dk" ]; then
        sudo cp /etc/nginx/sites-available/veveve.dk "$MIGRATION_DIR/nginx.conf" 2>/dev/null || {
            print_warning "Could not copy nginx config (may need sudo)"
        }
    fi
    
    # Save git commit
    if [ -d ".git" ]; then
        git rev-parse HEAD > "$MIGRATION_DIR/git_commit.txt" 2>/dev/null || echo "unknown" > "$MIGRATION_DIR/git_commit.txt"
    fi
    
    # Create archive
    print_info "Creating archive..."
    cd /tmp
    tar -czf "$(basename $MIGRATION_DIR).tar.gz" "$(basename $MIGRATION_DIR)" || {
        print_error "Failed to create archive"
        exit 1
    }
    
    ARCHIVE_PATH="/tmp/$(basename $MIGRATION_DIR).tar.gz"
    print_success "Migration package created: $ARCHIVE_PATH"
    print_info "File size: $(du -h $ARCHIVE_PATH | cut -f1)"
    print_info ""
    print_info "To transfer to new server:"
    print_info "  scp $ARCHIVE_PATH user@new-server:/tmp/"
    print_info "  OR"
    print_info "  rsync -avz $ARCHIVE_PATH user@new-server:/tmp/"

elif [ "$MODE" = "import" ]; then
    # IMPORT MODE: Run on NEW server
    print_header "Importing Data to New Server"
    
    ARCHIVE_PATH="${2:-/tmp/vvv-migration-*.tar.gz}"
    
    if [ ! -f "$ARCHIVE_PATH" ]; then
        # Try to find latest migration archive
        ARCHIVE_PATH=$(ls -t /tmp/vvv-migration-*.tar.gz 2>/dev/null | head -1)
    fi
    
    if [ ! -f "$ARCHIVE_PATH" ]; then
        print_error "Migration archive not found. Please provide path:"
        print_error "  $0 import /path/to/migration.tar.gz"
        exit 1
    fi
    
    print_info "Using archive: $ARCHIVE_PATH"
    
    APP_DIR="${APP_DIR:-/opt/vvv-frontpage}"
    if [ ! -d "$APP_DIR" ]; then
        print_info "Creating application directory: $APP_DIR"
        sudo mkdir -p "$APP_DIR"
        sudo chown $USER:$USER "$APP_DIR"
    fi
    
    cd "$APP_DIR"
    
    # Extract archive
    print_info "Extracting archive..."
    EXTRACT_DIR="/tmp/$(basename $ARCHIVE_PATH .tar.gz)"
    tar -xzf "$ARCHIVE_PATH" -C /tmp/ || {
        print_error "Failed to extract archive"
        exit 1
    }
    
    if [ ! -d "$EXTRACT_DIR" ]; then
        print_error "Extraction directory not found: $EXTRACT_DIR"
        exit 1
    fi
    
    print_success "Archive extracted to $EXTRACT_DIR"
    
    # Restore environment files
    if [ -d "$EXTRACT_DIR/env" ]; then
        print_info "Restoring environment files..."
        if [ -d "env" ]; then
            print_warning "env directory already exists, backing up..."
            mv env "env.backup.$(date +%Y%m%d-%H%M%S)"
        fi
        cp -r "$EXTRACT_DIR/env" ./
        print_success "Environment files restored"
        print_warning "⚠️  IMPORTANT: Review and update environment variables for new server!"
        print_info "   Edit: env/backend.env and env/frontend.env"
    else
        print_warning "No environment files found in archive"
    fi
    
    # Restore docker-compose.yml
    if [ -f "$EXTRACT_DIR/docker-compose.yml" ]; then
        print_info "Restoring docker-compose.yml..."
        if [ -f "docker-compose.yml" ]; then
            cp docker-compose.yml "docker-compose.yml.backup.$(date +%Y%m%d-%H%M%S)"
        fi
        cp "$EXTRACT_DIR/docker-compose.yml" ./
        print_success "docker-compose.yml restored"
    fi
    
    # Start database and Redis
    print_info "Starting database and Redis..."
    if command -v docker-compose &> /dev/null; then
        docker-compose up -d postgres redis || {
            print_error "Failed to start postgres/redis"
            exit 1
        }
        print_success "Database and Redis started"
        
        # Wait for services
        print_info "Waiting for services to be ready..."
        sleep 10
    else
        print_error "docker-compose not found"
        exit 1
    fi
    
    # Restore database
    if [ -f "$EXTRACT_DIR/database.sql" ]; then
        print_info "Restoring database..."
        print_warning "This will overwrite existing database. Continue? (y/N)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            cat "$EXTRACT_DIR/database.sql" | docker-compose exec -T postgres psql -U vvv_user -d vvv_database || {
                print_error "Database restoration failed"
                exit 1
            }
            print_success "Database restored"
            
            # Verify
            print_info "Verifying database..."
            RECORD_COUNT=$(docker-compose exec -T postgres psql -U vvv_user -d vvv_database -t -c "SELECT COUNT(*) FROM clients;" 2>/dev/null | tr -d ' \n')
            if [ -n "$RECORD_COUNT" ]; then
                print_success "Database verified: $RECORD_COUNT client(s) found"
            fi
        else
            print_warning "Database restoration skipped"
        fi
    else
        print_warning "No database backup found in archive"
    fi
    
    # Restore nginx config
    if [ -f "$EXTRACT_DIR/nginx.conf" ]; then
        print_info "Nginx config found in archive"
        print_info "To install: sudo cp $EXTRACT_DIR/nginx.conf /etc/nginx/sites-available/veveve.dk"
        print_info "Then: sudo ln -sf /etc/nginx/sites-available/veveve.dk /etc/nginx/sites-enabled/veveve.dk"
        print_info "Then: sudo nginx -t && sudo systemctl reload nginx"
    fi
    
    print_success "Import completed!"
    print_info ""
    print_info "Next steps:"
    print_info "1. Review and update environment files: env/backend.env, env/frontend.env"
    print_info "2. Start application: docker-compose up -d"
    print_info "3. Run migrations: docker-compose exec backend python manage.py migrate"
    print_info "4. Setup nginx (see above)"
    print_info "5. Update DNS to point to new server"
    print_info "6. Setup SSL: sudo certbot --nginx -d veveve.dk -d www.veveve.dk"

else
    print_error "Invalid mode: $MODE"
    echo ""
    echo "Usage:"
    echo "  Export (on old server): $0 export"
    echo "  Import (on new server): $0 import [archive-path]"
    exit 1
fi

