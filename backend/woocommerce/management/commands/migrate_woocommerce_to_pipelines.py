"""
Migration script to move existing WooCommerce data to the new pipeline system.
Run this script to migrate existing WooCommerce clients to the new DataSource model.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from woocommerce.models import WooCommerceClient
from pipelines.models import DataSource

User = get_user_model()


class Command(BaseCommand):
    help = 'Migrate existing WooCommerce clients to the new pipeline system'

    def handle(self, *args, **options):
        self.stdout.write('Starting WooCommerce to Pipeline migration...')
        
        # Get all existing WooCommerce clients
        woocommerce_clients = WooCommerceClient.objects.all()
        
        migrated_count = 0
        skipped_count = 0
        
        for wc_client in woocommerce_clients:
            try:
                # Check if a DataSource already exists for this client
                existing_source = DataSource.objects.filter(
                    source_type='woocommerce',
                    name=wc_client.name
                ).first()
                
                if existing_source:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Skipping {wc_client.name} - DataSource already exists'
                        )
                    )
                    skipped_count += 1
                    continue
                
                # Create new DataSource from WooCommerce client
                config = {
                    'base_url': wc_client.base_url,
                    'consumer_key': wc_client.consumer_key,
                    'consumer_secret': wc_client.consumer_secret,
                    'timezone': wc_client.timezone,
                }
                
                # Generate slug from name
                slug = wc_client.name.lower().replace(' ', '-').replace('_', '-')
                # Ensure slug is unique
                counter = 1
                original_slug = slug
                while DataSource.objects.filter(slug=slug).exists():
                    slug = f"{original_slug}-{counter}"
                    counter += 1
                
                data_source = DataSource.objects.create(
                    name=wc_client.name,
                    source_type='woocommerce',
                    slug=slug,
                    enabled=wc_client.enabled,
                    config=config,
                    created_by=wc_client.created_by if hasattr(wc_client, 'created_by') else None,
                    created_at=wc_client.created_at,
                    updated_at=wc_client.updated_at
                )
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Migrated: {wc_client.name} -> DataSource ID: {data_source.id}'
                    )
                )
                migrated_count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Failed to migrate {wc_client.name}: {str(e)}'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nMigration completed!\n'
                f'Migrated: {migrated_count} clients\n'
                f'Skipped: {skipped_count} clients (already existed)\n'
                f'Total processed: {migrated_count + skipped_count}'
            )
        ) 