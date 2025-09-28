#!/usr/bin/env python
"""
Comprehensive WooCommerce CSV Analysis Report
"""
import csv
import json
import decimal
from datetime import datetime, date, timedelta
from decimal import Decimal
from collections import defaultdict, Counter
import statistics

def load_csv_data(csv_path):
    """Load and parse CSV data"""
    print(f"📊 Loading CSV data from: {csv_path}")
    
    csv_data = []
    with open(csv_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_data.append(row)
    
    print(f"✅ Loaded {len(csv_data)} rows from CSV")
    return csv_data

def analyze_orders(csv_data):
    """Comprehensive order analysis"""
    print("\n🔍 COMPREHENSIVE ORDER ANALYSIS")
    print("=" * 60)
    
    # Basic metrics
    total_orders = len(csv_data)
    
    # Date analysis
    order_dates = []
    paid_dates = []
    
    for row in csv_data:
        if row.get('order_date'):
            try:
                order_dates.append(datetime.strptime(row['order_date'], '%Y-%m-%d %H:%M:%S'))
            except ValueError:
                pass
        
        if row.get('paid_date'):
            try:
                paid_dates.append(datetime.strptime(row['paid_date'], '%Y-%m-%d %H:%M:%S'))
            except ValueError:
                pass
    
    date_range = {
        'order_start': min(order_dates) if order_dates else None,
        'order_end': max(order_dates) if order_dates else None,
        'paid_start': min(paid_dates) if paid_dates else None,
        'paid_end': max(paid_dates) if paid_dates else None
    }
    
    print(f"📅 Date Range:")
    print(f"  Order Dates: {date_range['order_start']} to {date_range['order_end']}")
    print(f"  Paid Dates:  {date_range['paid_start']} to {date_range['paid_end']}")
    
    # Financial analysis
    financial_totals = {
        'order_total': Decimal('0'),
        'order_subtotal': Decimal('0'),
        'shipping_total': Decimal('0'),
        'shipping_tax_total': Decimal('0'),
        'tax_total': Decimal('0'),
        'discount_total': Decimal('0'),
        'fee_total': Decimal('0'),
        'fee_tax_total': Decimal('0')
    }
    
    order_values = []
    
    for row in csv_data:
        for field in financial_totals:
            value = row.get(field, '').strip()
            if value:
                try:
                    decimal_val = Decimal(value)
                    financial_totals[field] += decimal_val
                except (ValueError, TypeError):
                    pass
        
        # Collect order values for statistics
        order_total = row.get('order_total', '').strip()
        if order_total:
            try:
                order_values.append(Decimal(order_total))
            except (ValueError, TypeError):
                pass
    
    print(f"\n💰 Financial Summary:")
    for field, total in financial_totals.items():
        print(f"  {field.replace('_', ' ').title()}: {total:,.2f} DKK")
    
    # Order value statistics
    if order_values:
        order_values.sort()
        print(f"\n📊 Order Value Statistics:")
        print(f"  Average Order Value: {statistics.mean(order_values):,.2f} DKK")
        print(f"  Median Order Value:  {statistics.median(order_values):,.2f} DKK")
        print(f"  Min Order Value:     {min(order_values):,.2f} DKK")
        print(f"  Max Order Value:     {max(order_values):,.2f} DKK")
        print(f"  Total Revenue:       {sum(order_values):,.2f} DKK")
    
    return {
        'total_orders': total_orders,
        'date_range': date_range,
        'financial_totals': financial_totals,
        'order_values': order_values
    }

def analyze_status_breakdown(csv_data):
    """Analyze order status distribution"""
    print(f"\n📋 ORDER STATUS BREAKDOWN")
    print("=" * 60)
    
    status_counts = Counter()
    status_revenue = defaultdict(Decimal)
    
    for row in csv_data:
        status = row.get('status', '').strip()
        status_counts[status] += 1
        
        order_total = row.get('order_total', '').strip()
        if order_total:
            try:
                status_revenue[status] += Decimal(order_total)
            except (ValueError, TypeError):
                pass
    
    print("Status Distribution:")
    for status, count in status_counts.most_common():
        percentage = (count / len(csv_data)) * 100
        revenue = status_revenue[status]
        print(f"  {status:15}: {count:>6} orders ({percentage:5.1f}%) - {revenue:>12,.2f} DKK")
    
    return dict(status_counts), dict(status_revenue)

def analyze_daily_trends(csv_data):
    """Analyze daily order trends"""
    print(f"\n📈 DAILY TRENDS ANALYSIS")
    print("=" * 60)
    
    daily_metrics = defaultdict(lambda: {
        'orders': 0,
        'revenue': Decimal('0'),
        'tax': Decimal('0'),
        'shipping': Decimal('0')
    })
    
    for row in csv_data:
        order_date_str = row.get('order_date', '').strip()
        if order_date_str:
            try:
                order_date = datetime.strptime(order_date_str, '%Y-%m-%d %H:%M:%S').date()
                day_key = order_date.isoformat()
                
                daily_metrics[day_key]['orders'] += 1
                
                for field in ['order_total', 'tax_total', 'shipping_total']:
                    value = row.get(field, '').strip()
                    if value:
                        try:
                            field_key = field.replace('_total', '')
                            if field_key == 'order':
                                field_key = 'revenue'
                            daily_metrics[day_key][field_key] += Decimal(value)
                        except (ValueError, TypeError):
                            pass
            except ValueError:
                pass
    
    # Sort by date
    sorted_days = sorted(daily_metrics.keys())
    
    print("Recent 10 days:")
    for day in sorted_days[-10:]:
        metrics = daily_metrics[day]
        print(f"  {day}: {metrics['orders']:>3} orders, {metrics['revenue']:>8,.0f} DKK revenue")
    
    # Monthly aggregation
    monthly_metrics = defaultdict(lambda: {
        'orders': 0,
        'revenue': Decimal('0')
    })
    
    for day, metrics in daily_metrics.items():
        month_key = day[:7]  # YYYY-MM
        monthly_metrics[month_key]['orders'] += metrics['orders']
        monthly_metrics[month_key]['revenue'] += metrics['revenue']
    
    print(f"\nMonthly Summary:")
    for month in sorted(monthly_metrics.keys()):
        metrics = monthly_metrics[month]
        print(f"  {month}: {metrics['orders']:>4} orders, {metrics['revenue']:>10,.0f} DKK revenue")
    
    return daily_metrics, monthly_metrics

def analyze_customers(csv_data):
    """Analyze customer patterns"""
    print(f"\n👥 CUSTOMER ANALYSIS")
    print("=" * 60)
    
    customer_orders = defaultdict(int)
    customer_revenue = defaultdict(Decimal)
    customer_emails = set()
    
    for row in csv_data:
        customer_email = row.get('customer_email', '').strip()
        if customer_email:
            customer_emails.add(customer_email)
            customer_orders[customer_email] += 1
            
            order_total = row.get('order_total', '').strip()
            if order_total:
                try:
                    customer_revenue[customer_email] += Decimal(order_total)
                except (ValueError, TypeError):
                    pass
    
    unique_customers = len(customer_emails)
    repeat_customers = sum(1 for count in customer_orders.values() if count > 1)
    
    print(f"Total Unique Customers: {unique_customers:,}")
    print(f"Repeat Customers: {repeat_customers:,} ({(repeat_customers/unique_customers*100):.1f}%)")
    new_customers = unique_customers - repeat_customers
    new_customer_rate = (new_customers / unique_customers * 100) if unique_customers > 0 else 0
    print(f"New Customers: {new_customers:,} ({new_customer_rate:.1f}%)")
    
    # Top customers by revenue
    top_customers = sorted(customer_revenue.items(), key=lambda x: x[1], reverse=True)[:10]
    print(f"\nTop 10 Customers by Revenue:")
    for i, (email, revenue) in enumerate(top_customers, 1):
        orders = customer_orders[email]
        print(f"  {i:2}. {email[:30]:<30} - {orders:>2} orders - {revenue:>8,.0f} DKK")
    
    return {
        'unique_customers': unique_customers,
        'repeat_customers': repeat_customers,
        'customer_orders': dict(customer_orders),
        'customer_revenue': dict(customer_revenue)
    }

def analyze_products(csv_data):
    """Analyze product performance"""
    print(f"\n🛍️ PRODUCT ANALYSIS")
    print("=" * 60)
    
    product_sales = defaultdict(lambda: {
        'quantity': 0,
        'revenue': Decimal('0'),
        'orders': set()
    })
    
    for row in csv_data:
        order_id = row.get('order_id', '')
        
        # Check all product item columns
        for i in range(1, 7):  # Product Item 1-6
            product_name = row.get(f'Product Item {i} Name', '').strip()
            product_sku = row.get(f'Product Item {i} SKU', '').strip()
            quantity_str = row.get(f'Product Item {i} Quantity', '').strip()
            total_str = row.get(f'Product Item {i} Total', '').strip()
            
            if product_name and quantity_str and total_str:
                try:
                    quantity = int(quantity_str)
                    # Clean the total string - remove any non-numeric characters except decimal point
                    clean_total = ''.join(c for c in total_str if c.isdigit() or c == '.')
                    if clean_total:
                        total = Decimal(clean_total)
                        
                        product_key = f"{product_name} ({product_sku})" if product_sku else product_name
                        product_sales[product_key]['quantity'] += quantity
                        product_sales[product_key]['revenue'] += total
                        product_sales[product_key]['orders'].add(order_id)
                except (ValueError, TypeError, decimal.InvalidOperation):
                    pass
    
    # Convert orders sets to counts
    for product_data in product_sales.values():
        product_data['order_count'] = len(product_data['orders'])
        del product_data['orders']
    
    # Sort by revenue
    top_products = sorted(product_sales.items(), key=lambda x: x[1]['revenue'], reverse=True)[:20]
    
    print("Top 20 Products by Revenue:")
    for i, (product, data) in enumerate(top_products, 1):
        print(f"  {i:2}. {product[:50]:<50} - {data['quantity']:>4} units - {data['revenue']:>8,.0f} DKK - {data['order_count']:>3} orders")
    
    return dict(product_sales)

def analyze_channels(csv_data):
    """Analyze traffic channels"""
    print(f"\n📊 CHANNEL ANALYSIS")
    print("=" * 60)
    
    channel_orders = defaultdict(int)
    channel_revenue = defaultdict(Decimal)
    
    for row in csv_data:
        channel = row.get('Channel', '').strip()
        channel_type = row.get('ChannelType', '').strip()
        
        if channel:
            channel_key = f"{channel} ({channel_type})" if channel_type else channel
            channel_orders[channel_key] += 1
            
            order_total = row.get('order_total', '').strip()
            if order_total:
                try:
                    channel_revenue[channel_key] += Decimal(order_total)
                except (ValueError, TypeError):
                    pass
    
    print("Channel Performance:")
    for channel, orders in sorted(channel_orders.items(), key=lambda x: x[1], reverse=True):
        revenue = channel_revenue[channel]
        print(f"  {channel:30} - {orders:>4} orders - {revenue:>10,.0f} DKK")
    
    return dict(channel_orders), dict(channel_revenue)

def generate_summary_report(analysis_results):
    """Generate executive summary"""
    print(f"\n📋 EXECUTIVE SUMMARY")
    print("=" * 60)
    
    orders = analysis_results['orders']
    customers = analysis_results['customers']
    
    print(f"📊 Key Metrics:")
    print(f"  Total Orders: {orders['total_orders']:,}")
    print(f"  Total Revenue: {orders['financial_totals']['order_total']:,.2f} DKK")
    print(f"  Unique Customers: {customers['unique_customers']:,}")
    print(f"  Average Order Value: {statistics.mean(orders['order_values']):,.2f} DKK")
    print(f"  Repeat Customer Rate: {(customers['repeat_customers']/customers['unique_customers']*100):.1f}%")
    
    print(f"\n📅 Time Period:")
    date_range = orders['date_range']
    print(f"  Order Period: {date_range['order_start'].strftime('%Y-%m-%d')} to {date_range['order_end'].strftime('%Y-%m-%d')}")
    
    print(f"\n💰 Financial Breakdown:")
    financial = orders['financial_totals']
    print(f"  Gross Revenue: {financial['order_subtotal']:,.2f} DKK")
    print(f"  Tax Collected: {financial['tax_total']:,.2f} DKK")
    print(f"  Shipping Revenue: {financial['shipping_total']:,.2f} DKK")
    print(f"  Discounts Given: {financial['discount_total']:,.2f} DKK")

def main():
    """Main analysis function"""
    print("🔍 COMPREHENSIVE WOOCOMMERCE CSV ANALYSIS")
    print("=" * 80)
    
    # Load data
    csv_path = "/Users/iversen/Work/veveve/vvv-frontpage/porsa - woocommerce report - v1.1 - woocom data  - clean.csv"
    csv_data = load_csv_data(csv_path)
    
    # Run analyses
    analysis_results = {}
    
    analysis_results['orders'] = analyze_orders(csv_data)
    analysis_results['status'] = analyze_status_breakdown(csv_data)
    analysis_results['daily'], analysis_results['monthly'] = analyze_daily_trends(csv_data)
    analysis_results['customers'] = analyze_customers(csv_data)
    analysis_results['products'] = analyze_products(csv_data)
    analysis_results['channels'] = analyze_channels(csv_data)
    
    # Generate summary
    generate_summary_report(analysis_results)
    
    # Save detailed report
    report = {
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'total_orders': analysis_results['orders']['total_orders'],
            'total_revenue': str(analysis_results['orders']['financial_totals']['order_total']),
            'unique_customers': analysis_results['customers']['unique_customers'],
            'date_range': {
                'start': analysis_results['orders']['date_range']['order_start'].isoformat() if analysis_results['orders']['date_range']['order_start'] else None,
                'end': analysis_results['orders']['date_range']['order_end'].isoformat() if analysis_results['orders']['date_range']['order_end'] else None
            }
        },
        'financial_totals': {k: str(v) for k, v in analysis_results['orders']['financial_totals'].items()},
        'status_breakdown': analysis_results['status'][0],
        'status_revenue': {k: str(v) for k, v in analysis_results['status'][1].items()},
        'monthly_summary': {k: {'orders': v['orders'], 'revenue': str(v['revenue'])} for k, v in analysis_results['monthly'].items()},
        'customer_metrics': {
            'unique_customers': analysis_results['customers']['unique_customers'],
            'repeat_customers': analysis_results['customers']['repeat_customers'],
            'repeat_rate': analysis_results['customers']['repeat_customers'] / analysis_results['customers']['unique_customers'] * 100
        }
    }
    
    with open('woocommerce_comprehensive_analysis.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n📄 Detailed report saved to: woocommerce_comprehensive_analysis.json")
    print(f"\n✅ Analysis complete! You now have a comprehensive breakdown of your WooCommerce data.")

if __name__ == "__main__":
    main()
