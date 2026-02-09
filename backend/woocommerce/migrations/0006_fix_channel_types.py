"""
Data migration: normalise channel_type values in ChannelClassification.

- 'Referal'        → 'Referral'
- 'ChatGpt'        → 'ChatGPT'
- 'ChannelNotFound' → 'Direct'   (reclassify as Direct)
"""

from django.db import migrations


def fix_channel_types(apps, schema_editor):
    ChannelClassification = apps.get_model('woocommerce', 'ChannelClassification')

    ChannelClassification.objects.filter(channel_type='Referal').update(channel_type='Referral')
    ChannelClassification.objects.filter(channel_type='ChatGpt').update(channel_type='ChatGPT')
    ChannelClassification.objects.filter(channel_type='ChannelNotFound').update(channel_type='Direct')


def reverse_fix(apps, schema_editor):
    # Best-effort reverse; exact original values are not preserved.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('woocommerce', '0005_add_is_new_customer'),
    ]

    operations = [
        migrations.RunPython(fix_channel_types, reverse_fix),
    ]
