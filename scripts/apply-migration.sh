#!/bin/bash

# Apply Database Migration Script
# This script applies the performance indexes migration to the database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if we're in the right directory
if [ ! -f "db/migrations/004_performance_indexes.sql" ]; then
    print_error "Migration file not found. Please run this script from the project root."
    exit 1
fi

# Load environment variables
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
elif [ -f "env/backend.env" ]; then
    export $(cat env/backend.env | grep -v '^#' | xargs)
else
    print_warning "No .env file found. Make sure database credentials are set."
fi

# Database connection parameters (from environment or defaults)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-vvv_database}"
DB_USER="${DB_USER:-vvv_user}"

print_status "Applying performance indexes migration..."
print_status "Database: ${DB_NAME}@${DB_HOST}:${DB_PORT}"
print_status "User: ${DB_USER}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    print_error "psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Apply migration
if [ -z "$DB_PASSWORD" ]; then
    # No password - use trust authentication
    print_warning "No password set. Using trust authentication (localhost only)."
    PGPASSWORD="" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f db/migrations/004_performance_indexes.sql
else
    # Use password
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f db/migrations/004_performance_indexes.sql
fi

if [ $? -eq 0 ]; then
    print_status "Migration applied successfully!"
    print_status "Indexes created/verified:"
    print_status "  - woocommerce_orders indexes"
    print_status "  - gads_adgroup_performance indexes"
    print_status "  - search_console_data indexes"
    print_status "  - pipelines indexes"
    print_status "  - clients and users indexes"
else
    print_error "Migration failed. Please check the error messages above."
    exit 1
fi

print_status "Migration complete!"







