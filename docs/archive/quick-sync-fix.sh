#!/bin/bash

echo "🔧 Quick Sync Fix (No Rebuild)"
echo "==============================="

# Start services if not running
echo "Starting services..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Run the proper sync fix
echo "Running proper sync fix..."
docker-compose exec -T backend python /app/backend/woocommerce/sync_fix_proper.py

# Test the API
echo "Testing API endpoints..."
curl -s "https://veveve.dk/api/woocommerce/orders/analytics/?client_name=Porsa.dk&period=60" | head -c 200

echo ""
echo "✅ Quick sync fix complete!"
