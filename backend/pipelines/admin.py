from django.contrib import admin
from .models import DataPipeline, PipelineJob, PipelineLog, DataQualityCheck, PipelineAnalytics


@admin.register(DataPipeline)
class DataPipelineAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'account', 'pipeline_type', 'schedule', 'enabled', 
        'created_by', 'created_at'
    ]
    list_filter = [
        'pipeline_type', 'schedule', 'enabled', 'created_at'
    ]
    search_fields = ['name', 'account__name', 'account__company__name']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'account', 'account_configuration', 'pipeline_type')
        }),
        ('Schedule', {
            'fields': ('schedule', 'schedule_config')
        }),
        ('Configuration', {
            'fields': ('enabled', 'config')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'account', 'account__company', 'account_configuration', 'created_by'
        )


@admin.register(PipelineJob)
class PipelineJobAdmin(admin.ModelAdmin):
    list_display = [
        'pipeline', 'job_type', 'status', 'scheduled_at', 
        'started_at', 'completed_at', 'progress_percentage'
    ]
    list_filter = [
        'job_type', 'status', 'pipeline__pipeline_type', 'created_at'
    ]
    search_fields = [
        'pipeline__name', 'pipeline__account__name', 'error_message'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'progress_percentage'
    ]
    
    fieldsets = (
        ('Job Information', {
            'fields': ('pipeline', 'job_type', 'status')
        }),
        ('Timing', {
            'fields': ('scheduled_at', 'started_at', 'completed_at')
        }),
        ('Progress', {
            'fields': (
                'total_items', 'processed_items', 'created_items', 
                'updated_items', 'failed_items', 'progress_percentage'
            )
        }),
        ('Details', {
            'fields': ('error_message', 'parameters')
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'pipeline', 'pipeline__account', 'created_by'
        )


@admin.register(PipelineLog)
class PipelineLogAdmin(admin.ModelAdmin):
    list_display = [
        'pipeline', 'level', 'message', 'created_at'
    ]
    list_filter = [
        'level', 'pipeline__pipeline_type', 'created_at'
    ]
    search_fields = [
        'pipeline__name', 'message', 'details'
    ]
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Log Information', {
            'fields': ('pipeline', 'job', 'level', 'message')
        }),
        ('Details', {
            'fields': ('details',)
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'pipeline', 'pipeline__account', 'job'
        )


@admin.register(DataQualityCheck)
class DataQualityCheckAdmin(admin.ModelAdmin):
    list_display = [
        'pipeline', 'check_type', 'status', 'score', 'created_at'
    ]
    list_filter = [
        'check_type', 'status', 'pipeline__pipeline_type', 'created_at'
    ]
    search_fields = [
        'pipeline__name', 'pipeline__account__name'
    ]
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Quality Check', {
            'fields': ('pipeline', 'check_type', 'status', 'score')
        }),
        ('Details', {
            'fields': ('details',)
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'pipeline', 'pipeline__account'
        )


@admin.register(PipelineAnalytics)
class PipelineAnalyticsAdmin(admin.ModelAdmin):
    list_display = [
        'pipeline', 'date', 'total_jobs', 'successful_jobs', 
        'failed_jobs', 'data_quality_score'
    ]
    list_filter = [
        'pipeline__pipeline_type', 'date', 'created_at'
    ]
    search_fields = [
        'pipeline__name', 'pipeline__account__name'
    ]
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Analytics', {
            'fields': (
                'pipeline', 'date', 'total_jobs', 'successful_jobs', 
                'failed_jobs', 'total_items_processed'
            )
        }),
        ('Metrics', {
            'fields': ('avg_job_duration', 'data_quality_score')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'pipeline', 'pipeline__account'
        )
