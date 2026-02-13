#!/bin/bash

echo "🔧 Fixing WooCommerce Sync Pagination Issue"
echo "==========================================="

# Stop services
echo "Stopping services..."
docker-compose down

# Build with fixes
echo "Building with sync fixes..."
docker-compose build --no-cache

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Run the comprehensive fix
echo "Running comprehensive sync fix..."
docker-compose exec -T backend python manage.py shell -c "
import sys
sys.path.append('/app')
from woocommerce.tasks_fix import run_comprehensive_sync_fix
run_comprehensive_sync_fix()
"

# Test the API
echo "Testing API endpoints..."
curl -s "https://veveve.dk/api/woocommerce/orders/analytics/?client_name=Porsa.dk&period=60" | head -c 200

echo ""
echo "✅ Sync pagination fix complete!"
echo ""
echo "Next steps:"
echo "1. Check channel reports for Paid Search data"
echo "2. Verify all orders are now synced"
echo "3. Monitor future sync jobs for pagination issues"
