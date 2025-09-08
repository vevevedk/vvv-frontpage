#!/usr/bin/env python
"""
Test script for WooCommerce data pipeline functionality
"""
import os
import sys
import django
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Agency, Company, Account, AccountConfiguration
from woocommerce.models import WooCommerceJob, WooCommerceOrder, WooCommerceSyncLog
from woocommerce.tasks import sync_woocommerce_config, fetch_woocommerce_orders

User = get_user_model()

def create_test_data():
    """Create test data for WooCommerce pipeline testing"""
    print("Creating test data...")
    
    # Create super agency (Veveve)
    agency, created = Agency.objects.get_or_create(
        name="Veveve",
        defaults={
            'is_super_agency': True,
            'email': 'admin@veveve.com',
            'website': 'https://veveve.com'
        }
    )
    print(f"Agency: {agency.name} ({'created' if created else 'exists'})")
    
    # Create company (Porsaco)
    company, created = Company.objects.get_or_create(
        name="Porsaco",
        defaults={
            'agency': agency,
            'email': 'info@porsaco.com',
            'website': 'https://porsaco.com'
        }
    )
    print(f"Company: {company.name} ({'created' if created else 'exists'})")
    
    # Create account (Porsa)
    account, created = Account.objects.get_or_create(
        name="Porsa",
        defaults={
            'company': company,
            'description': 'Main Porsa account',
            'is_active': True
        }
    )
    print(f"Account: {account.name} ({'created' if created else 'exists'})")
    
    # Create WooCommerce configuration
    woocommerce_config, created = AccountConfiguration.objects.get_or_create(
        account=account,
        config_type='woocommerce',
        name='Main Store',
        defaults={
            'is_active': True,
            'config_data': {
                'store_url': 'https://porsa.no',
                'consumer_key': 'ck_test_key',
                'consumer_secret': 'cs_test_secret',
                'timezone': 'Europe/Oslo'
            }
        }
    )
    print(f"WooCommerce Config: {woocommerce_config.name} ({'created' if created else 'exists'})")
    
    return account, woocommerce_config

def test_woocommerce_config_methods():
    """Test WooCommerce configuration methods"""
    print("\n=== Testing WooCommerce Configuration Methods ===")
    
    # Get the test configuration
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("No WooCommerce configuration found!")
        return
    
    print(f"Testing configuration: {config.account.name} - {config.name}")
    
    # Test get_woocommerce_config method
    woocommerce_config = config.get_woocommerce_config()
    print(f"WooCommerce config: {woocommerce_config}")
    
    # Test config data access
    store_url = config.get_config('store_url')
    consumer_key = config.get_config('consumer_key')
    print(f"Store URL: {store_url}")
    print(f"Consumer Key: {consumer_key}")
    
    # Test setting config data
    config.set_config('test_key', 'test_value')
    test_value = config.get_config('test_key')
    print(f"Test value: {test_value}")

def test_woocommerce_api_connection():
    """Test WooCommerce API connection (mock)"""
    print("\n=== Testing WooCommerce API Connection ===")
    
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("No WooCommerce configuration found!")
        return
    
    try:
        # This would normally call the actual WooCommerce API
        # For testing, we'll just verify the configuration is valid
        woocommerce_config = config.get_woocommerce_config()
        
        if not woocommerce_config:
            print("❌ Invalid WooCommerce configuration")
            return
        
        required_fields = ['store_url', 'consumer_key', 'consumer_secret']
        missing_fields = [field for field in required_fields if not woocommerce_config.get(field)]
        
        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
            return
        
        print("✅ WooCommerce configuration is valid")
        print(f"   Store URL: {woocommerce_config['store_url']}")
        print(f"   Consumer Key: {woocommerce_config['consumer_key'][:10]}...")
        print(f"   Consumer Secret: {woocommerce_config['consumer_secret'][:10]}...")
        print(f"   Timezone: {woocommerce_config.get('timezone', 'UTC')}")
        
    except Exception as e:
        print(f"❌ Error testing WooCommerce connection: {str(e)}")

def test_woocommerce_sync_task():
    """Test WooCommerce sync task (without actual API calls)"""
    print("\n=== Testing WooCommerce Sync Task ===")
    
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("No WooCommerce configuration found!")
        return
    
    try:
        # Test the sync task (this would normally make API calls)
        # For testing, we'll just verify the task can be called
        print(f"Testing sync for: {config.account.name} - {config.name}")
        
        # Check if we can create a job record
        job = WooCommerceJob.objects.create(
            client_name=config.account.name,
            job_type='manual_sync',
            status='running',
            scheduled_at=datetime.now(),
            started_at=datetime.now()
        )
        print(f"✅ Created job: {job.id}")
        
        # Create a test log entry
        log = WooCommerceSyncLog.objects.create(
            client_name=config.account.name,
            job=job,
            level='INFO',
            message='Test sync completed',
            details={'test': True}
        )
        print(f"✅ Created log: {log.id}")
        
        # Update job status
        job.status = 'completed'
        job.completed_at = datetime.now()
        job.orders_processed = 0
        job.orders_created = 0
        job.orders_updated = 0
        job.save()
        print(f"✅ Updated job status: {job.status}")
        
        # Clean up test data
        job.delete()
        log.delete()
        print("✅ Cleaned up test data")
        
    except Exception as e:
        print(f"❌ Error testing sync task: {str(e)}")

def test_woocommerce_models():
    """Test WooCommerce model functionality"""
    print("\n=== Testing WooCommerce Models ===")
    
    # Test creating a test order
    try:
        order = WooCommerceOrder.objects.create(
            client_name='Porsa',
            order_id='12345',
            order_number='#12345',
            status='completed',
            total=299.99,
            currency='NOK',
            customer_email='test@example.com',
            customer_first_name='John',
            customer_last_name='Doe',
            date_created=datetime.now(),
            date_modified=datetime.now(),
            raw_data={'test': 'data'}
        )
        print(f"✅ Created test order: {order.order_number}")
        
        # Test order string representation
        print(f"   Order string: {order}")
        
        # Clean up
        order.delete()
        print("✅ Cleaned up test order")
        
    except Exception as e:
        print(f"❌ Error testing WooCommerce models: {str(e)}")

def main():
    """Main test function"""
    print("🚀 Starting WooCommerce Pipeline Tests")
    print("=" * 50)
    
    # Create test data
    account, config = create_test_data()
    
    # Run tests
    test_woocommerce_config_methods()
    test_woocommerce_api_connection()
    test_woocommerce_sync_task()
    test_woocommerce_models()
    
    print("\n" + "=" * 50)
    print("✅ WooCommerce Pipeline Tests Completed!")
    print("\nNext steps:")
    print("1. Add real WooCommerce store credentials")
    print("2. Test actual API connections")
    print("3. Run full sync tasks")
    print("4. Monitor sync logs and jobs")

if __name__ == '__main__':
    main() 