#!/usr/bin/env python
"""
Audit WooCommerce Analytics - Check channel classification and attribution

This script:
1. Lists all channel classification rules in the database
2. Checks sample orders to see if attribution data is captured
3. Shows how orders are being classified
4. Identifies missing or incorrect classifications
5. Generates a comparison report vs expected Google Sheets data

Run on prod to diagnose Paid Search undercounting issue.
"""

import os
import sys
import django

# Setup Django environment
sys.path.append('/var/www/vvv-frontpage/backend')  # Adjust path for your prod setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from woocommerce.models import WooCommerceOrder, ChannelClassification
from django.db.models import Count, Q, Sum
from collections import defaultdict
from decimal import Decimal

def audit_channel_classifications():
    """Check what channel classification rules exist in the database"""
    print("\n" + "="*80)
    print("🔍 CHANNEL CLASSIFICATION RULES AUDIT")
    print("="*80)
    
    # Get all active rules
    rules = ChannelClassification.objects.filter(is_active=True).order_by('channel_type', 'source', 'medium')
    
    print(f"\n📊 Total active rules: {rules.count()}\n")
    
    if rules.count() == 0:
        print("❌ WARNING: No channel classification rules found in database!")
        print("   This means all orders will default to 'Direct' channel.")
        return
    
    # Group by channel type
    by_type = defaultdict(list)
    for rule in rules:
        by_type[rule.channel_type].append(rule)
    
    # Display by channel type
    for channel_type, rule_list in sorted(by_type.items()):
        print(f"\n{channel_type} ({len(rule_list)} rules):")
        for rule in rule_list:
            print(f"  • {rule.source}/{rule.medium} → {rule.channel}")
    
    # Check for critical rules
    print("\n" + "-"*80)
    print("✅ CRITICAL RULE CHECKS:")
    print("-"*80)
    
    critical_rules = {
        ('google', 'utm'): 'google/utm → Paid Search',
        ('google', 'cpc'): 'google/cpc → Paid Search',
        ('google', 'ppc'): 'google/ppc → Paid Search',
        ('google', 'organic'): 'google/organic → SEO',
        ('(direct)', 'typein'): '(direct)/typein → Direct',
        ('chatgpt.com', 'utm'): 'chatgpt.com/utm → ChatGpt',
        ('bing.com', 'referral'): 'bing.com/referral → Referral',
        ('trustpilot', 'utm'): 'trustpilot/utm → Referral',
    }
    
    rule_map = {(r.source.lower(), r.medium.lower()): r for r in rules}
    
    all_good = True
    for (source, medium), desc in critical_rules.items():
        rule = rule_map.get((source, medium))
        if rule and rule.channel_type:
            print(f"  ✅ {desc}")
        else:
            print(f"  ❌ MISSING: {desc}")
            all_good = False
    
    if not all_good:
        print("\n⚠️  Missing critical rules! Run:")
        print("   python manage.py update_channel_classifications")


def audit_order_attribution_data():
    """Check if orders have attribution data and how they're being classified"""
    print("\n" + "="*80)
    print("🔍 ORDER ATTRIBUTION DATA AUDIT")
    print("="*80)
    
    # Sample orders from both stores
    stores = ['porsa.dk', 'dupskoshoppen.dk']
    
    for store in stores:
        print(f"\n📦 {store}:")
        print("-"*80)
        
        # Get recent orders
        orders = WooCommerceOrder.objects.filter(
            client_name=store
        ).order_by('-date_created')[:100]
        
        total = orders.count()
        print(f"\n  Total recent orders analyzed: {total}")
        
        if total == 0:
            print(f"  ⚠️  No orders found for {store}")
            continue
        
        # Count orders with attribution data
        has_attribution = 0
        has_raw_data = 0
        attribution_breakdown = defaultdict(int)
        
        paid_search_orders = []
        direct_orders = []
        seo_orders = []
        other_orders = []
        
        for order in orders:
            # Check if attribution fields are populated
            if order.attribution_utm_source:
                has_attribution += 1
                utm_source = order.attribution_utm_source or '(none)'
                attr_type = order.attribution_source_type or '(none)'
                attribution_breakdown[(utm_source, attr_type)] += 1
                
                # Simulate classification
                from woocommerce.views import WooCommerceOrderViewSet
                viewset = WooCommerceOrderViewSet()
                
                # Use the classification map from the viewset
                classifications = ChannelClassification.objects.filter(is_active=True)
                classification_map = {
                    (rule.source.lower(), rule.medium.lower()): rule 
                    for rule in classifications
                }
                
                source = str(order.attribution_utm_source).strip().lower()
                medium = str(order.attribution_source_type or 'utm').strip().lower()
                
                # Normalize
                source = viewset._normalize_source(source)
                medium = viewset._normalize_medium(medium)
                
                classification = classification_map.get((source, medium))
                channel_type = classification.channel_type if classification else 'Direct'
                
                if channel_type == 'Paid Search':
                    paid_search_orders.append({
                        'order_id': order.order_id,
                        'source': order.attribution_utm_source,
                        'medium': order.attribution_source_type,
                        'normalized': f"{source}/{medium}"
                    })
                elif channel_type == 'Direct':
                    direct_orders.append({
                        'order_id': order.order_id,
                        'source': order.attribution_utm_source,
                        'medium': order.attribution_source_type,
                    })
                elif channel_type == 'SEO':
                    seo_orders.append({
                        'order_id': order.order_id,
                        'source': order.attribution_utm_source,
                        'medium': order.attribution_source_type,
                    })
                else:
                    other_orders.append({
                        'order_id': order.order_id,
                        'source': order.attribution_utm_source,
                        'medium': order.attribution_source_type,
                        'channel': channel_type
                    })
            
            if order.raw_data:
                has_raw_data += 1
        
        print(f"\n  Attribution Summary:")
        print(f"    • Orders with attribution data: {has_attribution}/{total} ({has_attribution/total*100:.1f}%)")
        print(f"    • Orders with raw_data: {has_raw_data}/{total} ({has_raw_data/total*100:.1f}%)")
        
        if has_attribution > 0:
            print(f"\n  Classification Breakdown (from attribution data):")
            print(f"    • Paid Search: {len(paid_search_orders)} orders")
            print(f"    • SEO: {len(seo_orders)} orders")
            print(f"    • Direct: {len(direct_orders)} orders")
            print(f"    • Other: {len(other_orders)} orders")
            
            if len(paid_search_orders) > 0:
                print(f"\n  🔥 Top Paid Search orders (showing first 10):")
                for order in paid_search_orders[:10]:
                    print(f"    Order {order['order_id']}: {order['source']}/{order['medium']} ({order['normalized']})")
            
            if len(direct_orders) > 0 and len(direct_orders) > len(paid_search_orders):
                print(f"\n  ⚠️  Many orders classified as Direct. Sample Direct orders:")
                for order in direct_orders[:5]:
                    print(f"    Order {order['order_id']}: {order['source']}/{order['medium']}")
        
        if has_attribution == 0:
            print(f"\n  ❌ CRITICAL: No attribution data found!")
            print(f"  This means the WooCommerce Order Attribution plugin may not be installed,")
            print(f"  or the sync is not extracting attribution metadata.")


