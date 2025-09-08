#!/usr/bin/env python
"""
Comprehensive WooCommerce API test to identify the root cause
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

def comprehensive_woocommerce_test():
    """Comprehensive test to identify WooCommerce API issues"""
    print("🔍 Comprehensive WooCommerce API Test")
    print("=" * 60)
    
    # Get the WooCommerce configuration
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    store_url = config.get_config('store_url')
    consumer_key = config.get_config('consumer_key')
    consumer_secret = config.get_config('consumer_secret')
    
    print(f"📋 Configuration:")
    print(f"  Store URL: {store_url}")
    print(f"  Consumer Key: {consumer_key}")
    print(f"  Consumer Secret: {consumer_secret}")
    
    print(f"\n🌐 Step 1: Basic Connectivity Tests")
    print("-" * 40)
    
    # Test 1: Basic store access
    try:
        response = requests.get(store_url, timeout=10)
        print(f"✅ Store accessible: {response.status_code}")
    except Exception as e:
        print(f"❌ Store access failed: {str(e)}")
        return
    
    # Test 2: WordPress REST API
    try:
        response = requests.get(f"{store_url}/wp-json/", timeout=10)
        print(f"✅ WordPress REST API: {response.status_code}")
        if response.status_code == 200:
            wp_data = response.json()
            print(f"   WordPress version: {wp_data.get('version', 'Unknown')}")
            print(f"   Namespaces: {wp_data.get('namespaces', [])}")
    except Exception as e:
        print(f"❌ WordPress REST API failed: {str(e)}")
        return
    
    # Test 3: WooCommerce REST API discovery
    try:
        response = requests.get(f"{store_url}/wp-json/wc/v3/", timeout=10)
        print(f"✅ WooCommerce REST API: {response.status_code}")
        if response.status_code == 200:
            wc_data = response.json()
            print(f"   WooCommerce version: {wc_data.get('version', 'Unknown')}")
            print(f"   Routes available: {list(wc_data.get('routes', {}).keys())}")
    except Exception as e:
        print(f"❌ WooCommerce REST API failed: {str(e)}")
        return
    
    print(f"\n🔐 Step 2: Authentication Method Tests")
    print("-" * 40)
    
    # Test different authentication methods
    test_url = f"{store_url}/wp-json/wc/v3/system_status"
    
    # Method 1: Query parameters (standard WooCommerce method)
    print("Testing query parameters method...")
    try:
        params = {
            'consumer_key': consumer_key,
            'consumer_secret': consumer_secret,
        }
        response = requests.get(test_url, params=params, timeout=10)
        print(f"   Query params: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ SUCCESS!")
            data = response.json()
            print(f"   WooCommerce version: {data.get('version', 'Unknown')}")
            return True
        elif response.status_code == 401:
            error_data = response.json()
            print(f"   ❌ 401: {error_data.get('message', 'Unknown error')}")
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Method 2: Basic authentication
    print("Testing basic authentication...")
    try:
        response = requests.get(test_url, auth=(consumer_key, consumer_secret), timeout=10)
        print(f"   Basic auth: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ SUCCESS!")
            return True
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    # Method 3: Authorization header
    print("Testing authorization header...")
    try:
        import base64
        auth_string = f"{consumer_key}:{consumer_secret}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
        
        headers = {
            'Authorization': f'Basic {auth_b64}',
            'Content-Type': 'application/json'
        }
        response = requests.get(test_url, headers=headers, timeout=10)
        print(f"   Auth header: {response.status_code}")
        if response.status_code == 200:
            print("   ✅ SUCCESS!")
            return True
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
    
    print(f"\n🔍 Step 3: Alternative Endpoint Tests")
    print("-" * 40)
    
    # Test different endpoints to see if any work
    endpoints = [
        '/wp-json/wc/v3/system_status',
        '/wp-json/wc/v3/orders',
        '/wp-json/wc/v3/products',
        '/wp-json/wc/v3/customers',
        '/wp-json/wc/v3/reports/sales',
    ]
    
    params = {
        'consumer_key': consumer_key,
        'consumer_secret': consumer_secret,
    }
    
    for endpoint in endpoints:
        test_url = f"{store_url}{endpoint}"
        try:
            response = requests.get(test_url, params=params, timeout=10)
            print(f"🔍 {endpoint}: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✅ SUCCESS with {endpoint}!")
                return True
            elif response.status_code == 401:
                error_data = response.json()
                print(f"   ❌ 401: {error_data.get('message', 'Unknown error')}")
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
    
    print(f"\n🔍 Step 4: Security Plugin Detection")
    print("-" * 40)
    
    # Check for common security plugins that might block API access
    security_checks = [
        '/wp-content/plugins/wordfence/',
        '/wp-content/plugins/sucuri-scanner/',
        '/wp-content/plugins/all-in-one-wp-security-and-firewall/',
        '/wp-content/plugins/limit-login-attempts-reloaded/',
        '/wp-content/plugins/updraftplus/',
    ]
    
    for check in security_checks:
        try:
            response = requests.get(f"{store_url}{check}", timeout=5)
            if response.status_code == 200:
                print(f"⚠️  Potential security plugin detected: {check}")
        except:
            pass
    
    print(f"\n💡 Step 5: Troubleshooting Recommendations")
    print("-" * 40)
    print("1. 🔑 Create a NEW API key with these exact settings:")
    print("   - Description: 'VVV Data Sync'")
    print("   - User: Select an admin user")
    print("   - Permissions: 'Læs/Skriv' (Read/Write)")
    print("   - Make sure to copy BOTH Consumer Key AND Consumer Secret")
    print()
    print("2. 🔧 Check WooCommerce settings:")
    print("   - Go to WooCommerce → Settings → Advanced → REST API")
    print("   - Ensure 'Enable REST API' is checked")
    print("   - Check if there are any security restrictions")
    print()
    print("3. 🛡️ Check for security plugins:")
    print("   - Wordfence, Sucuri, All-in-One Security")
    print("   - These might be blocking API access")
    print("   - Temporarily disable them for testing")
    print()
    print("4. 🌐 Check server configuration:")
    print("   - Ensure mod_rewrite is enabled")
    print("   - Check .htaccess file for restrictions")
    print("   - Verify SSL/HTTPS settings")
    print()
    print("5. 🔄 Try alternative store URL:")
    print("   - Use https:// instead of http://")
    print("   - Or try www.porsa.dk vs porsa.dk")
    
    return False

if __name__ == "__main__":
    comprehensive_woocommerce_test() 