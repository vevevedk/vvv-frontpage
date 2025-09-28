#!/usr/bin/env python
"""
Check WooCommerce configurations in the database
"""
import psycopg2
import json

def check_woocommerce_configs():
    """Check what WooCommerce configurations exist"""
    try:
        # Connect to local database
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            database="vvv_database",
            user="vvv_user",
            password="vvv_password"
        )
        
        with conn.cursor() as cursor:
            # Check if woocommerce_orders table exists
            cursor.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'woocommerce_orders'
                );
            """)
            table_exists = cursor.fetchone()[0]
            print(f"WooCommerce orders table exists: {table_exists}")
            
            if table_exists:
                # Check order count
                cursor.execute("SELECT COUNT(*) FROM woocommerce_orders;")
                order_count = cursor.fetchone()[0]
                print(f"Total orders in database: {order_count}")
                
                # Check date range
                cursor.execute("""
                    SELECT MIN(order_date), MAX(order_date) 
                    FROM woocommerce_orders;
                """)
                date_range = cursor.fetchone()
                print(f"Date range: {date_range[0]} to {date_range[1]}")
                
                # Check status breakdown
                cursor.execute("""
                    SELECT status, COUNT(*) 
                    FROM woocommerce_orders 
                    GROUP BY status 
                    ORDER BY COUNT(*) DESC;
                """)
                statuses = cursor.fetchall()
                print("Status breakdown:")
                for status, count in statuses:
                    print(f"  {status}: {count}")
            
            # Check account configurations
            cursor.execute("""
                SELECT id, name, account_id, config_type, is_active
                FROM users_accountconfiguration 
                WHERE config_type = 'woocommerce';
            """)
            configs = cursor.fetchall()
            print(f"\nWooCommerce configurations: {len(configs)}")
            for config in configs:
                print(f"  ID: {config[0]}, Name: {config[1]}, Account: {config[2]}, Active: {config[3]}")
                
                # Get config data
                cursor.execute("""
                    SELECT config_data 
                    FROM users_accountconfiguration 
                    WHERE id = %s;
                """, (config[0],))
                config_data = cursor.fetchone()[0]
                if config_data:
                    print(f"    Store URL: {config_data.get('store_url', 'N/A')}")
                    print(f"    Consumer Key: {config_data.get('consumer_key', 'N/A')[:10]}...")
        
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_woocommerce_configs()
