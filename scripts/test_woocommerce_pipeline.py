#!/usr/bin/env python3
"""
WooCommerce Pipeline Testing Script
This script tests the pipeline functionality and checks data flow
"""

import os
import sys
import django
from datetime import datetime, timedelta

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from woocommerce.models import WooCommerceOrder, WooCommerceJob, WooCommerceSyncLog
from users.models import AccountConfiguration
from django.db.models import Count, Sum, Avg
from django.utils import timezone

def test_pipeline_status():
    """Test the current pipeline status"""
    print("🔍 Testing WooCommerce Pipeline Status")
    print("=" * 50)
    
    # Check configurations
    configs = AccountConfiguration.objects.filter(config_type='woocommerce')
    print(f"📋 WooCommerce Configurations: {configs.count()}")
    
    for config in configs:
        print(f"  - {config.account.name}: {config.name}")
    
    # Check orders
    orders = WooCommerceOrder.objects.all()
    print(f"📦 Total Orders in Database: {orders.count()}")
    
    if orders.exists():
        latest_order = orders.order_by('-date_created').first()
        oldest_order = orders.order_by('date_created').first()
        print(f"  - Latest Order: {latest_order.date_created}")
        print(f"  - Oldest Order: {oldest_order.date_created}")
        
        # Orders by client
        orders_by_client = orders.values('client_name').annotate(count=Count('id'))
        print("  - Orders by Client:")
        for client in orders_by_client:
            print(f"    • {client['client_name']}: {client['count']} orders")
    
    # Check jobs
    jobs = WooCommerceJob.objects.all()
    print(f"⚙️  Total Jobs: {jobs.count()}")
    
    if jobs.exists():
        recent_jobs = jobs.order_by('-created_at')[:5]
        print("  - Recent Jobs:")
        for job in recent_jobs:
            print(f"    • {job.job_type} - {job.status} ({job.created_at})")
    
    # Check logs
    logs = WooCommerceSyncLog.objects.all()
    print(f"📝 Total Logs: {logs.count()}")
    
    if logs.exists():
        recent_logs = logs.order_by('-created_at')[:3]
        print("  - Recent Log Messages:")
        for log in recent_logs:
            print(f"    • {log.level}: {log.message[:50]}...")

def analyze_performance():
    """Analyze WooCommerce performance metrics"""
    print("\n📊 WooCommerce Performance Analysis")
    print("=" * 50)
    
    orders = WooCommerceOrder.objects.all()
    
    if not orders.exists():
        print("❌ No orders found. Pipeline may not have synced data yet.")
        return
    
    # Basic metrics
    total_orders = orders.count()
    total_revenue = orders.aggregate(Sum('total'))['total__sum'] or 0
    avg_order_value = orders.aggregate(Avg('total'))['total__avg'] or 0
    
    print(f"💰 Total Revenue: ${total_revenue:,.2f}")
    print(f"📦 Total Orders: {total_orders:,}")
    print(f"💵 Average Order Value: ${avg_order_value:.2f}")
    
    # Orders by status
    status_breakdown = orders.values('status').annotate(count=Count('id')).order_by('-count')
    print("\n📈 Orders by Status:")
    for status in status_breakdown:
        percentage = (status['count'] / total_orders) * 100
        print(f"  • {status['status']}: {status['count']} ({percentage:.1f}%)")
    
    # Monthly trends (last 12 months)
    twelve_months_ago = timezone.now() - timedelta(days=365)
    monthly_orders = orders.filter(date_created__gte=twelve_months_ago).extra(
        select={'month': "DATE_TRUNC('month', date_created)"}
    ).values('month').annotate(
        count=Count('id'),
        revenue=Sum('total')
    ).order_by('month')
    
    print("\n📅 Monthly Trends (Last 12 Months):")
    for month in monthly_orders:
        print(f"  • {month['month'].strftime('%Y-%m')}: {month['count']} orders, ${month['revenue']:,.2f}")
    
    # Top customers
    top_customers = orders.exclude(customer_email__isnull=True).values(
        'customer_email', 'customer_first_name', 'customer_last_name'
    ).annotate(
        order_count=Count('id'),
        total_spent=Sum('total')
    ).order_by('-total_spent')[:10]
    
    print("\n🏆 Top Customers by Revenue:")
    for i, customer in enumerate(top_customers, 1):
        name = f"{customer['customer_first_name'] or ''} {customer['customer_last_name'] or ''}".strip()
        if not name:
            name = customer['customer_email']
        print(f"  {i}. {name}: {customer['order_count']} orders, ${customer['total_spent']:,.2f}")

