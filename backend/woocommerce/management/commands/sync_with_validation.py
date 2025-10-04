"""
Django management command to sync WooCommerce data with validation
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from woocommerce.tasks import sync_woocommerce_config
from woocommerce.models import WooCommerceOrder, WooCommerceJob
from users.models import AccountConfiguration


class Command(BaseCommand):
    help = 'Sync WooCommerce data with validation and detailed reporting'

    def add_arguments(self, parser):
        parser.add_argument(
            '--client-name',
            type=str,
            help='Specific client name to sync (default: all clients)',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to sync (default: 30)',
        )
        parser.add_argument(
            '--validate-only',
            action='store_true',
            help='Only validate, do not sync',
        )

    def handle(self, *args, **options):
        client_name = options.get('client_name')
        days = options.get('days')
        validate_only = options.get('validate_only')
        
        self.stdout.write(
            self.style.SUCCESS(f'🔧 Starting sync with validation for last {days} days...')
        )
        
        # Get configurations to sync
        configs = AccountConfiguration.objects.filter(config_type='woocommerce', is_active=True)
        if client_name:
            configs = configs.filter(account__name=client_name)
        
        if not configs.exists():
            self.stdout.write(
                self.style.ERROR(f'❌ No WooCommerce configurations found for client: {client_name}')
            )
            return
        
        # Calculate date range
        end_date = timezone.now() + timedelta(minutes=5)  # Include buffer
        start_date = end_date - timedelta(days=days)
        
        self.stdout.write(f'📅 Date range: {start_date.date()} to {end_date.date()}')
        
        for config in configs:
            self.stdout.write(f'\n📊 Processing {config.account.name}...')
            
            # Pre-sync validation
            pre_sync_count = WooCommerceOrder.objects.filter(
                client_name=config.account.name,
                date_created__gte=start_date,
                date_created__lte=end_date
            ).count()
            
            self.stdout.write(f'  📊 Pre-sync orders: {pre_sync_count}')
            
            if not validate_only:
                # Run sync
                self.stdout.write('  🔄 Running sync...')
                try:
                    result = sync_woocommerce_config(
                        config.id, 
                        'daily_sync', 
                        start_date, 
                        end_date
                    )
                    
                    if result.get('success'):
                        self.stdout.write('  ✅ Sync completed successfully!')
                        self.stdout.write(f'    Orders processed: {result.get("orders_processed", 0)}')
                        self.stdout.write(f'    Orders created: {result.get("orders_created", 0)}')
                        self.stdout.write(f'    Orders updated: {result.get("orders_updated", 0)}')
                    else:
                        self.stdout.write(
                            self.style.ERROR(f'  ❌ Sync failed: {result.get("error", "Unknown error")}')
                        )
                        continue
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'  ❌ Sync error: {e}')
                    )
                    continue
            
            # Post-sync validation
            post_sync_count = WooCommerceOrder.objects.filter(
                client_name=config.account.name,
                date_created__gte=start_date,
                date_created__lte=end_date
            ).count()
            
            self.stdout.write(f'  📊 Post-sync orders: {post_sync_count}')
            
            if not validate_only:
                new_orders = post_sync_count - pre_sync_count
                self.stdout.write(f'  🆕 New orders added: {new_orders}')
            
            # Check Paid Search orders
            paid_search_orders = WooCommerceOrder.objects.filter(
                client_name=config.account.name,
                date_created__gte=start_date,
                date_created__lte=end_date,
                attribution_utm_source='google',
                attribution_source_type='utm'
            )
            
            self.stdout.write(f'  💰 Paid Search orders: {paid_search_orders.count()}')
            
            # Check recent orders (last 24 hours)
            recent_start = timezone.now() - timedelta(hours=24)
            recent_orders = WooCommerceOrder.objects.filter(
                client_name=config.account.name,
                date_created__gte=recent_start
            )
            
            self.stdout.write(f'  🕐 Recent orders (24h): {recent_orders.count()}')
            
            # Show latest job status
            latest_job = WooCommerceJob.objects.filter(
                client_name=config.account.name,
                job_type='daily_sync'
            ).order_by('-started_at').first()
            
            if latest_job:
                self.stdout.write(f'  📋 Latest job: {latest_job.status} at {latest_job.started_at}')
        
        self.stdout.write('\n🎉 Sync with validation completed!')
        
        # Run validation command
        if not validate_only:
            self.stdout.write('\n🔍 Running comprehensive validation...')
            from django.core.management import call_command
            call_command('validate_sync_completeness', 
                        client_name=client_name, 
                        days=days)
