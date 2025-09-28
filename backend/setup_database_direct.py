#!/usr/bin/env python
"""
Direct database setup for WooCommerce data
"""
import psycopg2
from datetime import datetime, timedelta

def setup_database():
    """Create database tables and sample data"""
    print("🔧 Setting up WooCommerce database...")
    
    try:
        conn = psycopg2.connect(
            host='localhost',
            port='5432',
            database='vvv_database',
            user='vvv_user',
            password='vvv_password'
        )
        
        with conn.cursor() as cursor:
            # Create woocommerce_orders table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS woocommerce_orders (
                    id SERIAL PRIMARY KEY,
                    client_name VARCHAR(255) DEFAULT 'Unknown',
                    order_id VARCHAR(50) NOT NULL,
                    order_number VARCHAR(50),
                    order_date TIMESTAMP NOT NULL,
                    paid_date TIMESTAMP,
                    status VARCHAR(50),
                    shipping_total DECIMAL(10,2) DEFAULT 0,
                    shipping_tax_total DECIMAL(10,2) DEFAULT 0,
                    fee_total DECIMAL(10,2) DEFAULT 0,
                    fee_tax_total DECIMAL(10,2) DEFAULT 0,
                    tax_total DECIMAL(10,2) DEFAULT 0,
                    cart_discount DECIMAL(10,2) DEFAULT 0,
                    order_discount DECIMAL(10,2) DEFAULT 0,
                    discount_total DECIMAL(10,2) DEFAULT 0,
                    order_total DECIMAL(10,2) NOT NULL,
                    order_subtotal DECIMAL(10,2) DEFAULT 0,
                    order_key VARCHAR(100),
                    order_currency VARCHAR(3) DEFAULT 'USD',
                    payment_method VARCHAR(100),
                    payment_method_title VARCHAR(100),
                    transaction_id VARCHAR(100),
                    customer_ip_address INET,
                    customer_user_agent TEXT,
                    shipping_method VARCHAR(100),
                    customer_id VARCHAR(50),
                    customer_user VARCHAR(100),
                    billing_first_name VARCHAR(100),
                    billing_last_name VARCHAR(100),
                    billing_company VARCHAR(100),
                    billing_email VARCHAR(255),
                    billing_phone VARCHAR(20),
                    billing_address_1 VARCHAR(255),
                    billing_address_2 VARCHAR(255),
                    billing_postcode VARCHAR(20),
                    billing_city VARCHAR(100),
                    billing_state VARCHAR(100),
                    billing_country VARCHAR(100),
                    shipping_first_name VARCHAR(100),
                    shipping_last_name VARCHAR(100),
                    shipping_company VARCHAR(100),
                    shipping_phone VARCHAR(20),
                    shipping_address_1 VARCHAR(255),
                    shipping_address_2 VARCHAR(255),
                    shipping_postcode VARCHAR(20),
                    shipping_city VARCHAR(100),
                    shipping_state VARCHAR(100),
                    shipping_country VARCHAR(100),
                    customer_note TEXT,
                    wt_import_key VARCHAR(100),
                    attribution_device_type VARCHAR(50),
                    attribution_referrer VARCHAR(255),
                    attribution_session_count INTEGER,
                    attribution_session_entry VARCHAR(255),
                    attribution_session_pages INTEGER,
                    attribution_session_start_time TIMESTAMP,
                    attribution_source_type VARCHAR(50),
                    attribution_user_agent TEXT,
                    attribution_utm_source VARCHAR(255),
                    raw_data JSONB DEFAULT '{}',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(client_name, order_id)
                );
            """)
            
            # Create woocommerce_channel_classifications table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS woocommerce_channel_classifications (
                    id SERIAL PRIMARY KEY,
                    source VARCHAR(255) NOT NULL,
                    medium VARCHAR(255) NOT NULL,
                    source_medium VARCHAR(255),
                    channel VARCHAR(255),
                    channel_type VARCHAR(50),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(source, medium)
                );
            """)
            
            print("✅ Database tables created")
            
            # Insert channel classifications
            classifications = [
                ('(direct)', 'typein', '(direct)/typein', 'direct / typein', 'Direct'),
                ('google', 'organic', 'google/organic', 'google / organic', 'SEO'),
                ('google', 'utm', 'google/utm', 'google / utm', 'Paid Search'),
                ('google', 'cpc', 'google/cpc', 'google / cpc', 'Paid Search'),
                ('bing', 'organic', 'bing/organic', 'bing / organic', 'SEO'),
                ('bing', 'cpc', 'bing/cpc', 'bing / cpc', 'Paid Search'),
                ('duckduckgo.com', 'referral', 'duckduckgo.com/referral', 'duckduckgo / organic', 'SEO'),
                ('trustpilot', 'utm', 'trustpilot/utm', 'trustpilot / utm', 'Referal'),
                ('chatgpt.com', 'utm', 'chatgpt.com/utm', 'chatgpt / utm', 'ChatGpt'),
                ('bing.com', 'referral', 'bing.com/referral', 'bing / referral', 'Bing'),
                ('dk.search.yahoo.com', 'referral', 'dk.search.yahoo.com/referral', 'yahoo / referral', 'Referral'),
            ]
            
            cursor.execute("DELETE FROM woocommerce_channel_classifications;")
            for source, medium, source_medium, channel, channel_type in classifications:
                cursor.execute("""
                    INSERT INTO woocommerce_channel_classifications 
                    (source, medium, source_medium, channel, channel_type)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (source, medium) DO NOTHING;
                """, (source, medium, source_medium, channel, channel_type))
            
            print(f"✅ Created {len(classifications)} channel classifications")
            
            # Insert sample orders (last 30 days with Paid Search)
            sample_orders = [
                ('54313', '2025-08-24 10:11:26', 'completed', 134.0, 107.2, 26.8, 0.0, 0.0, 'DKK', 'google', 'utm', 'test1@example.com', 'Porsa DK'),
                ('54331', '2025-08-27 10:31:06', 'completed', 187.5, 150.0, 37.5, 0.0, 0.0, 'DKK', 'google', 'utm', 'test2@example.com', 'Porsa DK'),
                ('54339', '2025-08-28 17:05:13', 'completed', 111.0, 88.8, 22.2, 0.0, 0.0, 'DKK', 'google', 'utm', 'test3@example.com', 'Porsa DK'),
                ('54340', '2025-08-28 22:19:04', 'completed', 34.0, 27.2, 6.8, 0.0, 0.0, 'DKK', 'google', 'utm', 'test4@example.com', 'Porsa DK'),
                ('54342', '2025-08-29 8:55:44', 'completed', 85.0, 68.0, 17.0, 0.0, 0.0, 'DKK', 'google', 'utm', 'test5@example.com', 'Porsa DK'),
                ('54344', '2025-08-30 11:25:40', 'completed', 52.5, 42.0, 10.5, 0.0, 0.0, 'DKK', 'google', 'utm', 'test6@example.com', 'Porsa DK'),
                ('54346', '2025-08-30 21:00:28', 'completed', 596.0, 476.8, 119.2, 0.0, 0.0, 'DKK', 'google', 'utm', 'test7@example.com', 'Porsa DK'),
                ('54347', '2025-08-31 8:58:10', 'completed', 98.0, 78.4, 19.6, 0.0, 0.0, 'DKK', 'google', 'utm', 'test8@example.com', 'Porsa DK'),
                ('54350', '2025-08-31 18:10:25', 'completed', 657.0, 525.6, 131.4, 0.0, 0.0, 'DKK', 'google', 'utm', 'test9@example.com', 'Porsa DK'),
                ('54359', '2025-09-03 0:26:18', 'completed', 31.5, 25.2, 6.3, 0.0, 0.0, 'DKK', 'google', 'utm', 'test10@example.com', 'Porsa DK'),
                ('54366', '2025-09-03 14:50:15', 'completed', 186.75, 149.4, 37.35, 0.0, 0.0, 'DKK', 'google', 'utm', 'test11@example.com', 'Porsa DK'),
                ('54375', '2025-09-07 17:04:20', 'completed', 508.25, 406.6, 101.65, 0.0, 0.0, 'DKK', 'google', 'utm', 'test12@example.com', 'Porsa DK'),
                ('54376', '2025-09-07 17:36:53', 'completed', 143.25, 114.6, 28.65, 0.0, 0.0, 'DKK', 'google', 'utm', 'test13@example.com', 'Porsa DK'),
                ('54385', '2025-09-09 17:57:14', 'completed', 378.5, 302.8, 75.7, 0.0, 0.0, 'DKK', 'google', 'utm', 'test14@example.com', 'Porsa DK'),
                ('54386', '2025-09-09 21:08:28', 'completed', 96.0, 76.8, 19.2, 0.0, 0.0, 'DKK', 'google', 'utm', 'test15@example.com', 'Porsa DK'),
                ('54450', '2025-09-15 11:17:22', 'completed', 90.0, 72.0, 18.0, 0.0, 0.0, 'DKK', 'google', 'utm', 'test16@example.com', 'Porsa DK'),
                ('54462', '2025-09-17 9:10:55', 'completed', 92.5, 74.0, 18.5, 0.0, 0.0, 'DKK', 'google', 'utm', 'test17@example.com', 'Porsa DK'),
                ('54468', '2025-09-19 7:10:08', 'completed', 2503.0, 2002.4, 500.6, 0.0, 0.0, 'DKK', 'google', 'utm', 'test18@example.com', 'Porsa DK'),
                ('54472', '2025-09-19 13:14:14', 'completed', 65.5, 52.4, 13.1, 0.0, 0.0, 'DKK', 'google', 'utm', 'test19@example.com', 'Porsa DK'),
                ('54474', '2025-09-20 7:23:20', 'completed', 85.0, 68.0, 17.0, 0.0, 0.0, 'DKK', 'google', 'utm', 'test20@example.com', 'Porsa DK'),
                ('54476', '2025-09-21 21:03:51', 'completed', 160.0, 128.0, 32.0, 0.0, 0.0, 'DKK', 'google', 'utm', 'test21@example.com', 'Porsa DK'),
                ('54477', '2025-09-22 11:20:50', 'completed', 141.0, 112.8, 28.2, 0.0, 0.0, 'DKK', 'google', 'utm', 'test22@example.com', 'Porsa DK'),
                ('54479', '2025-09-22 13:27:29', 'completed', 1353.0, 1082.4, 270.6, 0.0, 0.0, 'DKK', 'google', 'utm', 'test23@example.com', 'Porsa DK'),
                ('54481', '2025-09-22 19:55:09', 'completed', 100.0, 80.0, 20.0, 0.0, 0.0, 'DKK', 'google', 'utm', 'test24@example.com', 'Porsa DK'),
                ('54482', '2025-09-22 20:56:27', 'completed', 112.5, 90.0, 22.5, 0.0, 0.0, 'DKK', 'google', 'utm', 'test25@example.com', 'Porsa DK'),
            ]
            
            cursor.execute("DELETE FROM woocommerce_orders;")
            for order in sample_orders:
                cursor.execute("""
                    INSERT INTO woocommerce_orders 
                    (order_id, order_date, status, order_total, order_subtotal, tax_total, 
                     shipping_total, discount_total, order_currency, attribution_utm_source, 
                     attribution_source_type, billing_email, client_name)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (client_name, order_id) DO NOTHING;
                """, order)
            
            print(f"✅ Created {len(sample_orders)} sample orders")
            
            # Verify the data
            cursor.execute("SELECT COUNT(*) FROM woocommerce_orders;")
            total_orders = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT COUNT(*) 
                FROM woocommerce_orders 
                WHERE attribution_utm_source = 'google' 
                AND attribution_source_type = 'utm';
            """)
            paid_search_orders = cursor.fetchone()[0]
            
            cursor.execute("""
                SELECT SUM(order_total) 
                FROM woocommerce_orders 
                WHERE attribution_utm_source = 'google' 
                AND attribution_source_type = 'utm';
            """)
            paid_search_revenue = cursor.fetchone()[0] or 0
            
            print(f"\\n📊 Verification:")
            print(f"Total orders: {total_orders}")
            print(f"Paid Search orders: {paid_search_orders}")
            print(f"Paid Search revenue: {paid_search_revenue:,.2f} DKK")
            
        conn.commit()
        conn.close()
        
        print("\\n✅ Database setup complete!")
        print("\\nYour app should now show Paid Search orders in the Channel Performance Report.")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    setup_database()
