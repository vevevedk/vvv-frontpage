from django.core.management.base import BaseCommand
from woocommerce.models import ChannelClassification


class Command(BaseCommand):
    help = 'Populate database with default channel classification rules'

    def handle(self, *args, **options):
        default_classifications = [
            {
                'source': '(direct)',
                'medium': 'typein',
                'source_medium': '(direct)/typein',
                'channel': 'direct / none',
                'channel_type': 'Direct'
            },
            {
                'source': 'google',
                'medium': 'organic',
                'source_medium': 'google/organic',
                'channel': 'google / organic',
                'channel_type': 'SEO'
            },
            {
                'source': 'l.instagram.com',
                'medium': 'referral',
                'source_medium': 'l.instagram.com/referral',
                'channel': 'Instagram / organic',
                'channel_type': 'Organic Social'
            },
            {
                'source': 'mailpoet',
                'medium': 'utm',
                'source_medium': 'mailpoet/utm',
                'channel': 'email / organic',
                'channel_type': 'Email'
            },
            {
                'source': 'Klaviyo',
                'medium': 'utm',
                'source_medium': 'Klaviyo/utm',
                'channel': 'email / organic',
                'channel_type': 'Email'
            },
            {
                'source': 'duckduckgo.com',
                'medium': 'referral',
                'source_medium': 'duckduckgo.com/referral',
                'channel': 'duckduckgo / organic',
                'channel_type': 'SEO'
            },
            {
                'source': 'app.wonnda.com',
                'medium': 'referral',
                'source_medium': 'app.wonnda.com/referral',
                'channel': 'wonnda / referal',
                'channel_type': 'Referal'
            },
            {
                'source': 'chatgpt.com',
                'medium': 'referral',
                'source_medium': 'chatgpt.com/referral',
                'channel': 'chatgpt / referal',
                'channel_type': 'ChatGpt'
            },
            {
                'source': 'fb',
                'medium': 'utm',
                'source_medium': 'fb/utm',
                'channel': 'facebook / paid',
                'channel_type': 'Paid Social'
            },
            {
                'source': 'ig',
                'medium': 'utm',
                'source_medium': 'ig/utm',
                'channel': 'instagram / paid',
                'channel_type': 'Paid Social'
            },
            {
                'source': 'tagassistant.google.com',
                'medium': 'referral',
                'source_medium': 'tagassistant.google.com/referral',
                'channel': 'tagmanager /. test',
                'channel_type': 'Test'
            },
            {
                'source': 'chatgpt.com',
                'medium': 'utm',
                'source_medium': 'chatgpt.com/utm',
                'channel': 'chatgpt / utm',
                'channel_type': 'ChatGpt'
            },
            {
                'source': 'google',
                'medium': 'utm',
                'source_medium': 'google/utm',
                'channel': 'google / utm',
                'channel_type': 'Paid Search'
            },
            {
                'source': 'bing.com',
                'medium': 'referral',
                'source_medium': 'bing.com/referral',
                'channel': 'bing / referal',
                'channel_type': 'Organic Search'
            },
            {
                'source': 'crmcredorax.lightning.force.com',
                'medium': 'referral',
                'source_medium': 'crmcredorax.lightning.force.com/referral',
                'channel': 'test / test',
                'channel_type': 'Test'
            }
        ]

        created_count = 0
        updated_count = 0

        for classification_data in default_classifications:
            classification, created = ChannelClassification.objects.get_or_create(
                source=classification_data['source'],
                medium=classification_data['medium'],
                defaults={
                    'source_medium': classification_data['source_medium'],
                    'channel': classification_data['channel'],
                    'channel_type': classification_data['channel_type'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Created: {classification.source}/{classification.medium} → {classification.channel_type}'
                    )
                )
            else:
                # Update existing classification if needed
                if (classification.source_medium != classification_data['source_medium'] or
                    classification.channel != classification_data['channel'] or
                    classification.channel_type != classification_data['channel_type']):
                    
                    classification.source_medium = classification_data['source_medium']
                    classification.channel = classification_data['channel']
                    classification.channel_type = classification_data['channel_type']
                    classification.save()
                    updated_count += 1
                    
                    self.stdout.write(
                        self.style.WARNING(
                            f'Updated: {classification.source}/{classification.medium} → {classification.channel_type}'
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nChannel classifications populated successfully!\n'
                f'Created: {created_count}\n'
                f'Updated: {updated_count}\n'
                f'Total: {ChannelClassification.objects.count()}'
            )
        )


























