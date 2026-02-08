from django.db import models
from users.models import AccountConfiguration


class GA4Daily(models.Model):
    """Daily GA4 analytics data, one row per dimension combination per day."""

    account_configuration = models.ForeignKey(
        AccountConfiguration,
        on_delete=models.CASCADE,
        related_name='ga4_daily_rows',
    )

    # Dimensions
    date = models.DateField()
    source = models.CharField(max_length=255, default='')
    medium = models.CharField(max_length=255, default='')
    campaign = models.CharField(max_length=255, default='')
    device_category = models.CharField(max_length=50, default='')
    country = models.CharField(max_length=100, default='')

    # Metrics
    sessions = models.IntegerField(default=0)
    total_users = models.IntegerField(default=0)
    new_users = models.IntegerField(default=0)
    engaged_sessions = models.IntegerField(default=0)
    conversions = models.IntegerField(default=0)
    purchase_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    engagement_rate = models.FloatField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ga4_daily'
        ordering = ['-date']
        constraints = [
            models.UniqueConstraint(
                fields=[
                    'account_configuration',
                    'date',
                    'source',
                    'medium',
                    'campaign',
                    'device_category',
                    'country',
                ],
                name='ga4_daily_unique_dims',
            ),
        ]
        indexes = [
            models.Index(fields=['account_configuration', 'date'], name='ga4_daily_config_date'),
            models.Index(fields=['date'], name='ga4_daily_date'),
        ]

    def __str__(self):
        return f'{self.date} | {self.source}/{self.medium} | {self.account_configuration_id}'

    def save(self, *args, **kwargs):
        # Normalize NULLs to empty string so the unique constraint works
        for field in ('source', 'medium', 'campaign', 'device_category', 'country'):
            if getattr(self, field) is None:
                setattr(self, field, '')
        super().save(*args, **kwargs)
