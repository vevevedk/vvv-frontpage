#!/bin/bash

#############################################
# VVV Frontpage - Enhanced Production Deployment
# With health checks, rollback, and verification
#############################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Deployment configuration
DEPLOY_DIR="/opt/vvv-frontpage"
BACKUP_DIR="/opt/vvv-backups"
MAX_BACKUPS=5
HEALTH_CHECK_TIMEOUT=60
ROLLBACK_ENABLED=true

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify prerequisites
verify_prerequisites() {
    print_header "Verifying Prerequisites"
    
    local missing_commands=()
    
    for cmd in docker docker-compose git curl; do
        if ! command_exists "$cmd"; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [ ${#missing_commands[@]} -ne 0 ]; then
        print_error "Missing required commands: ${missing_commands[*]}"
        exit 1
    fi
    
    print_success "All prerequisites satisfied"
}

# Create backup
create_backup() {
    print_header "Creating Backup"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="${BACKUP_DIR}/backup_${timestamp}"
    
    mkdir -p "${BACKUP_DIR}"
    mkdir -p "${backup_path}"
    
    # Backup database
    print_info "Backing up database..."
    docker-compose exec -T postgres pg_dump -U vvv_user vvv_database > "${backup_path}/database.sql" 2>/dev/null || true
    
    # Backup environment files
    print_info "Backing up environment files..."
    cp -r env "${backup_path}/" 2>/dev/null || true
    
    # Backup docker-compose.yml
    cp docker-compose.yml "${backup_path}/" 2>/dev/null || true
    
    # Save current git commit
    git rev-parse HEAD > "${backup_path}/git_commit.txt" 2>/dev/null || echo "unknown" > "${backup_path}/git_commit.txt"
    
    print_success "Backup created at ${backup_path}"
    echo "$backup_path" > /tmp/last_backup_path.txt
    
    # Clean old backups
    cleanup_old_backups
}

# Cleanup old backups
cleanup_old_backups() {
    local backup_count=$(ls -1 "${BACKUP_DIR}" 2>/dev/null | wc -l)
    
    if [ "$backup_count" -gt "$MAX_BACKUPS" ]; then
        print_info "Cleaning up old backups (keeping last ${MAX_BACKUPS})..."
        ls -1t "${BACKUP_DIR}" | tail -n +$((MAX_BACKUPS + 1)) | xargs -I {} rm -rf "${BACKUP_DIR}/{}"
    fi
}

# Pull latest code
pull_code() {
    print_header "Pulling Latest Code"
    
    # Stash any local changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "Local changes detected, stashing..."
        git stash
    fi
    
    # Fetch and pull
    git fetch origin
    git pull origin main
    
    print_success "Code updated to latest version"
    git log -1 --pretty=format:"%h - %s (%an, %ar)"
    echo ""
}

# Build new images
build_images() {
    print_header "Building Docker Images"
    
    print_info "Building backend image..."
    docker-compose build backend
    
    print_info "Building frontend image..."
    docker-compose build frontend
    
    print_success "Images built successfully"
}

# Run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    print_info "Applying Django migrations..."
    docker-compose exec -T backend python manage.py migrate --noinput
    
    print_info "Collecting static files..."
    docker-compose exec -T backend python manage.py collectstatic --noinput
    
    # Apply performance indexes migration if it exists
    if [ -f "db/migrations/004_performance_indexes.sql" ]; then
        print_info "Applying performance indexes migration..."
        print_info "Note: Migration uses 'IF NOT EXISTS' so it's safe to run multiple times"
        
        # Pipe SQL file directly to psql (most reliable method)
        if cat db/migrations/004_performance_indexes.sql | docker-compose exec -T postgres psql -U vvv_user -d vvv_database > /dev/null 2>&1; then
            print_success "Performance indexes migration completed"
            
            # Verify indexes were created
            local index_count=$(docker-compose exec -T postgres psql -U vvv_user -d vvv_database -t -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_woocommerce%' OR indexname LIKE 'idx_gads%' OR indexname LIKE 'idx_gsc%' OR indexname LIKE 'idx_pipelines%';" 2>/dev/null | tr -d ' \n')
            if [ -n "$index_count" ] && [ "$index_count" -gt "0" ]; then
                print_success "Verified: $index_count performance indexes exist"
            fi
        else
            print_warning "Index migration had warnings (this is normal if indexes already exist)"
            print_info "Indexes use 'CREATE INDEX IF NOT EXISTS' - safe to ignore if already applied"
            
            # Check if indexes exist (verify they're there)
            local existing_count=$(docker-compose exec -T postgres psql -U vvv_user -d vvv_database -t -c "SELECT COUNT(*) FROM pg_indexes WHERE indexname IN ('idx_woocommerce_orders_client_date', 'idx_gads_client_date_range', 'idx_gsc_client_date', 'idx_pipelines_client_status');" 2>/dev/null | tr -d ' \n')
            if [ -n "$existing_count" ] && [ "$existing_count" -gt "0" ]; then
                print_success "Confirmed: Performance indexes exist ($existing_count core indexes found)"
            else
                print_warning "Could not verify indexes - they may need manual application"
                print_info "To apply manually: cat db/migrations/004_performance_indexes.sql | docker-compose exec -T postgres psql -U vvv_user -d vvv_database"
            fi
        fi
    else
        print_warning "Performance indexes migration file not found: db/migrations/004_performance_indexes.sql"
    fi
    
    print_success "Migrations completed"
}

# Configure nginx
configure_nginx() {
    print_header "Configuring Nginx"
    
    local nginx_conf_src="deploy/veveve.dk.conf"
    local nginx_conf_dst="/etc/nginx/sites-available/veveve.dk"
    
    if [[ -f "$nginx_conf_src" ]]; then
        print_info "Installing nginx configuration..."
        sudo cp "$nginx_conf_src" "$nginx_conf_dst"
        sudo ln -sf "$nginx_conf_dst" /etc/nginx/sites-enabled/veveve.dk
        
        # Test nginx configuration
        if sudo nginx -t; then
            print_success "Nginx configuration is valid"
        else
            print_error "Nginx configuration test failed!"
            return 1
        fi
    else
        print_error "Nginx configuration file not found: $nginx_conf_src"
        return 1
    fi
}

# Deploy new version
deploy() {
    print_header "Deploying New Version"
    
    print_info "Stopping old containers..."
    docker-compose down --remove-orphans
    
    # Clean up any conflicting processes on ports
    print_info "Cleaning up port conflicts..."
    sudo pkill -f ":3000" || true
    sudo pkill -f ":8001" || true
    sleep 2
    
    print_info "Starting new containers..."
    docker-compose up -d
    
    print_success "Containers started"
    
    # Configure nginx after containers are running
    configure_nginx
}

# Health check
health_check() {
    print_header "Running Health Checks"
    
    local elapsed=0
    local backend_healthy=false
    local frontend_healthy=false
    
    while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
        # Check backend
        if ! $backend_healthy; then
            if curl -sf http://localhost:8001/api/health/ >/dev/null 2>&1; then
                print_success "Backend is healthy"
                backend_healthy=true
            elif curl -sf http://localhost:8001/api/test/ >/dev/null 2>&1; then
                # Fallback to test endpoint if health endpoint not available
                print_success "Backend is responding (via test endpoint)"
                backend_healthy=true
            fi
        fi
        
        # Check frontend health endpoint
        if ! $frontend_healthy; then
            if curl -sf http://localhost:3000/api/health >/dev/null 2>&1; then
                print_success "Frontend health check passed"
                frontend_healthy=true
            elif curl -sf http://localhost:3000 >/dev/null 2>&1; then
                print_success "Frontend is responding"
                frontend_healthy=true
            fi
        fi
        
        # Both healthy?
        if $backend_healthy && $frontend_healthy; then
            print_success "All services are healthy!"
            print_info "Reloading nginx..."
            sudo systemctl reload nginx
            return 0
        fi
        
        sleep 2
        elapsed=$((elapsed + 2))
        echo -n "."
    done
    
    echo ""
    print_error "Health check failed after ${HEALTH_CHECK_TIMEOUT}s"
    return 1
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"
    
    # Check container status
    print_info "Checking container status..."
    local running_containers=$(docker-compose ps --services --filter "status=running" | wc -l)
    local expected_containers=$(docker-compose config --services | wc -l)
    
    if [ "$running_containers" -eq "$expected_containers" ]; then
        print_success "All containers are running ($running_containers/$expected_containers)"
    else
        print_error "Some containers are not running ($running_containers/$expected_containers)"
        docker-compose ps
        return 1
    fi
    
    # Check logs for errors
    print_info "Checking recent logs for errors..."
    local error_count=$(docker-compose logs --tail=50 2>&1 | grep -i "error" | wc -l)
    
    if [ "$error_count" -gt 5 ]; then
        print_warning "Found $error_count errors in recent logs"
        print_warning "Please check logs: docker-compose logs"
    fi
    
    # Test external access
    print_info "Testing external access..."
    if curl -sf https://veveve.dk >/dev/null 2>&1; then
        print_success "Site is accessible at https://veveve.dk"
    else
        print_warning "Site may not be accessible externally"
    fi
    
    print_success "Deployment verification completed"
}

# Rollback to previous version
rollback() {
    print_header "Rolling Back Deployment"
    
    if [ ! -f /tmp/last_backup_path.txt ]; then
        print_error "No backup found for rollback"
        return 1
    fi
    
    local backup_path=$(cat /tmp/last_backup_path.txt)
    
    if [ ! -d "$backup_path" ]; then
        print_error "Backup directory not found: $backup_path"
        return 1
    fi
    
    print_warning "Rolling back to backup: $backup_path"
    
    # Stop current containers
    docker-compose down
    
    # Restore files
    print_info "Restoring environment files..."
    cp -r "${backup_path}/env" ./
    
    print_info "Restoring docker-compose.yml..."
    cp "${backup_path}/docker-compose.yml" ./
    
    # Restore git commit
    local git_commit=$(cat "${backup_path}/git_commit.txt")
    if [ "$git_commit" != "unknown" ]; then
        print_info "Restoring git commit: $git_commit"
        git checkout "$git_commit"
    fi
    
    # Restore database
    if [ -f "${backup_path}/database.sql" ]; then
        print_info "Restoring database..."
        docker-compose up -d postgres
        sleep 5
        docker-compose exec -T postgres psql -U vvv_user -d vvv_database < "${backup_path}/database.sql"
    fi
    
    # Start containers
    print_info "Starting containers..."
    docker-compose up -d
    
    print_success "Rollback completed"
}

# Run pre-deployment checks
run_pre_deployment_checks() {
    print_header "Running Pre-Deployment Validation"
    
    if [ -f "scripts/pre-deployment-checks.sh" ]; then
        print_info "Running pre-deployment validation..."
        if bash scripts/pre-deployment-checks.sh --skip-optional; then
            print_success "Pre-deployment checks passed"
        else
            print_error "Pre-deployment checks failed"
            print_warning "Continue anyway? (y/N)"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        print_warning "Pre-deployment checks script not found, skipping..."
    fi
}

# Main deployment flow
main() {
    print_header "🚀 VVV Frontpage Deployment"
    print_info "Starting deployment at $(date)"
    
    # Change to deployment directory
    cd "$DEPLOY_DIR" || exit 1
    
    # Run deployment steps
    verify_prerequisites
    run_pre_deployment_checks
    create_backup
    pull_code
    build_images
    deploy
    run_migrations
    
    # Health check
    if health_check; then
        verify_deployment
        print_header "🎉 Deployment Successful!"
        print_info "Application is running at https://veveve.dk"
        print_info "Completed at $(date)"
    else
        print_error "Deployment failed health check"
        
        if [ "$ROLLBACK_ENABLED" = true ]; then
            print_warning "Initiating automatic rollback..."
            rollback
            
            if health_check; then
                print_success "Rollback successful, system restored"
            else
                print_error "Rollback failed, manual intervention required"
                exit 1
            fi
        fi
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --rollback)
        rollback
        ;;
    --verify)
        verify_deployment
        ;;
    --health-check)
        health_check
        ;;
    *)
        main
        ;;
esac


