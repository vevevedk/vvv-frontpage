from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()
from django.utils import timezone
import json


class WooCommerceJob(models.Model):
    """Scheduled WooCommerce sync jobs"""
    JOB_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    JOB_TYPE_CHOICES = [
        ('daily_sync', 'Daily Sync'),
        ('historical_backfill', 'Historical Backfill'),
        ('manual_sync', 'Manual Sync'),
    ]
    
    client_name = models.CharField(max_length=255, default='Unknown')  # Store account name instead of foreign key
    job_type = models.CharField(max_length=20, choices=JOB_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=JOB_STATUS_CHOICES, default='pending')
    scheduled_at = models.DateTimeField()
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    orders_processed = models.IntegerField(default=0)
    orders_created = models.IntegerField(default=0)
    orders_updated = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'woocommerce_jobs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.client_name} - {self.get_job_type_display()} ({self.status})"


class WooCommerceOrder(models.Model):
    """WooCommerce order data"""
    client_name = models.CharField(max_length=255, default='Unknown')  # Store account name instead of foreign key
    order_id = models.CharField(max_length=50)
    order_number = models.CharField(max_length=50)
    order_date = models.DateTimeField()  # order_date from export
    paid_date = models.DateTimeField(null=True, blank=True)  # paid_date from export
    status = models.CharField(max_length=50)
    
    # Financial fields
    shipping_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_tax_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fee_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fee_tax_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cart_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    order_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    order_total = models.DecimalField(max_digits=10, decimal_places=2)  # order_total from export
    order_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    order_key = models.CharField(max_length=100, null=True, blank=True)
    order_currency = models.CharField(max_length=3, default='USD')
    
    # Payment details
    payment_method = models.CharField(max_length=100, null=True, blank=True)
    payment_method_title = models.CharField(max_length=100, null=True, blank=True)
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    
    # Customer analytics
    customer_ip_address = models.GenericIPAddressField(null=True, blank=True)
    customer_user_agent = models.TextField(null=True, blank=True)
    
    # Shipping details
    shipping_method = models.CharField(max_length=100, null=True, blank=True)
    
    # Customer info
    customer_id = models.CharField(max_length=50, null=True, blank=True)
    customer_user = models.CharField(max_length=100, null=True, blank=True)
    
    # Billing address fields (aliased to existing database columns)
    billing_first_name = models.CharField(max_length=100, null=True, blank=True, db_column='customer_first_name')
    billing_last_name = models.CharField(max_length=100, null=True, blank=True, db_column='customer_last_name')
    billing_company = models.CharField(max_length=100, null=True, blank=True)
    billing_email = models.EmailField(null=True, blank=True, db_column='customer_email')
    billing_phone = models.CharField(max_length=20, null=True, blank=True)
    billing_address_1 = models.CharField(max_length=255, null=True, blank=True)
    billing_address_2 = models.CharField(max_length=255, null=True, blank=True)
    billing_postcode = models.CharField(max_length=20, null=True, blank=True)
    billing_city = models.CharField(max_length=100, null=True, blank=True)
    billing_state = models.CharField(max_length=100, null=True, blank=True)
    billing_country = models.CharField(max_length=100, null=True, blank=True)
    
    # Detailed shipping address (using existing database fields)
    shipping_first_name = models.CharField(max_length=100, null=True, blank=True)
    shipping_last_name = models.CharField(max_length=100, null=True, blank=True)
    shipping_company = models.CharField(max_length=100, null=True, blank=True)
    shipping_phone = models.CharField(max_length=20, null=True, blank=True)
    shipping_address_1 = models.CharField(max_length=255, null=True, blank=True)
    shipping_address_2 = models.CharField(max_length=255, blank=True)
    shipping_postcode = models.CharField(max_length=20, null=True, blank=True)
    shipping_city = models.CharField(max_length=100, null=True, blank=True)
    shipping_state = models.CharField(max_length=100, null=True, blank=True)
    shipping_country = models.CharField(max_length=100, null=True, blank=True)
    
    # Customer notes and import key
    customer_note = models.TextField(null=True, blank=True)
    wt_import_key = models.CharField(max_length=100, null=True, blank=True)
    
    # Legacy fields for backward compatibility
    total = models.DecimalField(max_digits=10, decimal_places=2, db_column='total')  # Keep for backward compatibility
    currency = models.CharField(max_length=3, default='USD', db_column='currency')  # Keep for backward compatibility
    billing_address = models.JSONField(default=dict)  # Keep for backward compatibility
    shipping_address = models.JSONField(default=dict)  # Keep for backward compatibility
    date_created = models.DateTimeField(db_column='date_created')  # Keep for backward compatibility
    date_modified = models.DateTimeField(db_column='date_modified')  # Keep for backward compatibility
    date_completed = models.DateTimeField(null=True, blank=True, db_column='date_completed')  # Keep for backward compatibility
    
    # Customer insights
    is_new_customer = models.BooleanField(default=False)
    
    # Attribution data (from meta fields)
    attribution_device_type = models.CharField(max_length=50, null=True, blank=True)
    attribution_referrer = models.URLField(null=True, blank=True)
    attribution_session_count = models.IntegerField(null=True, blank=True)
    attribution_session_entry = models.CharField(max_length=255, null=True, blank=True)
    attribution_session_pages = models.IntegerField(null=True, blank=True)
    attribution_session_start_time = models.DateTimeField(null=True, blank=True)
    attribution_source_type = models.CharField(max_length=50, null=True, blank=True)
    attribution_user_agent = models.TextField(null=True, blank=True)
    attribution_utm_source = models.CharField(max_length=255, null=True, blank=True)
    
    raw_data = models.JSONField(default=dict)  # Store complete WooCommerce response
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'woocommerce_orders'
        unique_together = ['client_name', 'order_id']
        indexes = [
            models.Index(fields=['client_name', 'order_date']),
            models.Index(fields=['status']),
            models.Index(fields=['billing_email']),
            models.Index(fields=['attribution_utm_source']),
            models.Index(fields=['order_date']),
        ]
    
    def __str__(self):
        return f"{self.client_name} - Order #{self.order_number}"


