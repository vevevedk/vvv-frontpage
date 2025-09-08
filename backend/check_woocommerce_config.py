#!/usr/bin/env python
"""
Check WooCommerce configuration and help troubleshoot API issues
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import AccountConfiguration

def check_current_config():
    """Check the current WooCommerce configuration"""
    print("🔍 Checking Current WooCommerce Configuration")
    print("=" * 50)
    
    configs = AccountConfiguration.objects.filter(config_type='woocommerce')
    
    if not configs.exists():
        print("❌ No WooCommerce configurations found!")
        return
    
    for config in configs:
        print(f"\n📋 Configuration: {config.account.name} - {config.name}")
        print(f"   Account: {config.account.name}")
        print(f"   Config Name: {config.name}")
        print(f"   Config Type: {config.config_type}")
        print(f"   Is Active: {config.is_active}")
        
        woocommerce_config = config.get_woocommerce_config()
        if woocommerce_config:
            print(f"   Store URL: {woocommerce_config.get('store_url', 'Not set')}")
            print(f"   Consumer Key: {woocommerce_config.get('consumer_key', 'Not set')[:10]}...")
            print(f"   Consumer Secret: {woocommerce_config.get('consumer_secret', 'Not set')[:10]}...")
            print(f"   Timezone: {woocommerce_config.get('timezone', 'UTC')}")
        else:
            print("   ❌ Invalid WooCommerce configuration")
        
        print(f"   Raw Config Data: {config.config_data}")

def update_config():
    """Update the WooCommerce configuration with new credentials"""
    print("\n🔄 Updating WooCommerce Configuration")
    print("=" * 50)
    
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    print(f"Current configuration: {config.account.name} - {config.name}")
    
    # You can update these values with the correct API credentials
    new_config_data = {
        'store_url': 'https://www.porsa.dk',  # Make sure this is correct
        'consumer_key': 'YOUR_NEW_CONSUMER_KEY',  # Replace with actual key
        'consumer_secret': 'YOUR_NEW_CONSUMER_SECRET',  # Replace with actual secret
        'timezone': 'Europe/Copenhagen'
    }
    
    print("\n📝 To update the configuration, please:")
    print("1. Go to WooCommerce Admin → Advanced → REST API")
    print("2. Create a new API key with READ permissions for:")
    print("   - Orders")
    print("   - Products") 
    print("   - Customers")
    print("   - System Status")
    print("3. Copy the Consumer Key and Consumer Secret")
    print("4. Update the configuration in the database")
    
    print(f"\nCurrent config_data: {config.config_data}")
    print(f"Suggested new config_data: {new_config_data}")

def test_simple_connection():
    """Test a simple connection to verify the store URL"""
    print("\n🌐 Testing Store URL Connection")
    print("=" * 50)
    
    config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found!")
        return
    
    woocommerce_config = config.get_woocommerce_config()
    if not woocommerce_config:
        print("❌ Invalid WooCommerce configuration!")
        return
    
    store_url = woocommerce_config.get('store_url')
    print(f"Testing store URL: {store_url}")
    
    try:
        import requests
        response = requests.get(store_url, timeout=10)
        print(f"✅ Store URL is accessible (Status: {response.status_code})")
        
        # Test if WooCommerce REST API is available
        api_url = f"{store_url.rstrip('/')}/wp-json/wc/v3/"
        api_response = requests.get(api_url, timeout=10)
        print(f"API endpoint test: {api_url}")
        print(f"API response status: {api_response.status_code}")
        
        if api_response.status_code == 200:
            print("✅ WooCommerce REST API is accessible")
        else:
            print(f"❌ WooCommerce REST API returned status: {api_response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing store URL: {str(e)}")

def main():
    """Main function"""
    print("🚀 WooCommerce Configuration Checker")
    print("=" * 50)
    
    check_current_config()
    test_simple_connection()
    update_config()
    
    print("\n" + "=" * 50)
    print("✅ Configuration check completed!")
    print("\nNext steps:")
    print("1. Verify the store URL is correct")
    print("2. Create a new API key with proper permissions")
    print("3. Update the configuration in the database")
    print("4. Test the connection again")

if __name__ == '__main__':
    main() 