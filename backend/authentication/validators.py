from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _
import re

class PasswordValidator:
    """
    Custom password validator that enforces:
    - Minimum length of 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    """
    def __init__(self, min_length=8):
        self.min_length = min_length

    def validate(self, password):
        if len(password) < self.min_length:
            raise ValidationError(
                _("Password must be at least %(min_length)d characters long."),
                code='password_too_short',
                params={'min_length': self.min_length},
            )

        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Password must contain at least one uppercase letter."),
                code='password_no_upper',
            )

        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("Password must contain at least one lowercase letter."),
                code='password_no_lower',
            )

        if not re.search(r'[0-9]', password):
            raise ValidationError(
                _("Password must contain at least one number."),
                code='password_no_number',
            )

    def get_help_text(self):
        return _(
            "Your password must be at least %(min_length)d characters long and contain "
            "at least one uppercase letter, one lowercase letter, and one number."
        ) % {'min_length': self.min_length} 