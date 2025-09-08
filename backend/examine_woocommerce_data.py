#!/usr/bin/env python
"""
Django script to examine WooCommerce data structure and content.
Run this with: python manage.py shell < examine_woocommerce_data.py
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from django.db import connection
from woocommerce.models import WooCommerceOrder, ChannelClassification

def main():
    """Main function to run all examinations"""
    print("=" * 80)
    print("WOOCOMMERCE DATABASE STRUCTURE EXAMINATION")
    print("=" * 80)
    
    # 1. Check what tables exist
    print("\n1. DATABASE TABLES")
    print("-" * 40)
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE '%woocommerce%'
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            
            if tables:
                for table in tables:
                    print(f"✓ Table: {table[0]}")
            else:
                print("❌ No WooCommerce tables found!")
                return
    except Exception as e:
        print(f"Error checking tables: {e}")
        return
    
    # 2. Check WooCommerce orders table structure
    print("\n2. WOOCOMMERCE ORDERS TABLE STRUCTURE")
    print("-" * 40)
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = 'woocommerce_orders' 
                AND table_schema = 'public'
                ORDER BY ordinal_position;
            """)
            columns = cursor.fetchall()
            
            if columns:
                print(f"Found {len(columns)} columns:")
                for col in columns:
                    print(f"  • {col[0]:<25} | Type: {col[1]:<15} | Nullable: {col[2]}")
            else:
                print("❌ No columns found in woocommerce_orders table!")
                return
    except Exception as e:
        print(f"Error checking columns: {e}")
        return
    
    # 3. Check order count
    print("\n3. WOOCOMMERCE ORDERS DATA")
    print("-" * 40)
    try:
        order_count = WooCommerceOrder.objects.count()
        print(f"Total orders in database: {order_count}")
        
        if order_count == 0:
            print("❌ No orders found in database!")
            return
        
        # Get sample orders
        sample_orders = WooCommerceOrder.objects.all()[:3]
        print(f"\nExamining {len(sample_orders)} sample orders:")
        
        for i, order in enumerate(sample_orders):
            print(f"\n--- Order {i+1} ---")
            print(f"  ID: {order.id}")
            print(f"  Order ID: {order.order_id}")
            print(f"  Client: {order.client_name}")
            print(f"  Total: {order.total}")
            print(f"  Date: {order.date_created}")
            print(f"  Status: {order.status}")
            
            # Examine raw_data
            if order.raw_data:
                print(f"  Raw data type: {type(order.raw_data)}")
                if isinstance(order.raw_data, dict):
                    print(f"  Raw data keys ({len(order.raw_data)}): {list(order.raw_data.keys())}")
                    
                    # Look for traffic source related fields
                    traffic_fields = ['utm_source', 'utm_medium', 'source', 'medium', 'referrer']
                    found_traffic_fields = []
                    for field in traffic_fields:
                        if field in order.raw_data:
                            found_traffic_fields.append(f"{field}: {order.raw_data[field]}")
                    
                    if found_traffic_fields:
                        print(f"  Traffic source fields found: {found_traffic_fields}")
                    else:
                        print(f"  ❌ No traffic source fields found in raw_data")
                    
                    # Check meta_data
                    if 'meta_data' in order.raw_data:
                        meta_data = order.raw_data['meta_data']
                        print(f"  Meta data type: {type(meta_data)}")
                        if isinstance(meta_data, list):
                            meta_keys = [item.get('key', '') for item in meta_data if isinstance(item, dict)]
                            print(f"  Meta data keys ({len(meta_keys)}): {meta_keys}")
                else:
                    print(f"  Raw data is not a dict: {order.raw_data}")
            else:
                print(f"  ❌ No raw_data")
    except Exception as e:
        print(f"Error examining orders: {e}")
        return
    
    # 4. Check channel classifications
    print("\n4. CHANNEL CLASSIFICATIONS")
    print("-" * 40)
    try:
        classifications = ChannelClassification.objects.all()
        print(f"Total classifications: {classifications.count()}")
        
        if classifications.count() > 0:
            print("\nSample classifications:")
            for cls in classifications[:5]:
                print(f"  • {cls.source}/{cls.medium} → {cls.channel_type} (Active: {cls.is_active})")
        else:
            print("❌ No channel classifications found!")
    except Exception as e:
        print(f"Error examining classifications: {e}")
    
    print("\n" + "=" * 80)
    print("EXAMINATION COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()
