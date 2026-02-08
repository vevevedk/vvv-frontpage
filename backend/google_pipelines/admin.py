from django.contrib import admin
from .models import GA4Daily


@admin.register(GA4Daily)
class GA4DailyAdmin(admin.ModelAdmin):
    list_display = [
        'date',
        'account_configuration',
        'source',
        'medium',
        'campaign',
        'device_category',
        'country',
        'sessions',
        'total_users',
        'purchase_revenue',
    ]
    list_filter = [
        'date',
        'device_category',
        'account_configuration',
    ]
    search_fields = [
        'source',
        'medium',
        'campaign',
        'country',
    ]
    date_hierarchy = 'date'
    readonly_fields = ['created_at', 'updated_at']
