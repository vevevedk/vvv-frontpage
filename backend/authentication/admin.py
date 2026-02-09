from django.contrib import admin
from .models import Token, Invite, LoginEvent


@admin.register(Invite)
class InviteAdmin(admin.ModelAdmin):
    list_display = ('email', 'status', 'company', 'role', 'invited_by', 'created_at', 'expires_at')
    list_filter = ('status', 'role')
    search_fields = ('email',)
    readonly_fields = ('token', 'created_at', 'updated_at')


@admin.register(LoginEvent)
class LoginEventAdmin(admin.ModelAdmin):
    list_display = ('user', 'timestamp', 'ip_address', 'success')
    list_filter = ('success',)
    search_fields = ('user__email', 'ip_address')
    readonly_fields = ('timestamp',)


@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token_type', 'created_at', 'expires_at', 'is_blacklisted')
    list_filter = ('token_type', 'is_blacklisted')
