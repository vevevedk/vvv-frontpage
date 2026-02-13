#!/usr/bin/env python3
"""
Fix misclassified channel types in production database
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.api.settings.dev')
django.setup()

from backend.woocommerce.models import ChannelClassification

def fix_misclassified_channels():
    """Add missing channel classification rules"""
    print("🔧 Fixing misclassified channel types...")
    
    # Additional rules needed based on the CSV analysis
    additional_rules = [
        # Bing.com referrals - should be Direct or Bing
        {"source": "bing.com", "medium": "referral", "channel": "bing.com / referral", "channel_type": "Direct"},  # Keep as Direct for now
        {"source": "bing.com", "medium": "referral", "channel": "bing.com / referral", "channel_type": "Direct"},  # Already exists
        
        # Facebook referrals - should be Social
        {"source": "m.facebook.com", "medium": "referral", "channel": "m.facebook.com / referral", "channel_type": "Organic Social"},
        {"source": "facebook.com", "medium": "referral", "channel": "facebook.com / referral", "channel_type": "Organic Social"},
        {"source": "www.facebook.com", "medium": "referral", "channel": "www.facebook.com / referral", "channel_type": "Organic Social"},
        
        # Yahoo referrals - should be SEO or Direct
        {"source": "dk.search.yahoo.com", "medium": "referral", "channel": "dk.search.yahoo.com / referral", "channel_type": "Direct"},  # Keep as Direct
        
        # Gmail referrals - should be Direct
        {"source": "com.google.android.gm", "medium": "referral", "channel": "com.google.android.gm / referral", "channel_type": "Direct"},
        
        # Payment gateway - should remain as Direct (payment flow)
        {"source": "checkout.dibspayment.eu", "medium": "referral", "channel": "checkout.dibspayment.eu / referral", "channel_type": "Direct"},
        
        # Trustpilot already correct - keep it
    ]
    
    created_count = 0
    for rule in additional_rules:
        obj, created = ChannelClassification.objects.get_or_create(
            source=rule['source'],
            medium=rule['medium'],
            defaults={
                'source_medium': rule.get('channel', f"{rule['source']}/{rule['medium']}"),
                'channel': rule.get('channel', f"{rule['source']} / {rule['medium']}"),
                'channel_type': rule['channel_type'],
                'is_active': True
            }
        )
        if created:
            created_count += 1
            print(f"✅ Created: {rule['source']} + {rule['medium']} → {rule['channel_type']}")
    
    print(f"\n✅ Created {created_count} new classification rules")
    
    # Verify all rules
    total_rules = ChannelClassification.objects.count()
    paid_search_rules = ChannelClassification.objects.filter(channel_type='Paid Search').count()
    
    print(f"\n📊 Summary:")
    print(f"   Total classification rules: {total_rules}")
    print(f"   Paid Search rules: {paid_search_rules}")

if __name__ == "__main__":
    fix_misclassified_channels()












