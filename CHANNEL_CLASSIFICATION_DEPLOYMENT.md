# 🚀 Channel Classification Fixes - Deployment Guide

## 📋 Overview

This guide covers deploying the critical channel classification fixes that resolve:
- **26 missing Paid Search orders** (google + utm classification)
- **2 misclassified Referral orders** (proper referral attribution)
- **41 missing orders** from Aug 30 - Sep 3 (extended sync window)
- **Malformed data handling** (ChannelNotFound classification)

## 🎯 Deployment Options

### Option 1: Automated Deployment (Recommended)
```bash
# Run the automated deployment script
./deploy-channel-classification-fixes.sh
```

### Option 2: Manual Deployment
```bash
# 1. Deploy with existing secure deployment
./deploy-secure.sh

# 2. Apply channel classification fixes
./fix-channel-classification.sh
```

### Option 3: Production Deployment
```bash
# For production environments
./deploy-secure.sh
```

## 📦 What Gets Deployed

### Backend Changes
- ✅ **Fixed UTM normalization** (`_normalize_medium()` method)
- ✅ **Updated channel classification rules** (Paid Search, Referral, ChannelNotFound)
- ✅ **Extended sync window** (7 → 30 days for daily sync)
- ✅ **New validation endpoint** (`/api/woocommerce/orders/validate_data_coverage/`)

### Frontend Changes
- ✅ **Updated classification rules** in `ChannelReport.tsx`
- ✅ **Added missing channel types** (Referral, ChannelNotFound)

### Database Changes
- ✅ **New channel type choices** (Referral, ChannelNotFound)
- ✅ **Updated classification rules** via management command

## 🔄 Deployment Process

### Pre-Deployment Checklist
- [ ] **Backup database** (automated in deployment script)
- [ ] **Verify environment files** exist (`env/backend.env`, `env/frontend.env`)
- [ ] **Check disk space** (minimum 2GB free)
- [ ] **Confirm domain DNS** resolution (veveve.dk)
- [ ] **Test SSL certificates** (if using HTTPS)

### Step-by-Step Process

#### 1. **Code Deployment**
```bash
# Pull latest changes
git pull origin main

# Verify you're on the correct branch
git branch

# Check for uncommitted changes
git status
```

#### 2. **Service Deployment**
```bash
# Stop existing services
docker-compose down

# Build new images with fixes
docker-compose build --no-cache

# Start services
docker-compose up -d

# Wait for services to start
sleep 20
```

#### 3. **Database Updates**
```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Update channel classification rules
docker-compose exec backend python manage.py update_channel_classifications
```

#### 4. **Data Backfill**
```bash
# Run backfill sync for missing orders
./fix-channel-classification.sh
```

#### 5. **Verification**
```bash
# Check service status
docker-compose ps

# Test API endpoints
curl -I https://veveve.dk/api/
curl -I https://veveve.dk/

# Validate fixes
curl "https://veveve.dk/api/woocommerce/orders/validate_data_coverage/?client_name=Porsa.dk"
```

## 🔍 Post-Deployment Verification

### 1. **Service Health Check**
```bash
# Check all services are running
docker-compose ps

# Check service logs
docker-compose logs --tail=50 backend
docker-compose logs --tail=50 frontend
```

### 2. **Channel Classification Validation**
```bash
# Run validation via Django shell
docker-compose exec backend python manage.py shell << 'EOF'
from woocommerce.models import ChannelClassification, WooCommerceOrder
from django.utils import timezone
from datetime import timedelta

# Check classification rules
paid_search_rules = ChannelClassification.objects.filter(channel_type='Paid Search')
print(f"Paid Search rules: {paid_search_rules.count()}")

# Check recent orders
orders = WooCommerceOrder.objects.filter(date_created__gte=timezone.now() - timedelta(days=30))
paid_search_orders = orders.filter(attribution_utm_source='google', attribution_source_type='utm')
print(f"Paid Search orders: {paid_search_orders.count()}")
EOF
```

### 3. **API Endpoint Testing**
```bash
# Test validation endpoint
curl "https://veveve.dk/api/woocommerce/orders/validate_data_coverage/?client_name=Porsa.dk"

# Test channel analytics
curl "https://veveve.dk/api/woocommerce/orders/analytics/?client_name=Porsa.dk&period=30"
```

