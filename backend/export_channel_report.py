#!/usr/bin/env python
"""
Export Channel Performance Report to CSV for comparison with Google Sheets
"""
import csv
import psycopg2
from datetime import datetime, timedelta
from decimal import Decimal

def export_channel_report():
    """Export channel performance data to CSV"""
    print("📊 Exporting Channel Performance Report...")
    
    try:
        conn = psycopg2.connect(
            host='localhost',
            port='5432',
            database='vvv_database',
            user='vvv_user',
            password='vvv_password'
        )
        
        with conn.cursor() as cursor:
            # Get channel performance data (last 30 days)
            cursor.execute("""
                WITH channel_metrics AS (
                    SELECT 
                        CASE 
                            WHEN attribution_utm_source = 'google' AND attribution_source_type = 'utm' THEN 'Paid Search'
                            WHEN attribution_utm_source = 'google' AND attribution_source_type = 'organic' THEN 'SEO'
                            WHEN attribution_utm_source = '(direct)' AND attribution_source_type = 'typein' THEN 'Direct'
                            WHEN attribution_utm_source = 'bing.com' AND attribution_source_type = 'referral' THEN 'Bing'
                            WHEN attribution_utm_source = 'trustpilot' AND attribution_source_type = 'utm' THEN 'Referal'
                            WHEN attribution_utm_source = 'chatgpt.com' AND attribution_source_type = 'utm' THEN 'ChatGpt'
                            WHEN attribution_utm_source = 'duckduckgo.com' AND attribution_source_type = 'referral' THEN 'SEO'
                            WHEN attribution_utm_source = 'dk.search.yahoo.com' AND attribution_source_type = 'referral' THEN 'Referral'
                            ELSE 'Other'
                        END as channel_type,
                        attribution_utm_source as source,
                        attribution_source_type as medium,
                        COUNT(*) as orders,
                        SUM(order_total) as total_revenue,
                        AVG(order_total) as avg_order_value,
                        COUNT(DISTINCT billing_email) as unique_customers
                    FROM woocommerce_orders 
                    WHERE order_date >= NOW() - INTERVAL '30 days'
                    GROUP BY 
                        CASE 
                            WHEN attribution_utm_source = 'google' AND attribution_source_type = 'utm' THEN 'Paid Search'
                            WHEN attribution_utm_source = 'google' AND attribution_source_type = 'organic' THEN 'SEO'
                            WHEN attribution_utm_source = '(direct)' AND attribution_source_type = 'typein' THEN 'Direct'
                            WHEN attribution_utm_source = 'bing.com' AND attribution_source_type = 'referral' THEN 'Bing'
                            WHEN attribution_utm_source = 'trustpilot' AND attribution_source_type = 'utm' THEN 'Referal'
                            WHEN attribution_utm_source = 'chatgpt.com' AND attribution_source_type = 'utm' THEN 'ChatGpt'
                            WHEN attribution_utm_source = 'duckduckgo.com' AND attribution_source_type = 'referral' THEN 'SEO'
                            WHEN attribution_utm_source = 'dk.search.yahoo.com' AND attribution_source_type = 'referral' THEN 'Referral'
                            ELSE 'Other'
                        END,
                        attribution_utm_source,
                        attribution_source_type
                )
                SELECT 
                    channel_type,
                    source,
                    medium,
                    CONCAT(source, '/', medium) as source_medium,
                    orders,
                    total_revenue,
                    avg_order_value,
                    unique_customers,
                    ROUND((orders::DECIMAL / SUM(orders) OVER()) * 100, 2) as orders_percentage,
                    ROUND((total_revenue / SUM(total_revenue) OVER()) * 100, 2) as revenue_percentage
                FROM channel_metrics
                ORDER BY total_revenue DESC;
            """)
            
            results = cursor.fetchall()
            
            # Get total metrics
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(order_total) as total_revenue,
                    AVG(order_total) as avg_order_value,
                    COUNT(DISTINCT billing_email) as total_customers
                FROM woocommerce_orders 
                WHERE order_date >= NOW() - INTERVAL '30 days';
            """)
            
            totals = cursor.fetchone()
            
            # Export to CSV
            filename = f"channel_performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Write header
                writer.writerow([
                    'Channel Type',
                    'Source',
                    'Medium', 
                    'Source/Medium',
                    'Orders',
                    'Total Revenue (DKK)',
                    'Avg Order Value (DKK)',
                    'Unique Customers',
                    'Orders %',
                    'Revenue %'
                ])
                
                # Write data rows
                for row in results:
                    writer.writerow([
                        row[0],  # channel_type
                        row[1],  # source
                        row[2],  # medium
                        row[3],  # source_medium
                        row[4],  # orders
                        f"{row[5]:,.2f}",  # total_revenue
                        f"{row[6]:,.2f}",  # avg_order_value
                        row[7],  # unique_customers
                        f"{row[8]}%",  # orders_percentage
                        f"{row[9]}%"   # revenue_percentage
                    ])
                
                # Write totals row
                writer.writerow([
                    'TOTAL',
                    '',
                    '',
                    '',
                    totals[0],  # total_orders
                    f"{totals[1]:,.2f}",  # total_revenue
                    f"{totals[2]:,.2f}",  # avg_order_value
                    totals[3],  # total_customers
                    '100%',
                    '100%'
                ])
            
            print(f"✅ Channel Performance Report exported to: {filename}")
            print(f"📊 Report Summary:")
            print(f"   Total Orders: {totals[0]}")
            print(f"   Total Revenue: {totals[1]:,.2f} DKK")
            print(f"   Avg Order Value: {totals[2]:,.2f} DKK")
            print(f"   Unique Customers: {totals[3]}")
            print(f"   Channels: {len(results)}")
            
            # Show channel breakdown
            print(f"\n📈 Channel Breakdown:")
            for row in results:
                print(f"   {row[0]:15}: {row[4]:>3} orders, {row[5]:>8,.0f} DKK ({row[9]:>5}%)")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        import traceback
        traceback.print_exc()

def export_detailed_orders():
    """Export detailed order data for analysis"""
    print("\n📋 Exporting detailed order data...")
    
    try:
        conn = psycopg2.connect(
            host='localhost',
            port='5432',
            database='vvv_database',
            user='vvv_user',
            password='vvv_password'
        )
        
        with conn.cursor() as cursor:
            # Get detailed order data
            cursor.execute("""
                SELECT 
                    order_id,
                    order_date,
                    status,
                    order_total,
                    order_subtotal,
                    tax_total,
                    shipping_total,
                    discount_total,
                    order_currency,
                    attribution_utm_source,
                    attribution_source_type,
                    attribution_referrer,
                    billing_email,
                    CASE 
                        WHEN attribution_utm_source = 'google' AND attribution_source_type = 'utm' THEN 'Paid Search'
                        WHEN attribution_utm_source = 'google' AND attribution_source_type = 'organic' THEN 'SEO'
                        WHEN attribution_utm_source = '(direct)' AND attribution_source_type = 'typein' THEN 'Direct'
                        WHEN attribution_utm_source = 'bing.com' AND attribution_source_type = 'referral' THEN 'Bing'
                        WHEN attribution_utm_source = 'trustpilot' AND attribution_source_type = 'utm' THEN 'Referal'
                        WHEN attribution_utm_source = 'chatgpt.com' AND attribution_source_type = 'utm' THEN 'ChatGpt'
                        WHEN attribution_utm_source = 'duckduckgo.com' AND attribution_source_type = 'referral' THEN 'SEO'
                        WHEN attribution_utm_source = 'dk.search.yahoo.com' AND attribution_source_type = 'referral' THEN 'Referral'
                        ELSE 'Other'
                    END as channel_type
                FROM woocommerce_orders 
                WHERE order_date >= NOW() - INTERVAL '30 days'
                ORDER BY order_date DESC;
            """)
            
            results = cursor.fetchall()
            
            # Export to CSV
            filename = f"detailed_orders_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                writer = csv.writer(csvfile)
                
                # Write header
                writer.writerow([
                    'Order ID',
                    'Order Date',
                    'Status',
                    'Order Total (DKK)',
                    'Order Subtotal (DKK)',
                    'Tax Total (DKK)',
                    'Shipping Total (DKK)',
                    'Discount Total (DKK)',
                    'Currency',
                    'UTM Source',
                    'Source Type',
                    'Referrer',
                    'Customer Email',
                    'Channel Type'
                ])
                
                # Write data rows
                for row in results:
                    writer.writerow([
                        row[0],  # order_id
                        row[1],  # order_date
                        row[2],  # status
                        f"{row[3]:,.2f}",  # order_total
                        f"{row[4]:,.2f}",  # order_subtotal
                        f"{row[5]:,.2f}",  # tax_total
                        f"{row[6]:,.2f}",  # shipping_total
                        f"{row[7]:,.2f}",  # discount_total
                        row[8],  # order_currency
                        row[9],  # attribution_utm_source
                        row[10], # attribution_source_type
                        row[11], # attribution_referrer
                        row[12], # billing_email
                        row[13]  # channel_type
                    ])
            
            print(f"✅ Detailed orders exported to: {filename}")
            print(f"📋 Total orders exported: {len(results)}")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Detailed export failed: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main export function"""
    print("🚀 EXPORTING CHANNEL PERFORMANCE DATA")
    print("=" * 60)
    
    export_channel_report()
    export_detailed_orders()
    
    print("\n✅ Export complete!")
    print("\n📁 Files created:")
    print("   - channel_performance_report_YYYYMMDD_HHMMSS.csv (Channel summary)")
    print("   - detailed_orders_YYYYMMDD_HHMMSS.csv (Individual orders)")
    print("\n🔍 You can now compare these with your Google Sheets report!")

if __name__ == "__main__":
    main()
