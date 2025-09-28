#!/usr/bin/env python
"""
Compare WooCommerce CSV data against production database
"""
import os
import sys
import django
import csv
import json
from datetime import datetime, date
from decimal import Decimal
from collections import defaultdict

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.prod')
django.setup()

from django.db import connection
from woocommerce.models import WooCommerceOrder

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

def aggregate_csv_metrics(csv_data):
    """Aggregate metrics from CSV data"""
    print("📈 Aggregating CSV metrics...")
    
    # Overall totals
    totals = {
        'orders': 0,
        'order_total': Decimal('0'),
        'order_subtotal': Decimal('0'),
        'shipping_total': Decimal('0'),
        'shipping_tax_total': Decimal('0'),
        'tax_total': Decimal('0'),
        'discount_total': Decimal('0'),
        'fee_total': Decimal('0'),
        'fee_tax_total': Decimal('0')
    }
    
    # Status breakdown
    status_counts = defaultdict(int)
    
    # Daily breakdown
    daily_metrics = defaultdict(lambda: {
        'orders': 0,
        'order_total': Decimal('0'),
        'tax_total': Decimal('0'),
        'shipping_total': Decimal('0'),
        'discount_total': Decimal('0')
    })
    
    # Currency check
    currencies = set()
    
    for row in csv_data:
        # Basic counts
        totals['orders'] += 1
        status = row.get('status', '').strip()
        status_counts[status] += 1
        
        # Currency
        currency = row.get('order_currency', '').strip()
        if currency:
            currencies.add(currency)
        
        # Parse dates
        order_date_str = row.get('order_date', '').strip()
        if order_date_str:
            try:
                order_date = datetime.strptime(order_date_str, '%Y-%m-%d %H:%M:%S').date()
                day_key = order_date.isoformat()
                
                # Daily metrics
                daily_metrics[day_key]['orders'] += 1
            except ValueError:
                continue
        
        # Parse financial fields
        for field in ['order_total', 'order_subtotal', 'shipping_total', 'shipping_tax_total', 
                     'tax_total', 'discount_total', 'fee_total', 'fee_tax_total']:
            value = row.get(field, '').strip()
            if value:
                try:
                    decimal_val = Decimal(value)
                    totals[field] += decimal_val
                    if field in ['order_total', 'tax_total', 'shipping_total', 'discount_total'] and order_date_str:
                        daily_metrics[day_key][field] += decimal_val
                except (ValueError, TypeError):
                    pass
    
    return {
        'totals': totals,
        'status_counts': dict(status_counts),
        'daily_metrics': dict(daily_metrics),
        'currencies': list(currencies),
        'date_range': {
            'min': min(daily_metrics.keys()) if daily_metrics else None,
            'max': max(daily_metrics.keys()) if daily_metrics else None
        }
    }

