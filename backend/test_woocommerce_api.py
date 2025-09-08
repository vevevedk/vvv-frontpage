#!/usr/bin/env python
"""
Test script for actual WooCommerce API connection
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import AccountConfiguration
from woocommerce.tasks import fetch_woocommerce_orders, sync_woocommerce_config

def test_real_woocommerce_connection():
    """Test actual WooCommerce API connection"""
    print("🔗 Testing Real WooCommerce API Connection")
    print("=" * 50)
    
    # Get the real WooCommerce configuration
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    print(f"Testing configuration: {config.account.name} - {config.name}")
    
    # Get WooCommerce config
    woocommerce_config = config.get_woocommerce_config()
    print(f"Store URL: {woocommerce_config['store_url']}")
    print(f"Consumer Key: {woocommerce_config['consumer_key'][:10]}...")
    print(f"Consumer Secret: {woocommerce_config['consumer_secret'][:10]}...")
    
    try:
        # Test fetching orders from the last 7 days
        print("\n📦 Fetching orders from the last 7 days...")
        start_date = datetime.now() - timedelta(days=7)
        end_date = datetime.now()
        
        orders = fetch_woocommerce_orders(config, start_date, end_date)
        
        print(f"✅ Successfully fetched {len(orders)} orders")
        
        if orders:
            print("\n📋 Sample order data:")
            sample_order = orders[0]
            print(f"   Order ID: {sample_order.get('id')}")
            print(f"   Order Number: {sample_order.get('number')}")
            print(f"   Status: {sample_order.get('status')}")
            print(f"   Total: {sample_order.get('total')} {sample_order.get('currency', 'NOK')}")
            print(f"   Customer: {sample_order.get('billing', {}).get('first_name', '')} {sample_order.get('billing', {}).get('last_name', '')}")
            print(f"   Date Created: {sample_order.get('date_created')}")
            
            # Show line items
            line_items = sample_order.get('line_items', [])
            print(f"   Line Items: {len(line_items)}")
            for item in line_items[:3]:  # Show first 3 items
                print(f"     - {item.get('name')} (Qty: {item.get('quantity')}, Price: {item.get('total')})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error connecting to WooCommerce API: {str(e)}")
        return False

def test_sync_task():
    """Test the actual sync task"""
    print("\n🔄 Testing WooCommerce Sync Task")
    print("=" * 50)
    
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    try:
        print(f"Starting sync for: {config.account.name} - {config.name}")
        
        # Run the sync task (this will make actual API calls)
        result = sync_woocommerce_config(config.id, 'manual_sync')
        
        print(f"✅ Sync completed!")
        print(f"   Orders processed: {result.get('orders_processed', 0)}")
        print(f"   Orders created: {result.get('orders_created', 0)}")
        print(f"   Orders updated: {result.get('orders_updated', 0)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error running sync task: {str(e)}")
        return False

def check_database_records():
    """Check what records were created in the database"""
    print("\n📊 Checking Database Records")
    print("=" * 50)
    
    from woocommerce.models import WooCommerceJob, WooCommerceOrder, WooCommerceSyncLog
    
    # Check jobs
    jobs = WooCommerceJob.objects.all().order_by('-created_at')[:5]
    print(f"Recent jobs: {jobs.count()}")
    for job in jobs:
        print(f"   {job.client_name} - {job.get_job_type_display()} ({job.status})")
    
    # Check orders
    orders = WooCommerceOrder.objects.all().order_by('-created_at')[:5]
    print(f"Recent orders: {orders.count()}")
    for order in orders:
        print(f"   {order.client_name} - Order #{order.order_number} ({order.status}) - {order.total} {order.currency}")
    
    # Check logs
    logs = WooCommerceSyncLog.objects.all().order_by('-created_at')[:5]
    print(f"Recent logs: {logs.count()}")
    for log in logs:
        print(f"   {log.client_name} - {log.level}: {log.message[:50]}...")

def main():
    """Main test function"""
    print("🚀 Starting Real WooCommerce API Tests")
    print("=" * 50)
    
    # Test API connection
    api_success = test_real_woocommerce_connection()
    
    if api_success:
        # Test sync task
        sync_success = test_sync_task()
        
        if sync_success:
            # Check database records
            check_database_records()
    
    print("\n" + "=" * 50)
    print("✅ WooCommerce API Tests Completed!")

if __name__ == '__main__':
    main() 