from django.core.management.base import BaseCommand
from woocommerce.models import ChannelClassification


class Command(BaseCommand):
    help = "Update channel classification rules to fix Paid Search and Referral classifications"

    def handle(self, *args, **options):
        # Clear existing classifications
        ChannelClassification.objects.all().delete()
        
        # Create updated classifications based on Sheet10 analysis
        classifications = [
            # Direct
            {"source": "(direct)", "medium": "typein", "channel": "direct / typein", "channel_type": "Direct"},
            
            # Organic search (SEO)
            {"source": "google", "medium": "organic", "channel": "google / organic", "channel_type": "SEO"},
            {"source": "bing", "medium": "organic", "channel": "bing / organic", "channel_type": "SEO"},
            {"source": "duckduckgo.com", "medium": "referral", "channel": "duckduckgo / organic", "channel_type": "SEO"},
            
            # Paid search (CRITICAL FIX: google + utm = Paid Search)
            {"source": "google", "medium": "utm", "channel": "google / utm", "channel_type": "Paid Search"},
            {"source": "google", "medium": "cpc", "channel": "google / cpc", "channel_type": "Paid Search"},
            {"source": "google", "medium": "ppc", "channel": "google / ppc", "channel_type": "Paid Search"},
            {"source": "bing", "medium": "cpc", "channel": "bing / cpc", "channel_type": "Paid Search"},
            
            # Referrals (CRITICAL FIX: Proper referral classification)
            {"source": "trustpilot", "medium": "utm", "channel": "trustpilot / utm", "channel_type": "Referral"},
            {"source": "trustpilot", "medium": "referral", "channel": "trustpilot / referral", "channel_type": "Referral"},
            {"source": "bing.com", "medium": "referral", "channel": "bing / referral", "channel_type": "Referral"},
            {"source": "dk.search.yahoo.com", "medium": "referral", "channel": "yahoo / referral", "channel_type": "Referral"},
            
            # ChatGPT
            {"source": "chatgpt.com", "medium": "utm", "channel": "chatgpt / utm", "channel_type": "ChatGpt"},
            {"source": "chatgpt", "medium": "referral", "channel": "chatgpt / referral", "channel_type": "ChatGpt"},
            
            # Handle malformed data
            {"source": "google,google", "medium": "utm", "channel": "google,google / utm", "channel_type": "ChannelNotFound"},
        ]
        
        created_count = 0
        for classification in classifications:
            obj, created = ChannelClassification.objects.get_or_create(
                source=classification['source'],
                medium=classification['medium'],
                defaults={
                    'channel': classification['channel'],
                    'channel_type': classification['channel_type']
                }
            )
            if created:
                created_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'✅ Updated channel classifications: {created_count} new rules created')
        )
        
        # Display the critical fixes
        self.stdout.write("\n🔧 Critical Fixes Applied:")
        self.stdout.write("✅ google + utm → Paid Search (was missing)")
        self.stdout.write("✅ dk.search.yahoo.com + referral → Referral (was Direct)")
        self.stdout.write("✅ trustpilot + utm → Referral (was Direct)")
        self.stdout.write("✅ google,google + utm → ChannelNotFound (malformed data)")
        
        # Show summary
        total_rules = ChannelClassification.objects.count()
        paid_search_rules = ChannelClassification.objects.filter(channel_type='Paid Search').count()
        referral_rules = ChannelClassification.objects.filter(channel_type__in=['Referral', 'Referal']).count()
        
        self.stdout.write(f"\n📊 Summary:")
        self.stdout.write(f"   Total classification rules: {total_rules}")
        self.stdout.write(f"   Paid Search rules: {paid_search_rules}")
        self.stdout.write(f"   Referral rules: {referral_rules}")
