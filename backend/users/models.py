from django.contrib.auth.models import AbstractUser
from django.db import models
import json

class Agency(models.Model):
    """Agency model - can be Veveve (super agency) or client agencies"""
    name = models.CharField(max_length=255)
    is_super_agency = models.BooleanField(default=False)  # True for Veveve
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Agency'
        verbose_name_plural = 'Agencies'

    def __str__(self):
        return f"{self.name} {'(Super Agency)' if self.is_super_agency else ''}"

class Company(models.Model):
    """Company model - can be direct clients of Veveve or clients of other agencies"""
    name = models.CharField(max_length=255)
    agency = models.ForeignKey(Agency, null=True, blank=True, on_delete=models.CASCADE, related_name='companies')
    address = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    currency_code = models.CharField(max_length=3, default='USD', help_text='ISO 4217 code, e.g., USD, EUR, DKK')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Company'
        verbose_name_plural = 'Companies'

    def __str__(self):
        return f"{self.name} ({self.agency.name})"

class Account(models.Model):
    """Business accounts (e.g., Porsa, Dupskoshoppine) that can have multiple platform configurations"""
    name = models.CharField(max_length=255)
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='accounts')
    description = models.TextField(blank=True, help_text="Optional description of this account")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'

    def __str__(self):
        return f"{self.name} - {self.company.name}"

class AccountConfiguration(models.Model):
    """Configuration for a specific platform within an account"""
    CONFIG_TYPES = [
        ('woocommerce', 'WooCommerce'),
        ('google_ads', 'Google Ads'),
        ('google_analytics', 'Google Analytics'),
        ('google_search_console', 'Google Search Console'),
        ('facebook_ads', 'Facebook Ads'),
        ('linkedin_ads', 'LinkedIn Ads'),
        ('tiktok_ads', 'TikTok Ads'),
        ('shopify', 'Shopify'),
        ('other', 'Other'),
    ]
    
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='configurations')
    config_type = models.CharField(max_length=50, choices=CONFIG_TYPES, default='other')
    name = models.CharField(max_length=255, default='Default Configuration', help_text="Name for this configuration (e.g., 'Main Store', 'Ads Account')")
    config_data = models.JSONField(default=dict, help_text="Stores configuration data like API keys, URLs, etc.")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Account Configuration'
        verbose_name_plural = 'Account Configurations'
        unique_together = ['account', 'config_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_config_type_display()}) - {self.account.name}"

    def get_config(self, key, default=None):
        """Get a configuration value by key"""
        return self.config_data.get(key, default)

    def set_config(self, key, value):
        """Set a configuration value by key"""
        self.config_data[key] = value
        self.save()

    def get_woocommerce_config(self):
        """Get WooCommerce specific configuration"""
        if self.config_type != 'woocommerce':
            return None
        return {
            'store_url': self.get_config('store_url'),
            'consumer_key': self.get_config('consumer_key'),
            'consumer_secret': self.get_config('consumer_secret'),
            'timezone': self.get_config('timezone', 'UTC'),
            'currency_code': self.get_config('currency_code', self.get_config('currency', 'USD')),
        }

    def get_google_ads_config(self):
        """Get Google Ads specific configuration"""
        if self.config_type != 'google_ads':
            return None
        return {
            'customer_id': self.get_config('customer_id'),
            'developer_token': self.get_config('developer_token'),
            'client_id': self.get_config('client_id'),
            'client_secret': self.get_config('client_secret'),
            'refresh_token': self.get_config('refresh_token'),
        }

    def get_google_analytics_config(self):
        """Get Google Analytics specific configuration"""
        if self.config_type != 'google_analytics':
            return None
        return {
            'property_id': self.get_config('property_id'),
            'view_id': self.get_config('view_id'),
            'client_id': self.get_config('client_id'),
            'client_secret': self.get_config('client_secret'),
            'refresh_token': self.get_config('refresh_token'),
        }

    def get_google_search_console_config(self):
        """Get Google Search Console specific configuration"""
        if self.config_type != 'google_search_console':
            return None
        return {
            'site_url': self.get_config('site_url'),
            'client_id': self.get_config('client_id'),
            'client_secret': self.get_config('client_secret'),
            'refresh_token': self.get_config('refresh_token'),
        }

class User(AbstractUser):
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrator'),  # Veveve admin
        ('agency_admin', 'Agency Administrator'),  # Agency admin
        ('agency_user', 'Agency User'),  # Agency employee
        ('company_admin', 'Company Administrator'),  # Company admin
        ('company_user', 'Company User'),  # Company employee
    ]

    agency = models.ForeignKey(Agency, null=True, on_delete=models.SET_NULL, related_name='users')
    company = models.ForeignKey(Company, null=True, on_delete=models.SET_NULL, related_name='users')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='company_user')
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=False)
    # Company access control fields
    access_all_companies = models.BooleanField(default=True, help_text="If True, user has access to all companies in their agency")
    accessible_companies = models.ManyToManyField(Company, blank=True, related_name='accessible_users', help_text="Companies this user has access to when access_all_companies is False")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    def has_full_access(self):
        """Check if user has full access (Veveve super admin)"""
        return self.role == 'super_admin' and self.agency and self.agency.is_super_agency

    def can_access_agency(self, agency):
        """Check if user can access a specific agency"""
        if self.role == 'super_admin':
            return True
        return self.agency == agency

    def can_access_company(self, company):
        """Check if user can access a specific company"""
        if self.role == 'super_admin':
            return True
        if self.role in ['agency_admin', 'agency_user']:
            return self.agency == company.agency
        if self.role in ['company_admin', 'company_user']:
            if self.access_all_companies:
                return self.agency == company.agency
            else:
                return company in self.accessible_companies.all()
        return False

    def can_access_account(self, account):
        """Check if user can access a specific account"""
        return self.can_access_company(account.company)
