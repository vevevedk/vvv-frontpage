from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import AccountConfiguration
from woocommerce.tasks import sync_woocommerce_config
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Run WooCommerce sync directly (without Celery) to test new fields'

    def add_arguments(self, parser):
        parser.add_argument(
            '--config-id',
            type=int,
            help='Specific configuration ID to sync (optional)'
        )
        parser.add_argument(
            '--job-type',
            type=str,
            default='manual_sync',
            choices=['manual_sync', 'daily_sync', 'backfill'],
            help='Type of sync job to run'
        )
        parser.add_argument(
            '--days-back',
            type=int,
            default=7,
            help='Number of days back to sync (default: 7)'
        )

    def handle(self, *args, **options):
        config_id = options.get('config_id')
        job_type = options.get('job_type')
        days_back = options.get('days_back')
        
        self.stdout.write(
            self.style.SUCCESS(f'Starting direct WooCommerce sync - Job Type: {job_type}, Days Back: {days_back}')
        )
        
        if config_id:
            # Sync specific configuration
            try:
                config = AccountConfiguration.objects.get(
                    id=config_id, 
                    config_type='woocommerce'
                )
                self.stdout.write(f'Syncing configuration: {config.name} ({config.account.name})')
                
                # Calculate date range
                start_date = timezone.now() - timezone.timedelta(days=days_back)
                end_date = timezone.now()
                
                # Run sync directly (not as a Celery task)
                result = sync_woocommerce_config(config.id, job_type, start_date, end_date)
                
                if result.get('success'):
                    self.stdout.write(
                        self.style.SUCCESS(f'Sync completed successfully!')
                    )
                    self.stdout.write(f'Orders processed: {result.get("orders_processed", 0)}')
                    self.stdout.write(f'Orders created: {result.get("orders_created", 0)}')
                    self.stdout.write(f'Orders updated: {result.get("orders_updated", 0)}')
                else:
                    self.stdout.write(
                        self.style.ERROR(f'Sync failed: {result.get("error", "Unknown error")}')
                    )
                
                self.stdout.write(f'Start Date: {start_date.strftime("%Y-%m-%d %H:%M")}')
                self.stdout.write(f'End Date: {end_date.strftime("%Y-%m-%d %H:%M")}')
                
            except AccountConfiguration.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Configuration with ID {config_id} not found')
                )
                return
        else:
            # Sync all WooCommerce configurations
            configs = AccountConfiguration.objects.filter(
                config_type='woocommerce',
                is_active=True
            )
            
            if not configs.exists():
                self.stdout.write(
                    self.style.WARNING('No active WooCommerce configurations found')
                )
                return
            
            self.stdout.write(f'Found {configs.count()} WooCommerce configurations to sync')
            
            total_processed = 0
            total_created = 0
            total_updated = 0
            
            for config in configs:
                self.stdout.write(f'\nSyncing: {config.name} ({config.account.name})')
                
                # Calculate date range
                start_date = timezone.now() - timezone.timedelta(days=days_back)
                end_date = timezone.now()
                
                try:
                    # Run sync directly
                    result = sync_woocommerce_config(config.id, job_type, start_date, end_date)
                    
                    if result.get('success'):
                        self.stdout.write(
                            self.style.SUCCESS(f'  ✓ Sync completed successfully')
                        )
                        self.stdout.write(f'  Orders processed: {result.get("orders_processed", 0)}')
                        self.stdout.write(f'  Orders created: {result.get("orders_created", 0)}')
                        self.stdout.write(f'  Orders updated: {result.get("orders_updated", 0)}')
                        
                        total_processed += result.get("orders_processed", 0)
                        total_created += result.get("orders_created", 0)
                        total_updated += result.get("orders_updated", 0)
                    else:
                        self.stdout.write(
                            self.style.ERROR(f'  ✗ Sync failed: {result.get("error", "Unknown error")}')
                        )
                        
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'  ✗ Sync error: {str(e)}')
                    )
            
            # Summary
            self.stdout.write(
                self.style.SUCCESS(f'\n=== SYNC SUMMARY ===')
            )
            self.stdout.write(f'Total orders processed: {total_processed}')
            self.stdout.write(f'Total orders created: {total_created}')
            self.stdout.write(f'Total orders updated: {total_updated}')
        
        self.stdout.write(
            self.style.SUCCESS('\nDirect sync completed! Check the database for new data with the updated fields.')
        )
        self.stdout.write('You can now view the new WooCommerce export fields in your admin panel or API.')













