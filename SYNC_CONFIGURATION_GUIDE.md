# 🔄 WooCommerce Sync Configuration Guide

## 📋 Overview

This guide explains how the WooCommerce sync process is configured to ensure it captures the last 30 days including today, and how to validate that it's working properly.

## ⚙️ Current Sync Configuration

### **Automatic Daily Sync**
- **Schedule**: Every 24 hours via Celery Beat
- **Date Range**: Last 30 days + 5 minutes buffer
- **End Time**: Current time + 5 minutes (ensures today's orders are captured)

### **Date Range Logic**
```python
# In backend/woocommerce/tasks.py
start_date = timezone.now() - timedelta(days=30)  # 30 days lookback
end_date = timezone.now() + timedelta(minutes=5)  # Include buffer for today
```

### **Pipeline Sync**
- Pipeline sync triggers the same `sync_woocommerce_config` task
- Uses the same date range logic
- Can be triggered manually via the pipeline interface

## 🛠️ Improvements Made

### **1. Enhanced Date Range**
- ✅ **30-day lookback** for comprehensive data coverage
- ✅ **5-minute buffer** to ensure today's orders are captured
- ✅ **Proper timezone handling** for accurate date ranges

### **2. Better Logging**
- ✅ **Detailed sync logs** with date ranges and order counts
- ✅ **Sync summary** showing orders fetched vs processed
- ✅ **Error tracking** for failed syncs

### **3. Validation Tools**
- ✅ **`validate_sync_completeness`** command to check sync accuracy
- ✅ **`sync_with_validation`** command for manual sync with validation
- ✅ **Comprehensive reporting** on missing orders and sync accuracy

## 📊 Validation Commands

### **Check Sync Completeness**
```bash
# Validate all clients for last 30 days
docker-compose exec backend python manage.py validate_sync_completeness

# Validate specific client
docker-compose exec backend python manage.py validate_sync_completeness --client-name="Porsa.dk"

# Validate different time period
docker-compose exec backend python manage.py validate_sync_completeness --days=7
```

### **Manual Sync with Validation**
```bash
# Sync all clients with validation
docker-compose exec backend python manage.py sync_with_validation

# Sync specific client
docker-compose exec backend python manage.py sync_with_validation --client-name="Porsa.dk"

# Validate only (no sync)
docker-compose exec backend python manage.py sync_with_validation --validate-only
```

### **Quick Sync**
```bash
# Run immediate sync
docker-compose exec backend python manage.py sync_woocommerce_now
```

## 🔍 What the Validation Checks

### **1. Recent Sync Jobs**
- Verifies that daily sync jobs are running
- Shows status of latest sync attempts

### **2. Order Count Comparison**
- Compares orders in database vs WooCommerce API
- Identifies missing orders
- Shows extra orders in database

### **3. Paid Search Validation**
- Specifically checks for Paid Search orders
- Verifies `google/utm` attribution is captured
- Shows count comparison between DB and API

### **4. Recent Orders Check**
- Validates that orders from last 24 hours are captured
- Ensures today's orders are being synced

### **5. Sync Accuracy**
- Calculates percentage of orders successfully synced
- Provides overall sync health score

## 🚀 Deployment

### **Deploy Sync Improvements**
```bash
# Run the comprehensive deployment script
./ensure-sync-works-properly.sh
```

This script will:
1. Build updated backend image
2. Start services
3. Run migrations
4. Test sync configuration
5. Validate sync completeness
6. Check Celery Beat schedule

### **Manual Deployment Steps**
```bash
# 1. Build and start services
docker-compose build backend
docker-compose up -d

# 2. Run migrations
docker-compose exec backend python manage.py migrate

# 3. Validate sync
docker-compose exec backend python manage.py validate_sync_completeness

# 4. Test manual sync
docker-compose exec backend python manage.py sync_with_validation
```

## 📈 Monitoring Sync Health

### **Check Recent Sync Jobs**
```bash
docker-compose exec backend python manage.py shell -c "
from woocommerce.models import WooCommerceJob
from django.utils import timezone
from datetime import timedelta

recent_jobs = WooCommerceJob.objects.filter(
    job_type='daily_sync',
    started_at__gte=timezone.now() - timedelta(hours=24)
).order_by('-started_at')

for job in recent_jobs:
    print(f'{job.client_name}: {job.status} - {job.started_at}')
"
```

### **Check Celery Beat Status**
```bash
docker-compose exec backend python manage.py shell -c "
from celery import current_app
beat_schedule = current_app.conf.beat_schedule
for name, task_info in beat_schedule.items():
    print(f'{name}: {task_info[\"task\"]} - {task_info[\"schedule\"]}')
"
```

### **Monitor Sync Logs**
```bash
# Check backend logs
docker-compose logs backend --tail=50

# Check worker logs
docker-compose logs worker --tail=50

# Check beat logs
docker-compose logs beat --tail=50
```

## 🎯 Expected Results

### **After Proper Configuration:**
- ✅ **30-day data coverage** including today
- ✅ **All Paid Search orders** captured and classified
- ✅ **100% sync accuracy** for recent orders
- ✅ **Automatic daily sync** running on schedule
- ✅ **Comprehensive validation** available

### **Validation Output Example:**
```
📊 Validating Porsa.dk...
  ✅ Latest sync: 2025-10-04 14:30:00 (completed)
  📊 Orders in DB: 114
  🌐 Orders in WooCommerce: 114
  ✅ No missing orders
  💰 Paid Search orders - DB: 26, WooCommerce: 26
  🕐 Recent orders (24h) - DB: 3, WooCommerce: 3
  📈 Sync accuracy: 100.0%
```

## 🔧 Troubleshooting

### **Common Issues:**

1. **Missing Orders**
   - Run validation to identify gaps
   - Check WooCommerce API connectivity
   - Verify date range settings

2. **Sync Not Running**
   - Check Celery Beat status
   - Verify job schedule
   - Check worker logs

3. **Paid Search Orders Missing**
   - Verify channel classification rules
   - Check attribution data extraction
   - Run backfill sync if needed

### **Emergency Sync**
```bash
# If daily sync fails, run manual sync
docker-compose exec backend python manage.py sync_with_validation --days=30
```

## 📞 Support

If you encounter issues with the sync process:

1. **Run validation** to identify the problem
2. **Check logs** for error messages
3. **Verify configuration** is correct
4. **Test manual sync** to isolate issues

The sync system is now robust and should capture all orders from the last 30 days including today, with comprehensive validation to ensure accuracy.
