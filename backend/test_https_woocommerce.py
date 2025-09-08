#!/usr/bin/env python
"""
Test WooCommerce API with HTTPS URL
"""
import os
import sys
import django
import requests

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import AccountConfiguration

def test_https_woocommerce():
    """Test WooCommerce API with HTTPS URL"""
    print("🔒 Testing WooCommerce API with HTTPS")
    print("=" * 50)
    
    # Get the WooCommerce configuration
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    consumer_key = config.get_config('consumer_key')
    consumer_secret = config.get_config('consumer_secret')
    
    # Test with HTTPS URL
    https_url = "https://www.porsa.dk"
    test_url = f"{https_url}/wp-json/wc/v3/system_status"
    
    params = {
        'consumer_key': consumer_key,
        'consumer_secret': consumer_secret,
    }
    
    print(f"🔍 Testing HTTPS URL: {test_url}")
    
    try:
        response = requests.get(test_url, params=params, timeout=10)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ SUCCESS with HTTPS!")
            data = response.json()
            print(f"   WooCommerce version: {data.get('version', 'Unknown')}")
            return True
        elif response.status_code == 401:
            error_data = response.json()
            print(f"   ❌ 401: {error_data.get('message', 'Unknown error')}")
        else:
            print(f"   ❌ Unexpected status: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    return False

if __name__ == "__main__":
    test_https_woocommerce() 