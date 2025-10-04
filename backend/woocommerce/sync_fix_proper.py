#!/usr/bin/env python3
"""
Proper fix for WooCommerce sync issues
This addresses the root causes:
1. Missing required database fields in sync process
2. Database schema inconsistencies
3. Sync process not handling all WooCommerce order fields properly
"""

import os
import sys
import django
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.db import transaction
from django.utils import timezone
from woocommerce.models import WooCommerceOrder, WooCommerceJob, WooCommerceSyncLog
from users.models import AccountConfiguration
import requests
from decimal import Decimal


def parse_aware(dt_value):
    """Convert various datetime representations to aware UTC datetime or None."""
    if not dt_value:
        return None
    
    from django.utils import dateparse
    from django.utils import timezone as djtz
    
    if isinstance(dt_value, datetime):
        dt = dt_value
    else:
        # Try Django parser first
        dt = dateparse.parse_datetime(dt_value)
        if dt is None:
            # Fallback to fromisoformat with 'Z' handling
            try:
                dt = datetime.fromisoformat(str(dt_value).replace('Z', '+00:00'))
            except Exception:
                return None
    
    try:
        return dt if djtz.is_aware(dt) else djtz.make_aware(dt, djtz.utc)
    except Exception:
        # As a last resort, return naive parsed value
        return dt


def extract_attribution_data(order_data):
    """Extract attribution data from WooCommerce order meta fields."""
    attribution_data = {}
    
    if 'meta_data' in order_data:
        for meta_item in order_data['meta_data']:
            if isinstance(meta_item, dict):
                key = meta_item.get('key', '')
                value = meta_item.get('value', '')
                
                # Map WooCommerce attribution meta fields to our model fields
                if key == '_wc_order_attribution_device_type':
                    attribution_data['attribution_device_type'] = value
                elif key == '_wc_order_attribution_referrer':
                    attribution_data['attribution_referrer'] = value
                elif key == '_wc_order_attribution_session_count':
                    attribution_data['attribution_session_count'] = value
                elif key == '_wc_order_attribution_session_entry':
                    attribution_data['attribution_session_entry'] = value
                elif key == '_wc_order_attribution_session_pages':
                    attribution_data['attribution_session_pages'] = value
                elif key == '_wc_order_attribution_session_start_time':
                    attribution_data['attribution_session_start_time'] = value
                elif key == '_wc_order_attribution_source_type':
                    attribution_data['attribution_source_type'] = value
                elif key == '_wc_order_attribution_user_agent':
                    attribution_data['attribution_user_agent'] = value
                elif key == '_wc_order_attribution_utm_source':
                    attribution_data['attribution_utm_source'] = value
    
    return attribution_data