class WooCommerceOrderItem(models.Model):
    """Individual line items for WooCommerce orders"""
    order = models.ForeignKey(WooCommerceOrder, on_delete=models.CASCADE, related_name='items')
    product_id = models.CharField(max_length=50)
    product_name = models.CharField(max_length=255)
    product_sku = models.CharField(max_length=100, null=True, blank=True)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Product Item X Subtotal
    tax_class = models.CharField(max_length=50, null=True, blank=True)
    tax_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    meta_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'woocommerce_order_items'
    
    def __str__(self):
        return f"{self.order.order_number} - {self.product_name}"


class WooCommerceSyncLog(models.Model):
    """Log of sync operations and errors"""
    LOG_LEVEL_CHOICES = [
        ('INFO', 'Info'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('DEBUG', 'Debug'),
    ]
    
    client_name = models.CharField(max_length=255, null=True, blank=True)  # Store account name instead of foreign key
    job = models.ForeignKey(WooCommerceJob, on_delete=models.CASCADE, null=True, blank=True)
    level = models.CharField(max_length=10, choices=LOG_LEVEL_CHOICES, default='INFO')
    message = models.TextField()
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'woocommerce_sync_logs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.client_name if self.client_name else 'System'} - {self.level}: {self.message[:50]}" 


class ChannelClassification(models.Model):
    """Model for classifying traffic sources into marketing channels"""
    
    CHANNEL_TYPE_CHOICES = [
        ('Direct', 'Direct'),
        ('SEO', 'SEO'),
        ('Organic Social', 'Organic Social'),
        ('Email', 'Email'),
        ('Referal', 'Referal'),
        ('ChatGpt', 'ChatGpt'),
        ('Paid Social', 'Paid Social'),
        ('Paid Search', 'Paid Search'),
        ('Organic Search', 'Organic Search'),
        ('Test', 'Test'),
    ]
    
    source = models.CharField(max_length=255, help_text="Traffic source (e.g., google, (direct), fb)")
    medium = models.CharField(max_length=255, help_text="Traffic medium (e.g., organic, utm, referral)")
    source_medium = models.CharField(max_length=255, help_text="Combined source/medium (e.g., google/organic)")
    channel = models.CharField(max_length=255, help_text="Channel name (e.g., google / organic)")
    channel_type = models.CharField(max_length=50, choices=CHANNEL_TYPE_CHOICES, help_text="Channel category")
    is_active = models.BooleanField(default=True, help_text="Whether this classification rule is active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'woocommerce_channel_classifications'
        unique_together = ['source', 'medium']
        ordering = ['channel_type', 'source']
        verbose_name = 'Channel Classification'
        verbose_name_plural = 'Channel Classifications'
    
    def __str__(self):
        return f"{self.source}/{self.medium} → {self.channel_type}"
    
    def save(self, *args, **kwargs):
        # Auto-generate source_medium if not provided
        if not self.source_medium:
            self.source_medium = f"{self.source}/{self.medium}"
        super().save(*args, **kwargs) 