def test_data_freshness():
    """Check how fresh the data is"""
    print("\n🕐 Data Freshness Check")
    print("=" * 50)
    
    orders = WooCommerceOrder.objects.all()
    
    if not orders.exists():
        print("❌ No orders found.")
        return
    
    latest_order = orders.order_by('-date_created').first()
    latest_sync = orders.order_by('-created_at').first()
    
    now = timezone.now()
    order_age = now - latest_order.date_created
    sync_age = now - latest_sync.created_at
    
    print(f"📦 Latest Order Date: {latest_order.date_created}")
    print(f"🔄 Latest Sync: {latest_sync.created_at}")
    print(f"⏰ Order Age: {order_age.days} days, {order_age.seconds // 3600} hours")
    print(f"⏰ Sync Age: {sync_age.days} days, {sync_age.seconds // 3600} hours")
    
    # Data freshness assessment
    if sync_age.days == 0 and sync_age.seconds < 3600:
        print("✅ Data is very fresh (synced within last hour)")
    elif sync_age.days == 0:
        print("✅ Data is fresh (synced today)")
    elif sync_age.days <= 1:
        print("⚠️  Data is somewhat stale (synced yesterday)")
    else:
        print("❌ Data is stale (synced more than 1 day ago)")

def run_pipeline_health_check():
    """Run a comprehensive pipeline health check"""
    print("🏥 Pipeline Health Check")
    print("=" * 50)
    
    health_score = 100
    issues = []
    
    # Check configurations
    configs = AccountConfiguration.objects.filter(config_type='woocommerce')
    if not configs.exists():
        health_score -= 30
        issues.append("No WooCommerce configurations found")
    
    # Check recent jobs
    recent_jobs = WooCommerceJob.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=7)
    )
    failed_jobs = recent_jobs.filter(status='failed')
    
    if failed_jobs.exists():
        health_score -= 20
        issues.append(f"{failed_jobs.count()} failed jobs in last 7 days")
    
    # Check data recency
    orders = WooCommerceOrder.objects.all()
    if orders.exists():
        latest_sync = orders.order_by('-created_at').first()
        sync_age = timezone.now() - latest_sync.created_at
        
        if sync_age.days > 2:
            health_score -= 25
            issues.append("Data hasn't been synced in over 2 days")
        elif sync_age.days > 1:
            health_score -= 10
            issues.append("Data hasn't been synced in over 1 day")
    else:
        health_score -= 40
        issues.append("No order data found")
    
    # Check error logs
    error_logs = WooCommerceSyncLog.objects.filter(
        level='ERROR',
        created_at__gte=timezone.now() - timedelta(days=1)
    )
    
    if error_logs.count() > 5:
        health_score -= 15
        issues.append(f"{error_logs.count()} error logs in last 24 hours")
    
    # Display results
    if health_score >= 90:
        status = "🟢 EXCELLENT"
    elif health_score >= 70:
        status = "🟡 GOOD"
    elif health_score >= 50:
        status = "🟠 FAIR"
    else:
        status = "🔴 POOR"
    
    print(f"Overall Health: {status} ({health_score}/100)")
    
    if issues:
        print("\n⚠️  Issues Found:")
        for issue in issues:
            print(f"  • {issue}")
    else:
        print("\n✅ No issues found!")

if __name__ == "__main__":
    print("🚀 WooCommerce Pipeline Testing Suite")
    print("=" * 60)
    
    try:
        test_pipeline_status()
        analyze_performance()
        test_data_freshness()
        run_pipeline_health_check()
        
        print("\n" + "=" * 60)
        print("✅ Pipeline testing completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()