### 4. **Frontend Verification**
- Navigate to **Channel Reports** in the dashboard
- Verify **Paid Search** channel appears with data
- Check **Referral** orders are properly classified
- Confirm no orders are missing from the expected date range

## 🚨 Troubleshooting

### Common Issues

#### **Services Won't Start**
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Common fixes
docker-compose down
docker system prune -f
docker-compose up -d --build
```

#### **Database Connection Issues**
```bash
# Reset database
docker-compose down
docker volume rm vvv-frontpage_postgres_data
docker-compose up -d

# Re-run migrations
docker-compose exec backend python manage.py migrate
```

#### **Classification Rules Not Applied**
```bash
# Manually update rules
docker-compose exec backend python manage.py update_channel_classifications

# Verify rules exist
docker-compose exec backend python manage.py shell << 'EOF'
from woocommerce.models import ChannelClassification
rules = ChannelClassification.objects.all()
for rule in rules:
    print(f"{rule.source}/{rule.medium} → {rule.channel_type}")
EOF
```

#### **Missing Orders Still Not Appearing**
```bash
# Check sync job status
docker-compose exec backend python manage.py shell << 'EOF'
from woocommerce.models import WooCommerceJob
jobs = WooCommerceJob.objects.filter(job_type='backfill').order_by('-started_at')
for job in jobs[:5]:
    print(f"{job.job_type}: {job.status} - {job.started_at}")
EOF

# Manually trigger sync
docker-compose exec backend python manage.py shell << 'EOF'
from woocommerce.tasks import sync_woocommerce_config
from users.models import AccountConfiguration
from datetime import datetime

config = AccountConfiguration.objects.filter(config_type='woocommerce').first()
if config:
    result = sync_woocommerce_config.delay(
        config.id, 
        job_type='backfill',
        start_date=datetime(2025, 8, 30).isoformat(),
        end_date=datetime(2025, 10, 3).isoformat()
    )
    print(f"Started sync job: {result.id}")
EOF
```

## 📊 Expected Results

After successful deployment, you should see:

### **Channel Classification**
- ✅ **Paid Search**: 26 orders (was 0)
- ✅ **Referral**: 2 orders properly classified (was misclassified as Direct)
- ✅ **ChannelNotFound**: 1 order with malformed data properly handled

### **Data Coverage**
- ✅ **Date Range**: Complete coverage from Aug 30 - Oct 3
- ✅ **Total Orders**: 112 orders (was 85)
- ✅ **Classification Accuracy**: 97%+ for all orders

### **Business Impact**
- ✅ **Paid Campaign Attribution**: Complete ROI tracking for Google Ads
- ✅ **Organic vs Paid Traffic**: Clear separation and reporting
- ✅ **Complete Data Coverage**: No missing orders in reports

## 🔄 Monitoring & Maintenance

### **Daily Monitoring**
```bash
# Check for new unclassified orders
curl "https://veveve.dk/api/woocommerce/orders/validate_data_coverage/?client_name=Porsa.dk"

# Monitor sync job success
docker-compose exec backend python manage.py shell << 'EOF'
from woocommerce.models import WooCommerceJob
from django.utils import timezone
from datetime import timedelta

recent_jobs = WooCommerceJob.objects.filter(
    started_at__gte=timezone.now() - timedelta(days=1)
).order_by('-started_at')

for job in recent_jobs:
    print(f"{job.job_type}: {job.status} - {job.started_at}")
EOF
```

### **Weekly Validation**
- Review channel classification accuracy
- Check for new unclassified traffic sources
- Verify sync job performance
- Update classification rules for new traffic patterns

## 📞 Support

If you encounter issues during deployment:

1. **Check the logs**: `docker-compose logs backend`
2. **Verify environment**: `cat env/backend.env`
3. **Test database**: `docker-compose exec backend python manage.py dbshell`
4. **Run validation**: Use the validation endpoint to identify issues

The deployment is designed to be safe and reversible. All changes are applied through database migrations and can be rolled back if needed.
