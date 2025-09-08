from django.db import models
from django.utils import timezone
from users.models import User

# Create your models here.

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
