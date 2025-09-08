from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    """
    Throttle login attempts to prevent brute force attacks.
    """
    scope = 'login'
    rate = '5/minute'  # 5 attempts per minute

class RegisterRateThrottle(AnonRateThrottle):
    """
    Throttle registration attempts to prevent spam.
    """
    scope = 'register'
    rate = '3/minute'  # 3 attempts per minute

class TokenRefreshRateThrottle(UserRateThrottle):
    """
    Throttle token refresh attempts.
    """
    scope = 'token_refresh'
    rate = '10/minute'  # 10 attempts per minute 