def create_order_with_proper_fields(config, order_data):
    """
    Create a WooCommerce order with all required fields properly set.
    This fixes the root cause of the sync issues.
    """
    order_id = str(order_data['id'])
    attribution_data = extract_attribution_data(order_data)
    
    # Get billing email for new customer detection
    billing_email = order_data.get('billing', {}).get('email', '')
    
    # Create order with ALL required fields
    order, created = WooCommerceOrder.objects.get_or_create(
        client_name=config.account.name,
        order_id=order_id,
        defaults={
            # Basic order info
            'order_number': order_data.get('number', order_id),
            'order_date': parse_aware(order_data.get('date_created')),
            'paid_date': parse_aware(order_data.get('date_paid')),
            'status': order_data.get('status', ''),
            'date_created': parse_aware(order_data.get('date_created')),
            'date_modified': parse_aware(order_data.get('date_modified', order_data.get('date_created'))),
            'date_completed': parse_aware(order_data.get('date_completed')),
            
            # Financial fields
            'shipping_total': Decimal(str(order_data.get('shipping_total', '0.00'))),
            'shipping_tax_total': Decimal(str(order_data.get('shipping_tax_total', '0.00'))),
            'fee_total': Decimal(str(order_data.get('fee_total', '0.00'))),
            'fee_tax_total': Decimal(str(order_data.get('fee_tax_total', '0.00'))),
            'tax_total': Decimal(str(order_data.get('tax_total', '0.00'))),
            'cart_discount': Decimal(str(order_data.get('cart_discount', '0.00'))),
            'order_discount': Decimal(str(order_data.get('order_discount', '0.00'))),
            'discount_total': Decimal(str(order_data.get('discount_total', '0.00'))),
            'order_total': Decimal(str(order_data.get('total', '0.00'))),
            'order_subtotal': Decimal(str(order_data.get('order_subtotal', '0.00'))),
            
            # Order metadata
            'order_key': order_data.get('order_key', ''),
            'order_currency': order_data.get('currency', 'USD'),
            
            # Payment details
            'payment_method': order_data.get('payment_method', ''),
            'payment_method_title': order_data.get('payment_method_title', ''),
            'transaction_id': order_data.get('transaction_id', ''),
            
            # Customer analytics
            'customer_ip_address': order_data.get('customer_ip_address', ''),
            'customer_user_agent': order_data.get('customer_user_agent', ''),
            
            # Shipping details
            'shipping_method': order_data.get('shipping_method', ''),
            
            # Customer info
            'customer_id': str(order_data.get('customer_id', 0)),
            'customer_user': order_data.get('customer_user', ''),
            
            # Detailed billing address
            'billing_first_name': order_data.get('billing', {}).get('first_name', ''),
            'billing_last_name': order_data.get('billing', {}).get('last_name', ''),
            'billing_company': order_data.get('billing', {}).get('company', ''),
            'billing_email': order_data.get('billing', {}).get('email', ''),
            'billing_phone': order_data.get('billing', {}).get('phone', ''),
            'billing_address_1': order_data.get('billing', {}).get('address_1', ''),
            'billing_address_2': order_data.get('billing', {}).get('address_2', ''),
            'billing_postcode': order_data.get('billing', {}).get('postcode', ''),
            'billing_city': order_data.get('billing', {}).get('city', ''),
            'billing_state': order_data.get('billing', {}).get('state', ''),
            'billing_country': order_data.get('billing', {}).get('country', ''),
            
            # Detailed shipping address
            'shipping_first_name': order_data.get('shipping', {}).get('first_name', ''),
            'shipping_last_name': order_data.get('shipping', {}).get('last_name', ''),
            'shipping_company': order_data.get('shipping', {}).get('company', ''),
            'shipping_phone': order_data.get('shipping', {}).get('phone', ''),
            'shipping_address_1': order_data.get('shipping', {}).get('address_1', ''),
            'shipping_address_2': order_data.get('shipping', {}).get('address_2', ''),
            'shipping_postcode': order_data.get('shipping', {}).get('postcode', ''),
            'shipping_city': order_data.get('shipping', {}).get('city', ''),
            'shipping_state': order_data.get('shipping', {}).get('state', ''),
            'shipping_country': order_data.get('shipping', {}).get('country', ''),
            
            # Customer notes and import key
            'customer_note': order_data.get('customer_note', ''),
            'wt_import_key': order_data.get('wt_import_key', ''),
            
            # Attribution data
            'attribution_device_type': attribution_data.get('attribution_device_type', ''),
            'attribution_referrer': attribution_data.get('attribution_referrer', ''),
            'attribution_session_count': attribution_data.get('attribution_session_count', 0),
            'attribution_session_entry': attribution_data.get('attribution_session_entry', ''),
            'attribution_session_pages': attribution_data.get('attribution_session_pages', 0),
            'attribution_session_start_time': parse_aware(attribution_data.get('attribution_session_start_time')),
            'attribution_source_type': attribution_data.get('attribution_source_type', ''),
            'attribution_user_agent': attribution_data.get('attribution_user_agent', ''),
            'attribution_utm_source': attribution_data.get('attribution_utm_source', ''),
            
            # Legacy fields for backward compatibility
            'total': Decimal(str(order_data.get('total', '0.00'))),
            'currency': order_data.get('currency', 'USD'),
            'billing_address': order_data.get('billing', {}),
            'shipping_address': order_data.get('shipping', {}),
            'is_new_customer': True,  # Default to True, will be updated below if needed
            'raw_data': order_data
        }
    )
    
    # Update new customer flag if we have a billing email
    if billing_email and created:
        # Check if this is actually a new customer
        existing_orders = WooCommerceOrder.objects.filter(
            client_name=config.account.name,
            billing_email=billing_email
        ).exclude(id=order.id).exists()
        
        order.is_new_customer = not existing_orders
        order.save(update_fields=['is_new_customer'])
    
    return order, created


