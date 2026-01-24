#!/bin/bash

#############################################
# Pre-Deployment Validation Checks
# Run this before deploying to catch issues early
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

# Check environment variables
check_env_vars() {
    print_header "Checking Environment Variables"
    
    local required_vars=(
        "DB_HOST"
        "DB_USER"
        "DB_NAME"
        "DJANGO_SECRET_KEY"
        "NEXT_PUBLIC_API_URL"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] && ! grep -q "^${var}=" env/backend.env env/frontend.env 2>/dev/null; then
            print_error "Missing required environment variable: $var"
            ((ERRORS++))
        else
            print_success "$var is set"
        fi
    done
}

# Check for TypeScript errors
check_typescript() {
    print_header "Checking TypeScript Compilation"
    
    if command -v npm &> /dev/null; then
        if npm run build 2>&1 | grep -i "error" > /dev/null; then
            print_error "TypeScript compilation errors found"
            npm run build 2>&1 | grep -i "error"
            ((ERRORS++))
        else
            print_success "TypeScript compilation successful"
        fi
    else
        print_warning "npm not found, skipping TypeScript check"
        ((WARNINGS++))
    fi
}

# Check for linting errors
check_linting() {
    print_header "Checking Code Linting"
    
    if command -v npm &> /dev/null; then
        if npm run lint 2>&1 | grep -i "error" > /dev/null; then
            print_warning "Linting errors found (non-blocking)"
            ((WARNINGS++))
        else
            print_success "Linting passed"
        fi
    else
        print_warning "npm not found, skipping lint check"
        ((WARNINGS++))
    fi
}

# Check database migration files
check_migrations() {
    print_header "Checking Database Migrations"
    
    local migration_file="db/migrations/004_performance_indexes.sql"
    
    if [ -f "$migration_file" ]; then
        print_success "Performance indexes migration found: $migration_file"
        print_info "Remember to apply this migration: psql -U vvv_user -d vvv_database -f $migration_file"
    else
        print_warning "Performance indexes migration not found"
        ((WARNINGS++))
    fi
    
    # Check if there are unapplied migrations
    if command -v docker-compose &> /dev/null; then
        if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
            print_info "Database is running, checking for unapplied migrations..."
            # This would require backend container to be running
        fi
    fi
}

# Check Docker configuration
check_docker() {
    print_header "Checking Docker Configuration"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found"
        ((ERRORS++))
        return
    fi
    
    print_success "Docker is installed"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose not found"
        ((ERRORS++))
        return
    fi
    
    print_success "Docker Compose is installed"
    
    # Check if docker-compose.yml exists
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found"
        ((ERRORS++))
    else
        print_success "docker-compose.yml found"
        
        # Validate docker-compose syntax
        if docker-compose config > /dev/null 2>&1; then
            print_success "docker-compose.yml is valid"
        else
            print_error "docker-compose.yml has syntax errors"
            ((ERRORS++))
        fi
    fi
}

# Check required files
check_required_files() {
    print_header "Checking Required Files"
    
    local required_files=(
        "package.json"
        "next.config.js"
        "tailwind.config.js"
        "tsconfig.json"
        "frontend.Dockerfile"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "$file exists"
        else
            print_error "$file is missing"
            ((ERRORS++))
        fi
    done
}

# Check for critical issues in code
check_code_quality() {
    print_header "Checking Code Quality"
    
    # Check if new UI components are imported correctly
    if grep -r "useToast\|LoadingSpinner\|ErrorState" components/ pages/ --include="*.tsx" --include="*.ts" > /dev/null 2>&1; then
        print_success "New UI components are being used"
    else
        print_warning "New UI components may not be fully integrated"
        ((WARNINGS++))
    fi
    
    # Check if ToastProvider is in _app.tsx
    if grep -q "ToastProvider" pages/_app.tsx 2>/dev/null; then
        print_success "ToastProvider is configured in _app.tsx"
    else
        print_warning "ToastProvider may not be configured"
        ((WARNINGS++))
    fi
}

# Check database connection
check_database_connection() {
    print_header "Checking Database Connection"
    
    if command -v docker-compose &> /dev/null; then
        if docker-compose ps postgres 2>/dev/null | grep -q "Up"; then
            print_success "PostgreSQL container is running"
            
            # Try to connect
            if docker-compose exec -T postgres pg_isready -U vvv_user > /dev/null 2>&1; then
                print_success "Database connection successful"
            else
                print_warning "Cannot connect to database (may need to start containers)"
                ((WARNINGS++))
            fi
        else
            print_warning "PostgreSQL container is not running"
            ((WARNINGS++))
        fi
    fi
}

# Check disk space
check_disk_space() {
    print_header "Checking Disk Space"
    
    local available=$(df -h . | awk 'NR==2 {print $4}' | sed 's/[^0-9]//g')
    local available_gb=${available}
    
    if [ "$available_gb" -lt 5 ]; then
        print_error "Less than 5GB disk space available"
        ((ERRORS++))
    else
        print_success "Sufficient disk space available"
    fi
}

# Summary
print_summary() {
    print_header "Pre-Deployment Check Summary"
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        print_success "All checks passed! Ready for deployment."
        return 0
    elif [ $ERRORS -eq 0 ]; then
        print_warning "Checks completed with $WARNINGS warning(s). Review warnings before deploying."
        return 0
    else
        print_error "Found $ERRORS error(s) and $WARNINGS warning(s). Fix errors before deploying."
        return 1
    fi
}

# Main
main() {
    print_header "🚀 Pre-Deployment Validation"
    print_info "Running pre-deployment checks at $(date)"
    
    check_required_files
    check_env_vars
    check_docker
    check_database_connection
    check_migrations
    check_code_quality
    check_disk_space
    
    # Optional checks (warnings only)
    if [ "${1:-}" != "--skip-optional" ]; then
        check_typescript
        check_linting
    fi
    
    print_summary
    exit $?
}

main "$@"







