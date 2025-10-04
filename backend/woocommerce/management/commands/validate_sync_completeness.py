"""
Django management command to validate sync completeness
"""
import os
import sys
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, datetime
from woocommerce.models import WooCommerceOrder, WooCommerceJob, WooCommerceSyncLog
from users.models import AccountConfiguration
import requests
from decimal import Decimal


class Command(BaseCommand):
    help = 'Validate that sync is capturing all orders for the last 30 days including today'

    def add_arguments(self, parser):
        parser.add_argument(
            '--client-name',
            type=str,
            help='Specific client name to validate (default: all clients)',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to validate (default: 30)',
        )

    def handle(self, *args, **options):
        client_name = options.get('client_name')
        days = options.get('days')
        
        self.stdout.write(
            self.style.SUCCESS(f'🔍 Validating sync completeness for last {days} days...')
        )
        
        # Get configurations to validate
        configs = AccountConfiguration.objects.filter(config_type='woocommerce', is_active=True)
        if client_name:
            configs = configs.filter(account__name=client_name)
        
        if not configs.exists():
            self.stdout.write(
                self.style.ERROR(f'❌ No WooCommerce configurations found for client: {client_name}')
            )
            return
        
        # Calculate date range
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        self.stdout.write(f'📅 Date range: {start_date.date()} to {end_date.date()}')
        
        for config in configs:
            self.stdout.write(f'\n📊 Validating {config.account.name}...')
            
            try:
                self.validate_client_sync(config, start_date, end_date, days)
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error validating {config.account.name}: {e}')
                )
    
    def validate_client_sync(self, config, start_date, end_date, days):
        """Validate sync for a specific client"""
        
        # 1. Check recent sync jobs
        recent_jobs = WooCommerceJob.objects.filter(
            client_name=config.account.name,
            job_type='daily_sync',
            started_at__gte=start_date
        ).order_by('-started_at')
        
        if recent_jobs.exists():
            latest_job = recent_jobs.first()
            self.stdout.write(f'  ✅ Latest sync: {latest_job.started_at} ({latest_job.status})')
        else:
            self.stdout.write(
                self.style.WARNING(f'  ⚠️ No recent sync jobs found for {config.account.name}')
            )
        
        # 2. Count orders in database
        db_orders = WooCommerceOrder.objects.filter(
            client_name=config.account.name,
            date_created__gte=start_date,
            date_created__lte=end_date
        )
        
        self.stdout.write(f'  📊 Orders in DB: {db_orders.count()}')
        
        # 3. Count orders in WooCommerce API
        try:
            wc_orders = self.fetch_orders_from_api(config, start_date, end_date)
            self.stdout.write(f'  🌐 Orders in WooCommerce: {len(wc_orders)}')
            
            # 4. Compare and identify missing orders
            db_order_ids = set(int(order.order_id) for order in db_orders)
            wc_order_ids = set(order['id'] for order in wc_orders)
            
            missing_ids = wc_order_ids - db_order_ids
            extra_ids = db_order_ids - wc_order_ids
            
            if missing_ids:
                self.stdout.write(
                    self.style.WARNING(f'  ⚠️ Missing orders: {len(missing_ids)}')
                )
                self.stdout.write(f'    Missing order IDs: {sorted(list(missing_ids))[:10]}...')
            else:
                self.stdout.write('  ✅ No missing orders')
            
            if extra_ids:
                self.stdout.write(
                    self.style.WARNING(f'  ⚠️ Extra orders in DB: {len(extra_ids)}')
                )
                self.stdout.write(f'    Extra order IDs: {sorted(list(extra_ids))[:10]}...')
            
            # 5. Check Paid Search orders specifically
            paid_search_db = db_orders.filter(
                attribution_utm_source='google',
                attribution_source_type='utm'
            )
            
            paid_search_wc = [
                order for order in wc_orders
                if self.has_paid_search_attribution(order)
            ]
            
            self.stdout.write(f'  💰 Paid Search orders - DB: {paid_search_db.count()}, WooCommerce: {len(paid_search_wc)}')
            
            # 6. Check recent orders (last 24 hours)
            recent_start = timezone.now() - timedelta(hours=24)
            recent_db_orders = db_orders.filter(date_created__gte=recent_start)
            recent_wc_orders = [
                order for order in wc_orders
                if self.parse_datetime(order.get('date_created', '')) >= recent_start
            ]
            
            self.stdout.write(f'  🕐 Recent orders (24h) - DB: {recent_db_orders.count()}, WooCommerce: {len(recent_wc_orders)}')
            
            # 7. Summary
            sync_accuracy = ((len(wc_orders) - len(missing_ids)) / len(wc_orders) * 100) if wc_orders else 100
            self.stdout.write(f'  📈 Sync accuracy: {sync_accuracy:.1f}%')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  ❌ Error fetching from WooCommerce API: {e}')
            )
    
    def fetch_orders_from_api(self, config, start_date, end_date):
        """Fetch orders from WooCommerce API"""
        wc_config = config.get_woocommerce_config()
        if not wc_config:
            raise Exception("Invalid WooCommerce configuration")
        
        base_url = wc_config['store_url'].rstrip('/')
        api_url = f"{base_url}/wp-json/wc/v3/orders"
        
        def z(dt):
            try:
                from django.utils import timezone as djtz
                dt = dt if djtz.is_aware(dt) else djtz.make_aware(dt)
                return dt.astimezone(djtz.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
            except Exception:
                return dt.isoformat()
        
        params = {
            'consumer_key': wc_config['consumer_key'],
            'consumer_secret': wc_config['consumer_secret'],
            'per_page': 100,
            'after': z(start_date),
            'before': z(end_date),
            'status': 'any',
            'orderby': 'date',
            'order': 'asc'
        }
        
        orders = []
        page = 1
        
        while True:
            params['page'] = page
            response = requests.get(api_url, params=params, timeout=30)
            
            if response.status_code != 200:
                raise Exception(f"API error: {response.status_code} - {response.text}")
            
            page_orders = response.json()
            
            if not page_orders:
                break
                
            orders.extend(page_orders)
            page += 1
            
            # Safety check
            if page > 100:
                break
        
        return orders
    
    def has_paid_search_attribution(self, order_data):
        """Check if order has paid search attribution"""
        if 'meta_data' in order_data:
            for meta_item in order_data['meta_data']:
                if isinstance(meta_item, dict):
                    key = meta_item.get('key', '')
                    value = meta_item.get('value', '')
                    
                    if key == '_wc_order_attribution_utm_source' and value == 'google':
                        # Check if source_type is utm
                        for meta_item2 in order_data['meta_data']:
                            if (isinstance(meta_item2, dict) and 
                                meta_item2.get('key') == '_wc_order_attribution_source_type' and 
                                meta_item2.get('value') == 'utm'):
                                return True
        return False
    
    def parse_datetime(self, dt_str):
        """Parse datetime string safely"""
        if not dt_str:
            return None
        try:
            from django.utils.dateparse import parse_datetime
            return parse_datetime(dt_str)
        except Exception:
            return None
