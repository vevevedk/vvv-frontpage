#!/usr/bin/env python
"""
Setup database and sync WooCommerce data
"""
import os
import sys
import django
import psycopg2
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection
from woocommerce.models import WooCommerceOrder, ChannelClassification

def setup_database():
    """Create database tables"""
    print("🔧 Setting up database...")
    
    # Run migrations
    execute_from_command_line(['manage.py', 'migrate'])
    print("✅ Database migrations completed")

def seed_channel_classifications():
    """Seed channel classification rules"""
    print("🌱 Seeding channel classifications...")
    
    # Clear existing classifications
    ChannelClassification.objects.all().delete()
    
    # Create default classifications
    classifications = [
        # Direct
        {"source": "(direct)", "medium": "typein", "channel": "direct / typein", "channel_type": "Direct"},
        
        # Organic search (SEO)
        {"source": "google", "medium": "organic", "channel": "google / organic", "channel_type": "SEO"},
        {"source": "bing", "medium": "organic", "channel": "bing / organic", "channel_type": "SEO"},
        {"source": "duckduckgo.com", "medium": "referral", "channel": "duckduckgo / organic", "channel_type": "SEO"},
        
        # Paid search
        {"source": "google", "medium": "utm", "channel": "google / utm", "channel_type": "Paid Search"},
        {"source": "google", "medium": "cpc", "channel": "google / cpc", "channel_type": "Paid Search"},
        {"source": "google", "medium": "ppc", "channel": "google / ppc", "channel_type": "Paid Search"},
        {"source": "bing", "medium": "cpc", "channel": "bing / cpc", "channel_type": "Paid Search"},
        
        # Referrals
        {"source": "trustpilot", "medium": "utm", "channel": "trustpilot / utm", "channel_type": "Referal"},
        {"source": "trustpilot", "medium": "referral", "channel": "trustpilot / referral", "channel_type": "Referal"},
        {"source": "bing.com", "medium": "referral", "channel": "bing / referral", "channel_type": "Bing"},
        {"source": "dk.search.yahoo.com", "medium": "referral", "channel": "yahoo / referral", "channel_type": "Referral"},
        
        # ChatGPT
        {"source": "chatgpt.com", "medium": "utm", "channel": "chatgpt / utm", "channel_type": "ChatGpt"},
        {"source": "chatgpt", "medium": "referral", "channel": "chatgpt / referral", "channel_type": "ChatGpt"},
        
        # Handle malformed data
        {"source": "google,google", "medium": "utm", "channel": "google,google / utm", "channel_type": "ChannelNotFound"},
    ]
    
    for classification in classifications:
        ChannelClassification.objects.create(**classification)
    
    print(f"✅ Created {len(classifications)} channel classifications")

def create_sample_orders():
    """Create sample orders from the provided data"""
    print("📦 Creating sample orders...")
    
    # Sample orders from the provided data (last 30 days)
    sample_orders = [
        {
            'order_id': '54313',
            'order_date': datetime(2025, 8, 24, 10, 11, 26),
            'status': 'completed',
            'order_total': 134.0,
            'order_subtotal': 107.2,
            'tax_total': 26.8,
            'shipping_total': 0.0,
            'discount_total': 0.0,
            'order_currency': 'DKK',
            'attribution_utm_source': 'google',
            'attribution_source_type': 'utm',
            'billing_email': 'test1@example.com',
            'client_name': 'Porsa DK'
        },
        {
            'order_id': '54331',
            'order_date': datetime(2025, 8, 27, 10, 31, 6),
            'status': 'completed',
            'order_total': 187.5,
            'order_subtotal': 150.0,
            'tax_total': 37.5,
            'shipping_total': 0.0,
            'discount_total': 0.0,
            'order_currency': 'DKK',
            'attribution_utm_source': 'google',
            'attribution_source_type': 'utm',
            'billing_email': 'test2@example.com',
            'client_name': 'Porsa DK'
        },
        {
            'order_id': '54339',
            'order_date': datetime(2025, 8, 28, 17, 5, 13),
            'status': 'completed',
            'order_total': 111.0,
            'order_subtotal': 88.8,
            'tax_total': 22.2,
            'shipping_total': 0.0,
            'discount_total': 0.0,
            'order_currency': 'DKK',
            'attribution_utm_source': 'google',
            'attribution_source_type': 'utm',
            'billing_email': 'test3@example.com',
            'client_name': 'Porsa DK'
        },
        {
            'order_id': '54468',
            'order_date': datetime(2025, 9, 19, 7, 10, 8),
            'status': 'completed',
            'order_total': 2503.0,
            'order_subtotal': 2002.4,
            'tax_total': 500.6,
            'shipping_total': 0.0,
            'discount_total': 0.0,
            'order_currency': 'DKK',
            'attribution_utm_source': 'google',
            'attribution_source_type': 'utm',
            'billing_email': 'test4@example.com',
            'client_name': 'Porsa DK'
        },
        {
            'order_id': '54479',
            'order_date': datetime(2025, 9, 22, 13, 27, 29),
            'status': 'completed',
            'order_total': 1353.0,
            'order_subtotal': 1082.4,
            'tax_total': 270.6,
            'shipping_total': 0.0,
            'discount_total': 0.0,
            'order_currency': 'DKK',
            'attribution_utm_source': 'google',
            'attribution_source_type': 'utm',
            'billing_email': 'test5@example.com',
            'client_name': 'Porsa DK'
        }
    ]
    
    # Clear existing orders
    WooCommerceOrder.objects.all().delete()
    
    # Create sample orders
    for order_data in sample_orders:
        WooCommerceOrder.objects.create(**order_data)
    
    print(f"✅ Created {len(sample_orders)} sample orders")

def verify_data():
    """Verify the data was created correctly"""
    print("🔍 Verifying data...")
    
    # Check total orders
    total_orders = WooCommerceOrder.objects.count()
    print(f"Total orders: {total_orders}")
    
    # Check paid search orders
    paid_search_orders = WooCommerceOrder.objects.filter(
        attribution_utm_source='google',
        attribution_source_type='utm'
    ).count()
    print(f"Paid Search orders: {paid_search_orders}")
    
    # Check channel classifications
    classifications = ChannelClassification.objects.count()
    print(f"Channel classifications: {classifications}")
    
    # Show recent orders
    recent_orders = WooCommerceOrder.objects.filter(
        order_date__gte=datetime.now() - timedelta(days=30)
    ).order_by('-order_date')
    
    print(f"\\nRecent orders (last 30 days): {recent_orders.count()}")
    for order in recent_orders:
        print(f"  Order {order.order_id}: {order.order_date} - {order.attribution_utm_source}/{order.attribution_source_type} - {order.order_total} DKK")

def main():
    """Main setup function"""
    print("🚀 Setting up WooCommerce database and sample data")
    print("=" * 60)
    
    try:
        setup_database()
        seed_channel_classifications()
        create_sample_orders()
        verify_data()
        
        print("\\n✅ Setup complete! Your app should now show Paid Search orders.")
        print("\\nTo see the data in your app:")
        print("1. Start your frontend application")
        print("2. Navigate to the WooCommerce dashboard")
        print("3. Check the Channel Performance Report")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