def sync_missing_orders_properly(config_id, start_date, end_date):
    """
    Properly sync missing orders with all required fields.
    This fixes the root cause of the sync issues.
    """
    config = AccountConfiguration.objects.get(id=config_id, config_type='woocommerce')
    wc_config = config.get_woocommerce_config()
    
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
        'per_page': 100,
        'after': z(start_date),
        'before': z(end_date),
        'status': 'any',
        'orderby': 'date',
        'order': 'asc'
    }
    
    print(f"Fetching orders for {config.account.name} from {start_date} to {end_date}")
    
    # Fetch all orders from WooCommerce
    orders = []
    page = 1
    
    while True:
        params['page'] = page
        response = requests.get(api_url, headers=headers, params=params)
        
        if response.status_code != 200:
            print(f"❌ API error on page {page}: {response.status_code} - {response.text}")
            break
        
        page_orders = response.json()
        
        if not page_orders:
            break
            
        orders.extend(page_orders)
        page += 1
        
        # Safety check
        if page > 100:
            break
    
    print(f"Fetched {len(orders)} orders from WooCommerce")
    
    # Get existing orders from database
    existing_orders = WooCommerceOrder.objects.filter(
        client_name=config.account.name,
        date_created__gte=start_date,
        date_created__lte=end_date
    )
    
    existing_order_ids = set(int(order.order_id) for order in existing_orders)
    api_order_ids = set(order['id'] for order in orders)
    
    missing_order_ids = api_order_ids - existing_order_ids
    
    print(f"Found {len(missing_order_ids)} missing orders: {sorted(missing_order_ids)}")
    
    # Sync missing orders
    synced_orders = []
    
    for order_data in orders:
        if order_data['id'] in missing_order_ids:
            try:
                with transaction.atomic():
                    order, created = create_order_with_proper_fields(config, order_data)
                    synced_orders.append(order_data['id'])
                    print(f"✅ {'Created' if created else 'Updated'} order {order_data['id']}: {order.attribution_utm_source}/{order.attribution_source_type}")
            except Exception as e:
                print(f"❌ Error syncing order {order_data['id']}: {e}")
    
    return synced_orders


def run_proper_sync_fix():
    """
    Run the proper sync fix for all clients.
    """
    print("🔧 Starting proper WooCommerce sync fix...")
    
    # Get all WooCommerce configurations
    configs = AccountConfiguration.objects.filter(config_type='woocommerce')
    
    if not configs.exists():
        print("❌ No WooCommerce configurations found")
        return
    
    # Define the date range for the missing orders
    start_date = datetime(2025, 8, 30)
    end_date = datetime(2025, 9, 3)
    
    for config in configs:
        print(f"\n📊 Processing {config.account.name}...")
        
        try:
            synced_orders = sync_missing_orders_properly(config.id, start_date, end_date)
            print(f"✅ Synced {len(synced_orders)} orders for {config.account.name}")
            
            # Verify results
            final_orders = WooCommerceOrder.objects.filter(
                client_name=config.account.name,
                date_created__gte=start_date,
                date_created__lte=end_date
            )
            
            paid_search_orders = final_orders.filter(
                attribution_utm_source='google',
                attribution_source_type='utm'
            )
            
            print(f"   Total orders in period: {final_orders.count()}")
            print(f"   Paid Search orders: {paid_search_orders.count()}")
            
            if paid_search_orders.exists():
                print("   ✅ Paid Search orders found!")
                for order in paid_search_orders:
                    print(f"     Order {order.order_id}: {order.attribution_utm_source}/{order.attribution_source_type}")
            
        except Exception as e:
            print(f"❌ Error processing {config.account.name}: {e}")
    
    print("\n🎉 Proper sync fix completed!")


if __name__ == "__main__":
    run_proper_sync_fix()
