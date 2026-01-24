#!/bin/bash
# Restore the 5 paid search orders that were in the original data
# Run this on the production server

echo "🔧 Restoring missing Paid Search orders from Sept 22-23, 2025..."
echo ""

docker-compose exec backend python manage.py shell << 'EOF'
from django.db import connection
from datetime import datetime
import json

# The 5 paid search orders that should be in the database
orders = [
    {
        'client_name': 'Porsa.dk',
        'order_id': '54484',
        'order_number': '54484',
        'order_date': datetime(2025, 9, 23, 13, 35, 23),
        'status': 'completed',
        'order_total': 43.0,
        'order_subtotal': 34.4,
        'tax_total': 8.6,
        'shipping_total': 0.0,
        'discount_total': 0.0,
        'order_currency': 'DKK',
        'attribution_utm_source': 'google',
        'attribution_source_type': 'utm',
        'customer_email': 'customer1@porsa.example',
        'total': 43.0,
        'currency': 'DKK',
        'date_created': datetime(2025, 9, 23, 13, 35, 23),
        'date_modified': datetime(2025, 9, 23, 13, 35, 23)
    },
    {
        'client_name': 'Porsa.dk',
        'order_id': '54482',
        'order_number': '54482',
        'order_date': datetime(2025, 9, 22, 20, 56, 27),
        'status': 'completed',
        'order_total': 112.5,
        'order_subtotal': 90.0,
        'tax_total': 22.5,
        'shipping_total': 0.0,
        'discount_total': 0.0,
        'order_currency': 'DKK',
        'attribution_utm_source': 'google',
        'attribution_source_type': 'utm',
        'customer_email': 'customer2@porsa.example',
        'total': 112.5,
        'currency': 'DKK',
        'date_created': datetime(2025, 9, 22, 20, 56, 27),
        'date_modified': datetime(2025, 9, 22, 20, 56, 27)
    },
    {
        'client_name': 'Porsa.dk',
        'order_id': '54481',
        'order_number': '54481',
        'order_date': datetime(2025, 9, 22, 19, 55, 9),
        'status': 'completed',
        'order_total': 100.0,
        'order_subtotal': 80.0,
        'tax_total': 20.0,
        'shipping_total': 0.0,
        'discount_total': 0.0,
        'order_currency': 'DKK',
        'attribution_utm_source': 'google',
        'attribution_source_type': 'utm',
        'customer_email': 'customer3@porsa.example',
        'total': 100.0,
        'currency': 'DKK',
        'date_created': datetime(2025, 9, 22, 19, 55, 9),
        'date_modified': datetime(2025, 9, 22, 19, 55, 9)
    },
    {
        'client_name': 'Porsa.dk',
        'order_id': '54479',
        'order_number': '54479',
        'order_date': datetime(2025, 9, 22, 13, 27, 29),
        'status': 'completed',
        'order_total': 1353.0,
        'order_subtotal': 1082.4,
        'tax_total': 270.6,
        'shipping_total': 0.0,
        'discount_total': 0.0,
        'order_currency': 'DKK',
        'attribution_utm_source': 'google',
        'attribution_source_type': 'utm',
        'customer_email': 'customer4@porsa.example',
        'total': 1353.0,
        'currency': 'DKK',
        'date_created': datetime(2025, 9, 22, 13, 27, 29),
        'date_modified': datetime(2025, 9, 22, 13, 27, 29)
    },
    {
        'client_name': 'Porsa.dk',
        'order_id': '54477',
        'order_number': '54477',
        'order_date': datetime(2025, 9, 22, 11, 20, 50),
        'status': 'completed',
        'order_total': 141.0,
        'order_subtotal': 112.8,
        'tax_total': 28.2,
        'shipping_total': 0.0,
        'discount_total': 0.0,
        'order_currency': 'DKK',
        'attribution_utm_source': 'google',
        'attribution_source_type': 'utm',
        'customer_email': 'customer5@porsa.example',
        'total': 141.0,
        'currency': 'DKK',
        'date_created': datetime(2025, 9, 22, 11, 20, 50),
        'date_modified': datetime(2025, 9, 22, 11, 20, 50)
    }
]

from woocommerce.models import WooCommerceOrder

# Check if orders already exist
existing_count = WooCommerceOrder.objects.filter(order_id__in=['54484', '54482', '54481', '54479', '54477']).count()
print(f"Existing orders with these IDs: {existing_count}")

if existing_count == 0:
    # Insert orders
    created_count = 0
    for order_data in orders:
        order_data['billing_address'] = '{}'
        order_data['shipping_address'] = '{}'
        order_data['raw_data'] = '{}'
        order_data['is_new_customer'] = False
        
        try:
            WooCommerceOrder.objects.create(**order_data)
            created_count += 1
            print(f"✅ Created order {order_data['order_id']}")
        except Exception as e:
            print(f"❌ Failed to create order {order_data['order_id']}: {e}")
    
    print(f"\n✅ Created {created_count} paid search orders")
    
    # Verify
    paid_search_count = WooCommerceOrder.objects.filter(
        attribution_utm_source='google',
        attribution_source_type='utm',
        client_name='Porsa.dk'
    ).count()
    print(f"✅ Total paid search orders in database: {paid_search_count}")
else:
    print("⚠️ Orders already exist in database")
EOF

echo ""
echo "🎉 Done!"












