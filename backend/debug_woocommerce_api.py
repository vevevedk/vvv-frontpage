#!/usr/bin/env python
"""
Detailed debugging script for WooCommerce API authentication
"""
import os
import sys
import django
import requests
import json
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import AccountConfiguration

def debug_woocommerce_api():
    """Debug WooCommerce API authentication issues"""
    print("🔍 Detailed WooCommerce API Debug")
    print("=" * 50)
    
    # Get the WooCommerce configuration
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    print(f"📋 Configuration: {config.account.name} - {config.name}")
    print(f"  Store URL: {config.get_config('store_url')}")
    print(f"  Consumer Key: {config.get_config('consumer_key')}")
    print(f"  Consumer Secret: {config.get_config('consumer_secret')}")
    
    # Test basic connectivity first
    store_url = config.get_config('store_url')
    consumer_key = config.get_config('consumer_key')
    consumer_secret = config.get_config('consumer_secret')
    
    print(f"\n🌐 Testing Basic Connectivity")
    print("-" * 30)
    
    # Test 1: Basic store URL
    try:
        response = requests.get(store_url, timeout=10)
        print(f"✅ Store URL accessible: {response.status_code}")
    except Exception as e:
        print(f"❌ Store URL error: {str(e)}")
        return
    
    # Test 2: WordPress REST API
    wp_api_url = f"{store_url}/wp-json/"
    try:
        response = requests.get(wp_api_url, timeout=10)
        print(f"✅ WordPress REST API: {response.status_code}")
        if response.status_code == 200:
            wp_data = response.json()
            print(f"   WordPress version: {wp_data.get('version', 'Unknown')}")
    except Exception as e:
        print(f"❌ WordPress REST API error: {str(e)}")
        return
    
    # Test 3: WooCommerce REST API discovery
    wc_api_url = f"{store_url}/wp-json/wc/v3/"
    try:
        response = requests.get(wc_api_url, timeout=10)
        print(f"✅ WooCommerce REST API: {response.status_code}")
        if response.status_code == 200:
            wc_data = response.json()
            print(f"   WooCommerce version: {wc_data.get('version', 'Unknown')}")
    except Exception as e:
        print(f"❌ WooCommerce REST API error: {str(e)}")
        return
    
    print(f"\n🔐 Testing Authentication")
    print("-" * 30)
    
    # Test 4: Simple authenticated request
    test_url = f"{store_url}/wp-json/wc/v3/system_status"
    params = {
        'consumer_key': consumer_key,
        'consumer_secret': consumer_secret,
    }
    
    try:
        response = requests.get(test_url, params=params, timeout=10)
        print(f"🔍 Testing: {test_url}")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ Authentication successful!")
            data = response.json()
            print(f"   WooCommerce version: {data.get('version', 'Unknown')}")
            return True
        elif response.status_code == 401:
            print("❌ Authentication failed (401)")
            print(f"   Response: {response.text}")
            
            # Try to parse the error
            try:
                error_data = response.json()
                print(f"   Error code: {error_data.get('code', 'Unknown')}")
                print(f"   Error message: {error_data.get('message', 'Unknown')}")
            except:
                print(f"   Raw response: {response.text}")
        else:
            print(f"❌ Unexpected status: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Request error: {str(e)}")
        return False
    
    print(f"\n🔍 Testing Alternative Endpoints")
    print("-" * 30)
    
    # Test different endpoints
    endpoints = [
        '/wp-json/wc/v3/orders',
        '/wp-json/wc/v3/products',
        '/wp-json/wc/v3/customers',
        '/wp-json/wc/v3/system_status',
    ]
    
    for endpoint in endpoints:
        test_url = f"{store_url}{endpoint}"
        try:
            response = requests.get(test_url, params=params, timeout=10)
            print(f"🔍 {endpoint}: {response.status_code}")
            if response.status_code == 401:
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('message', 'Unknown')}")
                except:
                    print(f"   Error: {response.text[:100]}...")
        except Exception as e:
            print(f"❌ {endpoint}: {str(e)}")
    
    print(f"\n🔍 Testing Different Authentication Methods")
    print("-" * 30)
    
    # Test 1: Query parameters (current method)
    print("Testing query parameters method...")
    try:
        response = requests.get(test_url, params=params, timeout=10)
        print(f"   Query params: {response.status_code}")
    except Exception as e:
        print(f"   Query params error: {str(e)}")
    
    # Test 2: Basic auth
    print("Testing basic auth method...")
    try:
        response = requests.get(test_url, auth=(consumer_key, consumer_secret), timeout=10)
        print(f"   Basic auth: {response.status_code}")
    except Exception as e:
        print(f"   Basic auth error: {str(e)}")
    
    # Test 3: Headers
    print("Testing headers method...")
    try:
        headers = {
            'Authorization': f'Basic {consumer_key}:{consumer_secret}',
            'Content-Type': 'application/json'
        }
        response = requests.get(test_url, headers=headers, timeout=10)
        print(f"   Headers: {response.status_code}")
    except Exception as e:
        print(f"   Headers error: {str(e)}")
    
    print(f"\n💡 Troubleshooting Suggestions")
    print("-" * 30)
    print("1. Verify the API key is active and not revoked")
    print("2. Check if the API key has the correct user permissions")
    print("3. Ensure the WooCommerce REST API is enabled")
    print("4. Try creating a new API key with explicit READ permissions")
    print("5. Check if there are any security plugins blocking API access")
    print("6. Verify the store URL is correct (http vs https)")
    
    return False

if __name__ == "__main__":
    debug_woocommerce_api() 