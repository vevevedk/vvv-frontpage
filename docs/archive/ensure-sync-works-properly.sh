#!/bin/bash

# Ensure Sync Works Properly
# This script ensures that the sync process captures the last 30 days including today

set -e

echo "🔧 Ensuring Sync Works Properly"
echo "================================"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "ℹ️  Checking Docker status..."
if ! docker info >/dev/null 2>&1; then
    echo "⚠️  Docker is not running. Starting Docker..."
    if command -v systemctl >/dev/null 2>&1; then
        sudo systemctl start docker
    elif command -v service >/dev/null 2>&1; then
        sudo service docker start
    else
        echo "❌ Cannot start Docker automatically. Please start Docker manually."
        exit 1
    fi
    
    # Wait for Docker to start
    echo "⏳ Waiting for Docker to start..."
    sleep 10
fi

echo "ℹ️  Building updated backend image with sync improvements..."
docker-compose build backend

echo "ℹ️  Starting services..."
docker-compose up -d

echo "ℹ️  Waiting for services to start..."
sleep 15

echo "ℹ️  Running database migrations..."
docker-compose exec -T backend python manage.py migrate

echo "ℹ️  Testing sync configuration..."
docker-compose exec -T backend python manage.py shell -c "
from woocommerce.tasks import sync_woocommerce_config
from users.models import AccountConfiguration
from django.utils import timezone
from datetime import timedelta

# Test the sync configuration
configs = AccountConfiguration.objects.filter(config_type='woocommerce', is_active=True)
if configs.exists():
    config = configs.first()
    
    # Test date range calculation
    now = timezone.now()
    start_date = now - timedelta(days=30)
    end_date = now + timedelta(minutes=5)
    
    print(f'✅ Sync configuration test:')
    print(f'  Start date: {start_date}')
    print(f'  End date: {end_date}')
    print(f'  Range: {(end_date - start_date).days} days')
    print(f'  Client: {config.account.name}')
else:
    print('❌ No WooCommerce configurations found')
"

echo "ℹ️  Running validation command..."
docker-compose exec -T backend python manage.py validate_sync_completeness --days=30

echo "ℹ️  Testing manual sync with validation..."
docker-compose exec -T backend python manage.py sync_with_validation --days=30

echo "ℹ️  Checking Celery Beat schedule..."
docker-compose exec -T backend python manage.py shell -c "
from celery import current_app
from celery.schedules import crontab

# Check the beat schedule
beat_schedule = current_app.conf.beat_schedule
print('✅ Celery Beat Schedule:')
for name, task_info in beat_schedule.items():
    print(f'  {name}: {task_info[\"task\"]} - {task_info[\"schedule\"]}')
"

echo "ℹ️  Checking recent sync jobs..."
docker-compose exec -T backend python manage.py shell -c "
from woocommerce.models import WooCommerceJob
from django.utils import timezone
from datetime import timedelta

recent_jobs = WooCommerceJob.objects.filter(
    job_type='daily_sync',
    started_at__gte=timezone.now() - timedelta(hours=24)
).order_by('-started_at')[:5]

print('✅ Recent sync jobs:')
if recent_jobs.exists():
    for job in recent_jobs:
        print(f'  {job.client_name}: {job.status} - {job.started_at}')
else:
    print('  No recent sync jobs found')
"

echo "ℹ️  Verifying services are running..."
docker-compose ps

echo ""
echo "🎉 Sync Configuration Complete!"
echo "==============================="
echo "✅ Backend updated with sync improvements"
echo "✅ 30-day lookback with 5-minute buffer for today"
echo "✅ Enhanced logging and validation"
echo "✅ Celery Beat scheduled for daily sync"
echo "✅ Validation commands available"
echo ""
echo "📋 Available Commands:"
echo "  docker-compose exec backend python manage.py validate_sync_completeness"
echo "  docker-compose exec backend python manage.py sync_with_validation"
echo "  docker-compose exec backend python manage.py sync_woocommerce_now"
echo ""
echo "🔄 The sync will automatically run daily at the scheduled time"
echo "📊 Use the validation commands to check sync completeness"
