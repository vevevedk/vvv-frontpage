from django.contrib import admin
from .models import ChannelClassification

@admin.register(ChannelClassification)
class ChannelClassificationAdmin(admin.ModelAdmin):
    list_display = ['source', 'medium', 'source_medium', 'channel_type', 'channel', 'is_active', 'created_at']
    list_filter = ['channel_type', 'is_active', 'created_at']
    search_fields = ['source', 'medium', 'channel_type']
    list_editable = ['is_active']
    ordering = ['channel_type', 'source']
    
    fieldsets = (
        ('Traffic Source', {
            'fields': ('source', 'medium', 'source_medium')
        }),
        ('Classification', {
            'fields': ('channel', 'channel_type')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    readonly_fields = ['created_at', 'updated_at']


















