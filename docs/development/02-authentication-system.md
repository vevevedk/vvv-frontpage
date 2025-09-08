# Authentication System Development Plan

## Models

### User Model
```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    company = models.ForeignKey('Company', null=True, on_delete=models.SET_NULL)
    role = models.CharField(max_length=50)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email
```

### Token Model
```python
# apps/authentication/models.py
from django.db import models
from django.utils import timezone
from datetime import timedelta

class Token(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'tokens'
        verbose_name = 'Token'
        verbose_name_plural = 'Tokens'

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=1)
        super().save(*args, **kwargs)
```

## Implementation Steps

### 1. Authentication Views

#### Login View
```python
# apps/authentication/views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from .serializers import LoginSerializer
from .utils import generate_token

class LoginView(APIView):
    permission_classes = []
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = authenticate(
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )
            if user:
                token = generate_token(user)
                return Response({
                    'token': token.token,
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'role': user.role
                    }
                })
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

### 2. Authentication Middleware

```python
# apps/authentication/middleware.py
from django.utils.functional import SimpleLazyObject
from .models import Token

class TokenAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.user = SimpleLazyObject(lambda: self.get_user(request))
        return self.get_response(request)

    def get_user(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        try:
            token_key = auth_header.split(' ')[1]
            token = Token.objects.get(token=token_key, is_active=True)
            return token.user
        except (Token.DoesNotExist, IndexError):
            return None
```

### 3. Authentication Utilities

```python
# apps/authentication/utils.py
import jwt
from datetime import datetime, timedelta
from django.conf import settings
from .models import Token

def generate_token(user):
    # Invalidate existing tokens
    Token.objects.filter(user=user, is_active=True).update(is_active=False)
    
    # Generate new token
    token = Token.objects.create(
        user=user,
        token=jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(days=1)
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        )
    )
    return token
```

## Testing Plan

### 1. Unit Tests
- Test user model
- Test token generation
- Test authentication middleware
- Test login view

### 2. Integration Tests
- Test complete login flow
- Test token validation
- Test protected routes
- Test token expiration

## Security Considerations

### 1. Token Security
- Implement token expiration
- Add token refresh mechanism
- Secure token storage
- Implement token revocation

### 2. Password Security
- Enforce password complexity
- Implement password reset flow
- Add rate limiting for login attempts
- Secure password storage

## API Endpoints

### 1. Authentication
- POST /api/auth/login/
- POST /api/auth/logout/
- POST /api/auth/refresh/
- POST /api/auth/reset-password/

### 2. User Management
- GET /api/users/me/
- PUT /api/users/me/
- POST /api/users/change-password/

## Next Steps
1. Implement user registration
2. Add password reset functionality
3. Set up email notifications
4. Implement role-based access control 