def compare_expected_vs_actual():
    """Compare expected Google Sheets data vs what app would classify"""
    print("\n" + "="*80)
    print("📊 EXPECTED vs ACTUAL COMPARISON")
    print("="*80)
    
    # Based on your CSV files
    expected_paid_search_patterns = [
        ('google', 'utm'),
        ('google', 'cpc'),
        ('google', 'ppc'),
    ]
    
    # Check what rules we have
    classifications = ChannelClassification.objects.filter(is_active=True)
    rule_map = {(r.source.lower(), r.medium.lower()): r for r in classifications}
    
    print("\nExpected Paid Search patterns:")
    all_covered = True
    for source, medium in expected_paid_search_patterns:
        rule = rule_map.get((source, medium))
        if rule and rule.channel_type == 'Paid Search':
            print(f"  ✅ {source}/{medium} → Paid Search")
        else:
            print(f"  ❌ {source}/{medium} → NOT CLASSIFIED AS PAID SEARCH")
            all_covered = False
    
    if not all_covered:
        print("\n⚠️  Missing Paid Search classification rules!")


def generate_fix_recommendations():
    """Generate recommendations to fix the issue"""
    print("\n" + "="*80)
    print("🛠️  RECOMMENDED FIXES")
    print("="*80)
    
    classifications = ChannelClassification.objects.filter(is_active=True)
    
    if classifications.count() == 0:
        print("\n1. Run: python manage.py update_channel_classifications")
        print("   This will seed all required channel classification rules.")
    
    # Check if we have the critical Paid Search rules
    rule_map = {(r.source.lower(), r.medium.lower()): r for r in classifications}
    
    needs_paid_search_fix = not any(
        rule_map.get(('google', 'utm')) and rule_map.get(('google', 'utm')).channel_type == 'Paid Search',
        rule_map.get(('google', 'cpc')) and rule_map.get(('google', 'cpc')).channel_type == 'Paid Search',
        rule_map.get(('google', 'ppc')) and rule_map.get(('google', 'ppc')).channel_type == 'Paid Search',
    )
    
    if needs_paid_search_fix:
        print("\n2. Ensure Google UTM orders are classified as Paid Search:")
        print("   - google/utm → Paid Search")
        print("   - google/cpc → Paid Search")
        print("   - google/ppc → Paid Search")
    
    # Check attribution data
    orders_with_attr = WooCommerceOrder.objects.filter(
        attribution_utm_source__isnull=False
    ).exclude(attribution_utm_source='').count()
    total_orders = WooCommerceOrder.objects.count()
    
    if orders_with_attr < total_orders * 0.1:  # Less than 10% have attribution
        print("\n3. Check WooCommerce Order Attribution plugin:")
        print("   - Ensure plugin is installed on both stores")
        print("   - Verify attribution metadata is being captured")
        print("   - Re-sync orders if needed")
    
    print("\n4. After applying fixes, verify counts match:")
    print("   - Check Google Sheets export for Paid Search count")
    print("   - Check app analytics for Paid Search count")
    print("   - They should align within 5-10% margin")


def main():
    """Run the complete audit"""
    print("\n" + "="*80)
    print("🚀 WOOCOMMERCE ANALYTICS AUDIT")
    print("="*80)
    print("\nThis audit will help identify why Paid Search orders are undercounted.")
    
    audit_channel_classifications()
    audit_order_attribution_data()
    compare_expected_vs_actual()
    generate_fix_recommendations()
    
    print("\n" + "="*80)
    print("✅ AUDIT COMPLETE")
    print("="*80)
    print("\nNext steps:")
    print("1. Review the output above")
    print("2. Apply the recommended fixes")
    print("3. Re-run this script to verify")
    print("4. Compare actual vs expected counts")


if __name__ == '__main__':
    main()











