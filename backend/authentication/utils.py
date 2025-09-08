import jwt
from datetime import datetime, timedelta
from django.conf import settings
from .models import Token
import secrets

def generate_tokens(user, parent_token=None):
    """
    Generate a new pair of access and refresh tokens.
    If parent_token is provided, it will be blacklisted.
    """
    # Blacklist the parent token if provided
    if parent_token:
        parent_token.blacklist()
    
    # Generate access token
    access_token = Token.objects.create(
        user=user,
        token_type='access',
        token=jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(days=1),  # 1 day
                'iat': datetime.utcnow(),
                'jti': secrets.token_hex(16),
                'type': 'access'
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        ),
        expires_at=datetime.utcnow() + timedelta(days=1)
    )
    
    # Generate refresh token
    refresh_token = Token.objects.create(
        user=user,
        token_type='refresh',
        token=jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.utcnow() + timedelta(days=7),  # 7 days
                'iat': datetime.utcnow(),
                'jti': secrets.token_hex(16),
                'type': 'refresh'
            },
            settings.SECRET_KEY,
            algorithm='HS256'
        ),
        expires_at=datetime.utcnow() + timedelta(days=7),
        parent_token=parent_token
    )
    
    return access_token, refresh_token

def verify_token(token_string, token_type='access'):
    """
    Verify a token and return the associated Token object if valid.
    Returns None if the token is invalid or expired.
    """
    try:
        # Decode the token
        payload = jwt.decode(
            token_string,
            settings.SECRET_KEY,
            algorithms=['HS256']
        )
        
        # Verify token type
        if payload.get('type') != token_type:
            return None
        
        # Get the token from database
        token = Token.objects.get(token=token_string)
        
        # Check if token is blacklisted or expired
        if token.is_blacklisted or token.is_expired:
            return None
        
        return token
    except (jwt.InvalidTokenError, Token.DoesNotExist):
        return None 