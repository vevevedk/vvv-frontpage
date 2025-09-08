#!/usr/bin/env python
"""
Fix WooCommerce configuration to use HTTPS URL
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import AccountConfiguration

def fix_woocommerce_url():
    """Update WooCommerce configuration to use HTTPS URL"""
    print("🔧 Fixing WooCommerce URL Configuration")
    print("=" * 50)
    
    # Get the WooCommerce configuration
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    print(f"📋 Current Configuration:")
    print(f"  Account: {config.account.name}")
    print(f"  Config Name: {config.name}")
    print(f"  Current Store URL: {config.get_config('store_url')}")
    
    # Update to HTTPS
    current_url = config.get_config('store_url')
    if current_url.startswith('http://'):
        new_url = current_url.replace('http://', 'https://')
    else:
        new_url = current_url
    
    print(f"\n🔄 Updating Store URL:")
    print(f"  From: {current_url}")
    print(f"  To: {new_url}")
    
    # Update the configuration
    config_data = config.config_data.copy()
    config_data['store_url'] = new_url
    
    config.config_data = config_data
    config.save()
    
    print(f"\n✅ Configuration updated successfully!")
    print(f"  New Store URL: {new_url}")
    
    # Test the updated configuration
    print(f"\n🧪 Testing updated configuration...")
    test_url = f"{new_url}/wp-json/wc/v3/system_status"
    params = {
        'consumer_key': config.get_config('consumer_key'),
        'consumer_secret': config.get_config('consumer_secret'),
    }
    
    try:
        import requests
        response = requests.get(test_url, params=params, timeout=10)
        if response.status_code == 200:
            print("✅ Updated configuration is working!")
            data = response.json()
            print(f"   WooCommerce version: {data.get('version', 'Unknown')}")
            
            # Test orders endpoint
            orders_url = f"{new_url}/wp-json/wc/v3/orders"
            orders_response = requests.get(orders_url, params=params, timeout=10)
            print(f"   Orders endpoint: {orders_response.status_code}")
            
            if orders_response.status_code == 200:
                orders_data = orders_response.json()
                print(f"   Orders found: {len(orders_data)}")
            else:
                print(f"   Orders error: {orders_response.text[:100]}...")
                
        else:
            print(f"❌ Updated configuration still has issues: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == "__main__":
    fix_woocommerce_url() 