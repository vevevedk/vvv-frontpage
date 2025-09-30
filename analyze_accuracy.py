#!/usr/bin/env python3
"""
Analyze WooCommerce report accuracy by comparing Google Sheets data with app data.
"""

import pandas as pd
import sys
from datetime import datetime
from collections import defaultdict

def load_csv_data(filename):
    """Load and parse the CSV data."""
    try:
        df = pd.read_csv(filename)
        print(f"Loaded {len(df)} orders from CSV")
        return df
    except Exception as e:
        print(f"Error loading CSV: {e}")
        return None

def filter_date_range(df, start_date, end_date):
    """Filter orders by date range."""
    df['order_date'] = pd.to_datetime(df['order_date'])
    filtered = df[(df['order_date'] >= start_date) & (df['order_date'] < end_date)]
    print(f"Filtered to {len(filtered)} orders in date range {start_date} to {end_date}")
    return filtered

def analyze_orders(df):
    """Analyze orders by channel type."""
    # Group by ChannelType
    channel_analysis = df.groupby('ChannelType').agg({
        'order_id': 'count',
        'order_total': 'sum',
        'order_total': 'mean'
    }).round(2)
    
    channel_analysis.columns = ['Orders', 'Total_Revenue', 'Avg_Order_Value']
    channel_analysis = channel_analysis.sort_values('Total_Revenue', ascending=False)
    
    return channel_analysis

def analyze_source_medium(df):
    """Analyze by source/medium combinations."""
    source_analysis = df.groupby(['Source/Medium', 'ChannelType']).agg({
        'order_id': 'count',
        'order_total': 'sum'
    }).round(2)
    
    source_analysis.columns = ['Orders', 'Revenue']
    source_analysis = source_analysis.sort_values('Revenue', ascending=False)
    
    return source_analysis

def find_paid_search_orders(df):
    """Find orders that should be classified as Paid Search."""
    paid_search_patterns = [
        'google/utm', 'google/cpc', 'bing/cpc', 'facebook/utm', 'facebook/cpc',
        'googleads', 'doubleclick', 'bingads', 'facebook.com/tr'
    ]
    
    paid_search_orders = []
    for _, row in df.iterrows():
        source_medium = str(row['Source/Medium']).lower()
        utm_source = str(row.get('meta:_wc_order_attribution_utm_source', '')).lower()
        
        for pattern in paid_search_patterns:
            if pattern in source_medium or pattern in utm_source:
                paid_search_orders.append({
                    'order_id': row['order_id'],
                    'source_medium': row['Source/Medium'],
                    'utm_source': row.get('meta:_wc_order_attribution_utm_source', ''),
                    'total': row['order_total'],
                    'current_channel': row['ChannelType']
                })
                break
    
    return paid_search_orders

def main():
    filename = "porsa - woocommerce report - v1.1 - woocom data  - clean.csv"
    
    # Load data
    df = load_csv_data(filename)
    if df is None:
        return
    
    # Filter to the specific date range from your report (2025-08-24 to 2025-09-23)
    start_date = '2025-08-24'
    end_date = '2025-09-24'
    
    filtered_df = filter_date_range(df, start_date, end_date)
    
    print("\n" + "="*80)
    print("ACCURACY ANALYSIS REPORT")
    print("="*80)
    
    # Overall totals
    total_orders = len(filtered_df)
    total_revenue = filtered_df['order_total'].sum()
    
    print(f"\nOVERALL TOTALS (Google Sheets):")
    print(f"Total Orders: {total_orders}")
    print(f"Total Revenue: {total_revenue:,.2f} DKK")
    
    # Channel analysis
    print(f"\nCHANNEL BREAKDOWN:")
    channel_analysis = analyze_orders(filtered_df)
    print(channel_analysis)
    
    # Find potential Paid Search orders
    print(f"\nPOTENTIAL PAID SEARCH ORDERS:")
    paid_search_orders = find_paid_search_orders(filtered_df)
    
    if paid_search_orders:
        print(f"Found {len(paid_search_orders)} orders that might be Paid Search:")
        for order in paid_search_orders[:10]:  # Show first 10
            print(f"  Order {order['order_id']}: {order['source_medium']} | UTM: {order['utm_source']} | Total: {order['total']} | Current: {order['current_channel']}")
        
        paid_search_revenue = sum(order['total'] for order in paid_search_orders)
        print(f"\nTotal potential Paid Search revenue: {paid_search_revenue:,.2f} DKK")
    else:
        print("No obvious Paid Search orders found in current classification")
    
    # Source/Medium analysis
    print(f"\nTOP SOURCE/MEDIUM COMBINATIONS:")
    source_analysis = analyze_source_medium(filtered_df)
    print(source_analysis.head(15))
    
    # Compare with your reported totals
    print(f"\nCOMPARISON WITH YOUR REPORT:")
    print(f"Google Sheets Total Orders: {total_orders}")
    print(f"Google Sheets Total Revenue: {total_revenue:,.2f} DKK")
    print(f"App Report Total Orders: 81 (from your screenshot)")
    print(f"App Report Total Revenue: 78,743 DKK (from your screenshot)")
    
    order_diff = total_orders - 81
    revenue_diff = total_revenue - 78743
    
    print(f"\nDIFFERENCES:")
    print(f"Orders difference: {order_diff} ({order_diff/81*100:.1f}%)")
    print(f"Revenue difference: {revenue_diff:,.2f} DKK ({revenue_diff/78743*100:.1f}%)")
    
    if paid_search_orders:
        print(f"\nIf {len(paid_search_orders)} orders were classified as Paid Search:")
        print(f"  Orders would match: {total_orders - len(paid_search_orders)} + {len(paid_search_orders)} = {total_orders}")
        print(f"  Revenue would be: {total_revenue - paid_search_revenue:,.2f} + {paid_search_revenue:,.2f} = {total_revenue:,.2f}")

if __name__ == "__main__":
    main()


