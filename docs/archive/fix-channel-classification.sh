#!/bin/bash

echo "🔧 Fixing Channel Classification Issues"
echo "========================================"

# Navigate to backend directory
cd backend

echo "1. Updating channel classification rules..."
python manage.py update_channel_classifications

echo ""
echo "2. Running backfill sync to get missing orders (Aug 30 - Sep 3)..."
# Run a backfill sync for the missing date range
python manage.py shell << EOF
from woocommerce.tasks import sync_woocommerce_config
from users.models import AccountConfiguration
from django.utils import timezone
from datetime import datetime

# Find WooCommerce configurations
configs = AccountConfiguration.objects.filter(config_type='woocommerce')
print(f"Found {configs.count()} WooCommerce configurations")

for config in configs:
    print(f"Running backfill sync for {config.account.name}...")
    # Backfill from Aug 30 to Oct 3 to catch all missing orders
    start_date = datetime(2025, 8, 30)
    end_date = datetime(2025, 10, 3)
    
    try:
        result = sync_woocommerce_config.delay(
            config.id, 
            job_type='backfill', 
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat()
        )
        print(f"✅ Started backfill job {result.id} for {config.account.name}")
    except Exception as e:
        print(f"❌ Error starting backfill for {config.account.name}: {e}")
EOF

echo ""
echo "3. Checking data coverage..."
python manage.py shell << EOF
from woocommerce.models import WooCommerceOrder
from django.utils import timezone
from datetime import timedelta

# Check recent orders
end_date = timezone.now()
start_date = end_date - timedelta(days=30)

orders = WooCommerceOrder.objects.filter(date_created__gte=start_date)
print(f"📊 Orders in last 30 days: {orders.count()}")

# Check for Paid Search orders
paid_search = orders.filter(
    attribution_utm_source='google',
    attribution_source_type='utm'
)
print(f"🎯 Paid Search orders: {paid_search.count()}")

# Check date coverage
date_range = orders.aggregate(
    earliest=Min('date_created'),
    latest=Max('date_created')
)
print(f"📅 Date range: {date_range['earliest']} to {date_range['latest']}")

# Check for missing Aug 30 - Sep 3 orders
aug_30 = datetime(2025, 8, 30)
sep_3 = datetime(2025, 9, 3)
missing_period = orders.filter(
    date_created__gte=aug_30,
    date_created__lte=sep_3
)
print(f"🔍 Orders in missing period (Aug 30 - Sep 3): {missing_period.count()}")
EOF

echo ""
echo "✅ Channel classification fixes applied!"
echo ""
echo "Next steps:"
echo "1. Check the sync jobs in the admin panel"
echo "2. Verify orders are being classified correctly"
echo "3. Use the /api/woocommerce/orders/validate_data_coverage/ endpoint to check for issues"
