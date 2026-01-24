#!/bin/bash

#############################################
# Quick WooCommerce Pipeline Fix
# For immediate production issues
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🚀 Quick WooCommerce Pipeline Fix"
echo "================================="

# 1. Restart all services
print_info "Restarting all services..."
docker-compose restart postgres redis backend worker beat frontend
sleep 10

# 2. Clear Celery queues
print_info "Clearing Celery queues..."
docker-compose exec -T worker celery -A api purge || true

# 3. Run migrations
print_info "Running database migrations..."
docker-compose exec -T backend python manage.py migrate --noinput

# 4. Test WooCommerce connections
print_info "Testing WooCommerce connections..."
docker-compose exec -T backend python manage.py shell << 'EOF'
from users.models import AccountConfiguration
from woocommerce.tasks import test_woocommerce_connection

configs = AccountConfiguration.objects.filter(config_type='woocommerce', is_active=True)
print(f"Testing {configs.count()} configurations...")

for config in configs:
    woocommerce_config = config.get_woocommerce_config()
    if woocommerce_config:
        success, message = test_woocommerce_connection(woocommerce_config)
        print(f"{config.account.name}: {'✅' if success else '❌'} {message}")
    else:
        print(f"{config.account.name}: ❌ No configuration")
EOF

# 5. Trigger a manual sync
print_info "Triggering manual sync..."
docker-compose exec -T backend python manage.py shell << 'EOF'
from users.models import AccountConfiguration
from woocommerce.tasks import sync_woocommerce_config
from django.utils import timezone
from datetime import timedelta

configs = AccountConfiguration.objects.filter(config_type='woocommerce', is_active=True)
for config in configs:
    print(f"Syncing {config.account.name}...")
    try:
        result = sync_woocommerce_config(config.id, 'manual_fix')
        print(f"Result: {result}")
    except Exception as e:
        print(f"Error: {e}")
EOF

# 6. Check status
print_info "Checking final status..."
docker-compose ps

print_success "Quick fix completed!"
print_info "Run './fix-woocommerce-pipeline.sh' for detailed diagnostics if issues persist."

