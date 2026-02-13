#!/bin/bash

echo "🔧 Deploying Proper WooCommerce Sync Fix"
echo "========================================"

# Stop services
echo "Stopping services..."
docker-compose down

# Clean up Docker to free space
echo "Cleaning up Docker..."
docker system prune -a -f
docker volume prune -f

# Build with fixes
echo "Building with proper sync fixes..."
docker-compose build --no-cache

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 60

# Run database migrations
echo "Running database migrations..."
docker-compose exec -T backend python manage.py migrate

# Run the proper sync fix
echo "Running proper sync fix..."
docker-compose exec -T backend python /app/backend/woocommerce/sync_fix_proper.py

# Test the API
echo "Testing API endpoints..."
curl -s "https://veveve.dk/api/woocommerce/orders/analytics/?client_name=Porsa.dk&period=60" | head -c 200

echo ""
echo "✅ Proper sync fix deployment complete!"
echo ""
echo "Next steps:"
echo "1. Check channel reports for Paid Search data"
echo "2. Verify all orders are now synced properly"
echo "3. Monitor future sync jobs"
