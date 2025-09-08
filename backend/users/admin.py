from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Agency, Company, Account, AccountConfiguration

@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_super_agency', 'email', 'website', 'created_at')
    list_filter = ('is_super_agency', 'created_at')
    search_fields = ('name', 'email', 'website')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name',)

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'agency', 'email', 'website', 'created_at')
    list_filter = ('agency', 'created_at')
    search_fields = ('name', 'email', 'website', 'agency__name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name',)

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'is_active', 'created_at')
    list_filter = ('is_active', 'company__agency', 'created_at')
    search_fields = ('name', 'description', 'company__name', 'company__agency__name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('company__name', 'name')

@admin.register(AccountConfiguration)
class AccountConfigurationAdmin(admin.ModelAdmin):
    list_display = ('name', 'account', 'config_type', 'is_active', 'created_at')
    list_filter = ('config_type', 'is_active', 'account__company__agency', 'created_at')
    search_fields = ('name', 'account__name', 'account__company__name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('account__name', 'config_type', 'name')

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'agency', 'company', 'is_active', 'email_verified')
    list_filter = ('role', 'agency', 'is_active', 'email_verified', 'created_at')
    search_fields = ('email', 'first_name', 'last_name', 'agency__name', 'company__name')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone')}),
        ('Permissions', {
            'fields': ('is_active', 'email_verified', 'role', 'agency', 'company', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'first_name', 'last_name', 'role', 'agency', 'company'),
        }),
    )