def query_db_metrics():
    """Query database for same metrics"""
    print("🗄️ Querying database metrics...")
    
    # Overall totals
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                COUNT(*) as orders,
                SUM(order_total) as order_total,
                SUM(order_subtotal) as order_subtotal,
                SUM(shipping_total) as shipping_total,
                SUM(shipping_tax_total) as shipping_tax_total,
                SUM(tax_total) as tax_total,
                SUM(discount_total) as discount_total,
                SUM(fee_total) as fee_total,
                SUM(fee_tax_total) as fee_tax_total
            FROM woocommerce_orders
        """)
        row = cursor.fetchone()
        
        totals = {
            'orders': row[0] or 0,
            'order_total': Decimal(str(row[1] or 0)),
            'order_subtotal': Decimal(str(row[2] or 0)),
            'shipping_total': Decimal(str(row[3] or 0)),
            'shipping_tax_total': Decimal(str(row[4] or 0)),
            'tax_total': Decimal(str(row[5] or 0)),
            'discount_total': Decimal(str(row[6] or 0)),
            'fee_total': Decimal(str(row[7] or 0)),
            'fee_tax_total': Decimal(str(row[8] or 0))
        }
    
    # Status breakdown
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT status, COUNT(*) 
            FROM woocommerce_orders 
            GROUP BY status
            ORDER BY COUNT(*) DESC
        """)
        status_counts = dict(cursor.fetchall())
    
    # Daily breakdown
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 
                DATE(order_date) as order_day,
                COUNT(*) as orders,
                SUM(order_total) as order_total,
                SUM(tax_total) as tax_total,
                SUM(shipping_total) as shipping_total,
                SUM(discount_total) as discount_total
            FROM woocommerce_orders
            GROUP BY DATE(order_date)
            ORDER BY order_day
        """)
        
        daily_metrics = {}
        for row in cursor.fetchall():
            day_key = row[0].isoformat()
            daily_metrics[day_key] = {
                'orders': row[1] or 0,
                'order_total': Decimal(str(row[2] or 0)),
                'tax_total': Decimal(str(row[3] or 0)),
                'shipping_total': Decimal(str(row[4] or 0)),
                'discount_total': Decimal(str(row[5] or 0))
            }
    
    # Date range
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT MIN(DATE(order_date)), MAX(DATE(order_date))
            FROM woocommerce_orders
        """)
        row = cursor.fetchone()
        date_range = {
            'min': row[0].isoformat() if row[0] else None,
            'max': row[1].isoformat() if row[1] else None
        }
    
    # Currency check
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT order_currency 
            FROM woocommerce_orders 
            WHERE order_currency IS NOT NULL
        """)
        currencies = [row[0] for row in cursor.fetchall()]
    
    return {
        'totals': totals,
        'status_counts': status_counts,
        'daily_metrics': daily_metrics,
        'currencies': currencies,
        'date_range': date_range
    }

def compare_metrics(csv_metrics, db_metrics):
    """Compare CSV and database metrics"""
    print("🔍 Comparing metrics...")
    
    discrepancies = []
    
    # Compare totals
    print("\n📊 OVERALL TOTALS COMPARISON")
    print("-" * 50)
    
    for field in ['orders', 'order_total', 'order_subtotal', 'shipping_total', 
                  'shipping_tax_total', 'tax_total', 'discount_total', 'fee_total', 'fee_tax_total']:
        csv_val = csv_metrics['totals'][field]
        db_val = db_metrics['totals'][field]
        
        if isinstance(csv_val, Decimal) and isinstance(db_val, Decimal):
            diff = csv_val - db_val
            diff_pct = (diff / db_val * 100) if db_val != 0 else 0
        else:
            diff = csv_val - db_val
            diff_pct = (diff / db_val * 100) if db_val != 0 else 0
        
        status = "✅" if abs(diff) < 0.01 else "❌"
        print(f"{status} {field:20}: CSV={csv_val:>12} | DB={db_val:>12} | Diff={diff:>12} ({diff_pct:+.2f}%)")
        
        if abs(diff) > 0.01:
            discrepancies.append({
                'type': 'total',
                'field': field,
                'csv_value': str(csv_val),
                'db_value': str(db_val),
                'difference': str(diff),
                'difference_pct': diff_pct
            })
    
    # Compare status counts
    print("\n📋 STATUS BREAKDOWN COMPARISON")
    print("-" * 50)
    
    all_statuses = set(csv_metrics['status_counts'].keys()) | set(db_metrics['status_counts'].keys())
    for status in sorted(all_statuses):
        csv_count = csv_metrics['status_counts'].get(status, 0)
        db_count = db_metrics['status_counts'].get(status, 0)
        diff = csv_count - db_count
        
        status_icon = "✅" if diff == 0 else "❌"
        print(f"{status_icon} {status:15}: CSV={csv_count:>6} | DB={db_count:>6} | Diff={diff:>6}")
        
        if diff != 0:
            discrepancies.append({
                'type': 'status',
                'status': status,
                'csv_count': csv_count,
                'db_count': db_count,
                'difference': diff
            })
    
    # Compare date ranges
    print("\n📅 DATE RANGE COMPARISON")
    print("-" * 50)
    
    csv_min = csv_metrics['date_range']['min']
    csv_max = csv_metrics['date_range']['max']
    db_min = db_metrics['date_range']['min']
    db_max = db_metrics['date_range']['max']
    
    print(f"CSV Date Range: {csv_min} to {csv_max}")
    print(f"DB Date Range:  {db_min} to {db_max}")
    
    if csv_min != db_min or csv_max != db_max:
        discrepancies.append({
            'type': 'date_range',
            'csv_range': f"{csv_min} to {csv_max}",
            'db_range': f"{db_min} to {db_max}"
        })
    
    # Compare currencies
    print("\n💰 CURRENCY COMPARISON")
    print("-" * 50)
    
    csv_currencies = set(csv_metrics['currencies'])
    db_currencies = set(db_metrics['currencies'])
    
    print(f"CSV Currencies: {sorted(csv_currencies)}")
    print(f"DB Currencies:  {sorted(db_currencies)}")
    
    if csv_currencies != db_currencies:
        discrepancies.append({
            'type': 'currency',
            'csv_currencies': sorted(csv_currencies),
            'db_currencies': sorted(db_currencies)
        })
    
    return discrepancies

def main():
    """Main comparison function"""
    print("🔍 WOOCOMMERCE CSV vs DATABASE COMPARISON")
    print("=" * 60)
    
    # Load CSV data
    csv_path = "/Users/iversen/Work/veveve/vvv-frontpage/porsa - woocommerce report - v1.1 - woocom data  - clean.csv"
    csv_data = load_csv_data(csv_path)
    
    # Aggregate CSV metrics
    csv_metrics = aggregate_csv_metrics(csv_data)
    
    # Query database metrics
    db_metrics = query_db_metrics()
    
    # Compare metrics
    discrepancies = compare_metrics(csv_metrics, db_metrics)
    
    # Summary
    print("\n" + "=" * 60)
    print("📋 SUMMARY")
    print("=" * 60)
    
    if discrepancies:
        print(f"❌ Found {len(discrepancies)} discrepancies:")
        for i, disc in enumerate(discrepancies, 1):
            print(f"  {i}. {disc['type']}: {disc}")
    else:
        print("✅ No discrepancies found! CSV and database data match.")
    
    # Save detailed report
    report = {
        'timestamp': datetime.now().isoformat(),
        'csv_metrics': {k: str(v) if isinstance(v, Decimal) else v for k, v in csv_metrics.items()},
        'db_metrics': {k: str(v) if isinstance(v, Decimal) else v for k, v in db_metrics.items()},
        'discrepancies': discrepancies
    }
    
    with open('woocommerce_comparison_report.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n📄 Detailed report saved to: woocommerce_comparison_report.json")

if __name__ == "__main__":
    main()
