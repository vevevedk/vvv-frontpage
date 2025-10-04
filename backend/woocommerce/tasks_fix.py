#!/usr/bin/env python3
"""
Comprehensive fix for WooCommerce sync issues
"""

import requests
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from woocommerce.models import WooCommerceOrder, WooCommerceJob, WooCommerceSyncLog
from users.models import AccountConfiguration


def test_sync_pagination(config_id, start_date=None, end_date=None):
    """
    Test the sync process to identify pagination issues
    """
    config = AccountConfiguration.objects.get(id=config_id, config_type='woocommerce')
    wc_config = config.get_woocommerce_config()
    
    # Test API pagination
    base_url = wc_config['store_url']
    api_url = f"{base_url}/wp-json/wc/v3/orders"
    
    headers = {'User-Agent': 'WooCommerce-Sync/1.0'}
    
    def z(dt):
        try:
            from django.utils import timezone as djtz
            dt = dt if djtz.is_aware(dt) else djtz.make_aware(dt)
            return dt.astimezone(djtz.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        except Exception:
            return dt.isoformat()
    
    params = {
        'consumer_key': wc_config['consumer_key'],
        'consumer_secret': wc_config['consumer_secret'],
        'per_page': 10,  # Small page size to test pagination
        'after': z(start_date),
        'before': z(end_date),
        'status': 'any',
        'orderby': 'date',
        'order': 'asc'
    }
    
    print(f"Testing pagination for {config.account.name}")
    print(f"Date range: {start_date} to {end_date}")
    
    orders = []
    page = 1
    total_pages = None
    total_orders = None
    
    while True:
        params['page'] = page
        print(f"Fetching page {page}...")
        
        response = requests.get(api_url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"❌ API error on page {page}: {response.status_code} - {response.text}")
            break
        
        page_orders = response.json()
        
        # Get pagination info from headers
        if page == 1:
            total_pages = int(response.headers.get('X-WP-TotalPages', 1))
            total_orders = int(response.headers.get('X-WP-Total', 0))
            print(f"Total pages: {total_pages}, Total orders: {total_orders}")
        
        print(f"  Page {page}: {len(page_orders)} orders")
        
        if not page_orders:
            break
            
        orders.extend(page_orders)
        page += 1
        
        # Safety check
        if page > 100:
            print("⚠️ Safety break at 100 pages")
            break
    
    print(f"\nResults:")
    print(f"Expected orders: {total_orders}")
    print(f"Fetched orders: {len(orders)}")
    print(f"Order IDs: {sorted([order['id'] for order in orders])}")
    
    return orders


def manual_sync_missing_orders(config_id, missing_order_ids):
    """
    Manually sync specific missing orders
    """
    config = AccountConfiguration.objects.get(id=config_id, config_type='woocommerce')
    wc_config = config.get_woocommerce_config()
    
    base_url = wc_config['store_url']
    api_url = f"{base_url}/wp-json/wc/v3/orders"
    
    headers = {'User-Agent': 'WooCommerce-Sync/1.0'}
    
    print(f"Manually syncing {len(missing_order_ids)} orders for {config.account.name}")
    
    synced_orders = []
    
    for order_id in missing_order_ids:
        print(f"Fetching order {order_id}...")
        
        url = f"{api_url}/{order_id}"
        params = {
            'consumer_key': wc_config['consumer_key'],
            'consumer_secret': wc_config['consumer_secret']
        }
        
        response = requests.get(url, headers=headers, params=params)
        
        if response.status_code == 200:
            order_data = response.json()
            
            # Create order with proper field mapping
            try:
                with transaction.atomic():
                    order, created = WooCommerceOrder.objects.get_or_create(
                        order_id=str(order_id),
                        client_name=config.account.name,
                        defaults={
                            'raw_data': order_data,
                            'total': Decimal(str(order_data.get('total', 0))),
                            'order_total': Decimal(str(order_data.get('total', 0))),
                            'date_created': order_data.get('date_created'),
                            'order_number': str(order_id),
                            'status': order_data.get('status', 'unknown'),
                            'order_currency': order_data.get('currency', 'DKK'),
                            'order_key': order_data.get('order_key', ''),
                            'customer_id': str(order_data.get('customer_id', 0)),
                            'billing_first_name': order_data.get('billing', {}).get('first_name', ''),
                            'billing_last_name': order_data.get('billing', {}).get('last_name', ''),
                            'billing_email': order_data.get('billing', {}).get('email', ''),
                            'billing_phone': order_data.get('billing', {}).get('phone', ''),
                            'billing_address_1': order_data.get('billing', {}).get('address_1', ''),
                            'billing_postcode': order_data.get('billing', {}).get('postcode', ''),
                            'billing_city': order_data.get('billing', {}).get('city', ''),
                            'billing_country': order_data.get('billing', {}).get('country', ''),
                            'shipping_first_name': order_data.get('shipping', {}).get('first_name', ''),
                            'shipping_last_name': order_data.get('shipping', {}).get('last_name', ''),
                            'shipping_address_1': order_data.get('shipping', {}).get('address_1', ''),
                            'shipping_postcode': order_data.get('shipping', {}).get('postcode', ''),
                            'shipping_city': order_data.get('shipping', {}).get('city', ''),
                            'shipping_country': order_data.get('shipping', {}).get('country', ''),
                            'payment_method': order_data.get('payment_method', ''),
                            'payment_method_title': order_data.get('payment_method_title', ''),
                            'customer_ip_address': order_data.get('customer_ip_address', ''),
                            'customer_user_agent': order_data.get('customer_user_agent', ''),
                        }
                    )
                    
                    # Update attribution data
                    meta_data = order_data.get('meta_data', [])
                    for meta in meta_data:
                        key = meta.get('key', '')
                        if key == '_wc_order_attribution_utm_source':
                            order.attribution_utm_source = meta.get('value')
                        elif key == '_wc_order_attribution_source_type':
                            order.attribution_source_type = meta.get('value')
                    
                    order.save()
                    
                    synced_orders.append(order_id)
                    print(f"✅ Order {order_id}: {'Created' if created else 'Updated'} - {order.attribution_utm_source}/{order.attribution_source_type}")
                    
            except Exception as e:
                print(f"❌ Error creating order {order_id}: {e}")
                
        else:
            print(f"❌ Failed to fetch order {order_id}: {response.status_code}")
    
    return synced_orders


def run_comprehensive_sync_fix():
    """
    Run a comprehensive fix for the sync issues
    """
    print("🔧 Starting comprehensive sync fix...")
    
    # Test pagination for Porsa.dk
    porsa_config = AccountConfiguration.objects.filter(
        config_type='woocommerce',
        account__name='Porsa.dk'
    ).first()
    
    if not porsa_config:
        print("❌ Porsa.dk configuration not found")
        return
    
    from datetime import datetime
    start_date = datetime(2025, 8, 30)
    end_date = datetime(2025, 9, 3)
    
    # Test pagination
    print("\n1. Testing pagination...")
    api_orders = test_sync_pagination(porsa_config.id, start_date, end_date)
    
    # Check what's in database
    print("\n2. Checking database...")
    db_orders = WooCommerceOrder.objects.filter(
        client_name='Porsa.dk',
        date_created__gte=start_date,
        date_created__lte=end_date
    )
    
    api_order_ids = set(order['id'] for order in api_orders)
    db_order_ids = set(int(order.order_id) for order in db_orders)
    
    missing_order_ids = api_order_ids - db_order_ids
    print(f"Missing orders: {sorted(missing_order_ids)}")
    
    # Sync missing orders
    if missing_order_ids:
        print("\n3. Syncing missing orders...")
        synced = manual_sync_missing_orders(porsa_config.id, list(missing_order_ids))
        print(f"Synced {len(synced)} orders")
    
    # Final verification
    print("\n4. Final verification...")
    final_db_orders = WooCommerceOrder.objects.filter(
        client_name='Porsa.dk',
        date_created__gte=start_date,
        date_created__lte=end_date
    )
    
    paid_search_orders = final_db_orders.filter(
        attribution_utm_source='google',
        attribution_source_type='utm'
    )
    
    print(f"Total orders in database: {final_db_orders.count()}")
    print(f"Paid Search orders: {paid_search_orders.count()}")
    
    if paid_search_orders.exists():
        print("✅ Paid Search orders found!")
        for order in paid_search_orders:
            print(f"  Order {order.order_id}: {order.attribution_utm_source}/{order.attribution_source_type}")
    else:
        print("❌ No Paid Search orders found")


if __name__ == "__main__":
    run_comprehensive_sync_fix()
