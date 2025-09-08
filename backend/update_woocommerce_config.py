#!/usr/bin/env python
"""
Script to update WooCommerce configuration with new API credentials
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import AccountConfiguration

def update_woocommerce_config():
    """Update WooCommerce configuration with new API credentials"""
    print("🔄 WooCommerce Configuration Updater")
    print("=" * 50)
    
    # Get the current configuration
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    print(f"📋 Current Configuration:")
    print(f"  Account: {config.account.name}")
    print(f"  Config Name: {config.name}")
    print(f"  Store URL: {config.get_config('store_url')}")
    print(f"  Consumer Key: {config.get_config('consumer_key')}")
    print(f"  Consumer Secret: {config.get_config('consumer_secret')}")
    
    print(f"\n🔧 Update Instructions:")
    print("1. Go to WooCommerce Admin → Settings → Advanced → REST API")
    print("2. Create a NEW API key with 'Read/Write' permissions")
    print("3. Copy the new Consumer Key and Consumer Secret")
    print("4. Enter them below:")
    
    # Get new credentials
    new_consumer_key = input("\nEnter new Consumer Key: ").strip()
    new_consumer_secret = input("Enter new Consumer Secret: ").strip()
    
    if not new_consumer_key or not new_consumer_secret:
        print("❌ Invalid credentials provided!")
        return
    
    # Update the configuration
    config_data = config.config_data.copy()
    config_data['consumer_key'] = new_consumer_key
    config_data['consumer_secret'] = new_consumer_secret
    
    config.config_data = config_data
    config.save()
    
    print(f"\n✅ Configuration updated successfully!")
    print(f"  New Consumer Key: {new_consumer_key}")
    print(f"  New Consumer Secret: {new_consumer_secret}")
    
    # Test the new configuration
    print(f"\n🧪 Testing new configuration...")
    test_url = f"{config.get_config('store_url')}/wp-json/wc/v3/system_status"
    params = {
        'consumer_key': new_consumer_key,
        'consumer_secret': new_consumer_secret,
    }
    
    try:
        import requests
        response = requests.get(test_url, params=params, timeout=10)
        if response.status_code == 200:
            print("✅ New API key is working!")
            data = response.json()
            print(f"   WooCommerce version: {data.get('version', 'Unknown')}")
        else:
            print(f"❌ New API key still has issues: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == "__main__":
    update_woocommerce_config() 