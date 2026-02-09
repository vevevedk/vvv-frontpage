import uuid
from django.db import models
from django.utils import timezone
from users.models import User, Company


class Invite(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    ROLE_CHOICES = User.ROLE_CHOICES

    email = models.EmailField()
    company = models.ForeignKey(Company, null=True, blank=True, on_delete=models.SET_NULL, related_name='invites')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='company_user')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invites')
    accepted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='accepted_invite')
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'auth_invites'
        indexes = [
            models.Index(fields=['email', 'status']),
            models.Index(fields=['token']),
        ]

    def __str__(self):
        return f"Invite {self.email} ({self.status})"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at


class LoginEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_events')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')
    success = models.BooleanField(default=True)

    class Meta:
        db_table = 'auth_login_events'
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        status = 'OK' if self.success else 'FAIL'
        return f"{self.user.email} [{status}] {self.timestamp}"


class Token(models.Model):
    TOKEN_TYPES = [
        ('access', 'Access Token'),
        ('refresh', 'Refresh Token'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.TextField(unique=True)
    token_type = models.CharField(max_length=10, choices=TOKEN_TYPES, default='access')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_blacklisted = models.BooleanField(default=False)
    parent_token = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, related_name='child_tokens')

    class Meta:
        db_table = 'auth_tokens'
        indexes = [
            models.Index(fields=['user', 'token_type']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['is_blacklisted']),
        ]

    def __str__(self):
        return f"{self.token_type} token for {self.user.email}"

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at

    def blacklist(self):
        """Mark this token and all its child tokens as blacklisted."""
        self.is_blacklisted = True
        self.save()
        # Also blacklist any child tokens
        for child in self.child_tokens.all():
            child.blacklist()
