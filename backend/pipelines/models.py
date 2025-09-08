from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from users.models import Account, AccountConfiguration
import json

User = get_user_model()


class DataPipeline(models.Model):
    """Data pipeline linked to an account configuration"""
    PIPELINE_TYPE_CHOICES = [
        ('woocommerce', 'WooCommerce'),
        ('google_search_console', 'Google Search Console'),
        ('google_ads', 'Google Ads'),
        ('google_analytics', 'Google Analytics'),
        ('facebook_ads', 'Facebook Ads'),
        ('tiktok_ads', 'TikTok Ads'),
        ('linkedin_ads', 'LinkedIn Ads'),
        ('shopify', 'Shopify'),
    ]
    
    SCHEDULE_CHOICES = [
        ('manual', 'Manual Only'),
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    name = models.CharField(max_length=255, help_text="Pipeline name (e.g., 'Porsa Orders Sync')")
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='pipelines')
    account_configuration = models.ForeignKey(AccountConfiguration, on_delete=models.CASCADE, related_name='pipelines')
    pipeline_type = models.CharField(max_length=50, choices=PIPELINE_TYPE_CHOICES)
    schedule = models.CharField(max_length=20, choices=SCHEDULE_CHOICES, default='manual')
    enabled = models.BooleanField(default=True)
    
    # Schedule configuration
    schedule_config = models.JSONField(default=dict, help_text="Schedule-specific configuration (e.g., time, day of week)")
    
    # Pipeline configuration
    config = models.JSONField(default=dict, help_text="Pipeline-specific configuration")
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pipeline_data_pipelines'
        ordering = ['-created_at']
        unique_together = ['account', 'pipeline_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_pipeline_type_display()}) - {self.account.name}"
    
    @property
    def next_run(self):
        """Calculate next scheduled run based on schedule configuration"""
        if self.schedule == 'manual':
            return None
        # This would be calculated based on schedule_config
        return None


class PipelineJob(models.Model):
    """Pipeline job execution"""
    JOB_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    JOB_TYPE_CHOICES = [
        ('sync', 'Data Sync'),
        ('import', 'Data Import'),
        ('transform', 'Data Transform'),
        ('export', 'Data Export'),
        ('backfill', 'Historical Backfill'),
    ]
    
    pipeline = models.ForeignKey(DataPipeline, on_delete=models.CASCADE, related_name='jobs', null=True, blank=True)
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES, default='sync')
    status = models.CharField(max_length=20, choices=JOB_STATUS_CHOICES, default='pending')
    scheduled_at = models.DateTimeField()
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    # Progress tracking
    total_items = models.IntegerField(default=0)
    processed_items = models.IntegerField(default=0)
    created_items = models.IntegerField(default=0)
    updated_items = models.IntegerField(default=0)
    failed_items = models.IntegerField(default=0)
    
    # Job parameters
    parameters = models.JSONField(default=dict)  # Store job-specific parameters
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pipeline_jobs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.pipeline.name if self.pipeline else 'Unknown'} - {self.get_job_type_display()} ({self.status})"
    
    @property
    def progress_percentage(self):
        if self.total_items == 0:
            return 0
        return min(100, (self.processed_items / self.total_items) * 100)


class PipelineLog(models.Model):
    """Log of pipeline operations and errors"""
    LOG_LEVEL_CHOICES = [
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('DEBUG', 'Debug'),
    ]
    
    pipeline = models.ForeignKey(DataPipeline, on_delete=models.CASCADE, null=True, blank=True)
    job = models.ForeignKey(PipelineJob, on_delete=models.CASCADE, null=True, blank=True)
    level = models.CharField(max_length=10, choices=LOG_LEVEL_CHOICES, default='INFO')
    message = models.TextField()
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'pipeline_logs'
        ordering = ['-created_at']


class DataQualityCheck(models.Model):
    """Data quality monitoring and validation"""
    CHECK_TYPE_CHOICES = [
        ('completeness', 'Data Completeness'),
        ('accuracy', 'Data Accuracy'),
        ('consistency', 'Data Consistency'),
        ('timeliness', 'Data Timeliness'),
        ('validity', 'Data Validity'),
    ]
    
    pipeline = models.ForeignKey(DataPipeline, on_delete=models.CASCADE, null=True, blank=True)
    check_type = models.CharField(max_length=20, choices=CHECK_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=[
        ('passed', 'Passed'),
        ('failed', 'Failed'),
        ('warning', 'Warning'),
    ])
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'pipeline_data_quality_checks'
        ordering = ['-created_at']


class PipelineAnalytics(models.Model):
    """Analytics and metrics for pipeline performance"""
    pipeline = models.ForeignKey(DataPipeline, on_delete=models.CASCADE, null=True, blank=True)
    date = models.DateField()
    total_jobs = models.IntegerField(default=0)
    successful_jobs = models.IntegerField(default=0)
    failed_jobs = models.IntegerField(default=0)
    total_items_processed = models.IntegerField(default=0)
    avg_job_duration = models.DurationField(null=True, blank=True)
    data_quality_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'pipeline_analytics'
        unique_together = ['pipeline', 'date']
        ordering = ['-date']
