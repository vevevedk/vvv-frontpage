#!/usr/bin/env python
"""
Test script to verify WooCommerce API credentials and permissions
"""
import os
import sys
import django
import requests
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import AccountConfiguration

def test_woocommerce_credentials():
    """Test WooCommerce API credentials"""
    print("🔐 Testing WooCommerce API Credentials")
    print("=" * 50)
    
    # Get the WooCommerce configuration
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    print(f"Testing configuration: {config.account.name} - {config.name}")
    
    # Get WooCommerce config
    woocommerce_config = config.get_woocommerce_config()
    store_url = woocommerce_config['store_url']
    consumer_key = woocommerce_config['consumer_key']
    consumer_secret = woocommerce_config['consumer_secret']
    
    print(f"Store URL: {store_url}")
    print(f"Consumer Key: {consumer_key[:10]}...")
    print(f"Consumer Secret: {consumer_secret[:10]}...")
    
    # Test basic API endpoint
    base_url = store_url.rstrip('/')
    api_url = f"{base_url}/wp-json/wc/v3/"
    
    headers = {
        'Content-Type': 'application/json',
    }
    
    params = {
        'consumer_key': consumer_key,
        'consumer_secret': consumer_secret,
    }
    
    try:
        print(f"\n🔍 Testing API endpoint: {api_url}")
        response = requests.get(api_url, headers=headers, params=params)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ API endpoint is accessible")
            api_data = response.json()
            print(f"API Info: {api_data}")
        else:
            print(f"❌ API endpoint error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing API endpoint: {str(e)}")
    
    # Test specific endpoints
    endpoints_to_test = [
        'orders',
        'products', 
        'customers',
        'system_status'
    ]
    
    for endpoint in endpoints_to_test:
        try:
            test_url = f"{base_url}/wp-json/wc/v3/{endpoint}"
            print(f"\n🔍 Testing endpoint: {endpoint}")
            
            response = requests.get(test_url, headers=headers, params=params)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"✅ {endpoint}: {len(data)} items returned")
                else:
                    print(f"✅ {endpoint}: Data returned")
            elif response.status_code == 401:
                print(f"❌ {endpoint}: Authentication failed")
            elif response.status_code == 403:
                print(f"❌ {endpoint}: Permission denied")
            else:
                print(f"❌ {endpoint}: Error - {response.text[:100]}")
                
        except Exception as e:
            print(f"❌ Error testing {endpoint}: {str(e)}")

def check_woocommerce_permissions():
    """Check what permissions the API key has"""
    print("\n🔑 Checking WooCommerce API Permissions")
    print("=" * 50)
    
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    woocommerce_config = config.get_woocommerce_config()
    store_url = woocommerce_config['store_url']
    consumer_key = woocommerce_config['consumer_key']
    consumer_secret = woocommerce_config['consumer_secret']
    
    base_url = store_url.rstrip('/')
    
    headers = {
        'Content-Type': 'application/json',
    }
    
    params = {
        'consumer_key': consumer_key,
        'consumer_secret': consumer_secret,
    }
    
    # Test read permissions
    read_endpoints = [
        'orders',
        'products',
        'customers',
        'system_status'
    ]
    
    print("📖 Testing READ permissions:")
    for endpoint in read_endpoints:
        try:
            test_url = f"{base_url}/wp-json/wc/v3/{endpoint}"
            response = requests.get(test_url, headers=headers, params=params)
            
            if response.status_code == 200:
                print(f"   ✅ {endpoint}: READ allowed")
            else:
                print(f"   ❌ {endpoint}: READ denied ({response.status_code})")
                
        except Exception as e:
            print(f"   ❌ {endpoint}: Error - {str(e)}")

def main():
    """Main test function"""
    print("🚀 Starting WooCommerce Credentials Test")
    print("=" * 50)
    
    test_woocommerce_credentials()
    check_woocommerce_permissions()
    
    print("\n" + "=" * 50)
    print("✅ WooCommerce Credentials Test Completed!")
    print("\nRecommendations:")
    print("1. Check if the API key has the correct permissions")
    print("2. Verify the consumer key and secret are correct")
    print("3. Ensure the API key has 'read' permissions for orders")
    print("4. Check if the WooCommerce REST API is enabled")

if __name__ == '__main__':
    main() 