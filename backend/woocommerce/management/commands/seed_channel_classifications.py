from django.core.management.base import BaseCommand

from woocommerce.models import ChannelClassification


class Command(BaseCommand):
    help = "Seed default ChannelClassification rules for common sources/mediums"

    def handle(self, *args, **options):
        seed_rules = [
            # Direct
            {"source": "(direct)", "medium": "typein", "channel": "direct / typein", "channel_type": "Direct"},

            # Organic search (SEO)
            {"source": "google", "medium": "organic", "channel": "google / organic", "channel_type": "SEO"},
            {"source": "bing", "medium": "organic", "channel": "bing / organic", "channel_type": "SEO"},
            {"source": "yahoo", "medium": "organic", "channel": "yahoo / organic", "channel_type": "SEO"},

            # Paid search
            {"source": "google", "medium": "cpc", "channel": "google / cpc", "channel_type": "Paid Search"},
            {"source": "google", "medium": "ppc", "channel": "google / ppc", "channel_type": "Paid Search"},
            {"source": "google", "medium": "paid", "channel": "google / paid", "channel_type": "Paid Search"},
            {"source": "bing", "medium": "cpc", "channel": "bing / cpc", "channel_type": "Paid Search"},
            {"source": "bing", "medium": "ppc", "channel": "bing / ppc", "channel_type": "Paid Search"},

            # Referrals / review sources
            {"source": "trustpilot", "medium": "referral", "channel": "trustpilot / referral", "channel_type": "Referal"},
            {"source": "trustpilot", "medium": "utm", "channel": "trustpilot / utm", "channel_type": "Referal"},

            # ChatGPT referrals
            {"source": "chatgpt", "medium": "referral", "channel": "chatgpt / referral", "channel_type": "ChatGpt"},
            {"source": "chatgpt", "medium": "utm", "channel": "chatgpt / utm", "channel_type": "ChatGpt"},
            {"source": "openai", "medium": "referral", "channel": "openai / referral", "channel_type": "ChatGpt"},
            {"source": "openai", "medium": "utm", "channel": "openai / utm", "channel_type": "ChatGpt"},
        ]

        created_count = 0
        updated_count = 0

        for rule in seed_rules:
            obj, created = ChannelClassification.objects.get_or_create(
                source=rule["source"],
                medium=rule["medium"],
                defaults={
                    "source_medium": f"{rule['source']}/{rule['medium']}",
                    "channel": rule["channel"],
                    "channel_type": rule["channel_type"],
                    "is_active": True,
                },
            )
            if not created:
                # Keep it idempotent but refresh important fields
                changed = False
                if obj.channel != rule["channel"]:
                    obj.channel = rule["channel"]
                    changed = True
                if obj.channel_type != rule["channel_type"]:
                    obj.channel_type = rule["channel_type"]
                    changed = True
                if not obj.is_active:
                    obj.is_active = True
                    changed = True
                if not obj.source_medium:
                    obj.source_medium = f"{rule['source']}/{rule['medium']}"
                    changed = True
                if changed:
                    obj.save()
                    updated_count += 1
            else:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Channel classification rules seeded. created={created_count}, updated={updated_count}"
            )
        )


