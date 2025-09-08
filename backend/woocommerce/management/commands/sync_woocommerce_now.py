from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import AccountConfiguration
from woocommerce.tasks import sync_woocommerce_config
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Manually trigger WooCommerce sync for testing new fields'

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
            self.style.SUCCESS(f'Starting WooCommerce sync - Job Type: {job_type}, Days Back: {days_back}')
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
                
                # Trigger sync
                result = sync_woocommerce_config.delay(config.id, job_type, start_date, end_date)
                
                self.stdout.write(
                    self.style.SUCCESS(f'Sync task started with ID: {result.id}')
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
            
            for config in configs:
                self.stdout.write(f'- {config.name} ({config.account.name})')
                
                # Calculate date range
                start_date = timezone.now() - timezone.timedelta(days=days_back)
                end_date = timezone.now()
                
                # Trigger sync
                result = sync_woocommerce_config.delay(config.id, job_type, start_date, end_date)
                
                self.stdout.write(
                    self.style.SUCCESS(f'  Started sync task: {result.id}')
                )
        
        self.stdout.write(
            self.style.SUCCESS('\nSync tasks have been queued. Check the job monitoring dashboard for progress.')
        )
        self.stdout.write('You can also check the sync logs in the admin panel or via the API.')











