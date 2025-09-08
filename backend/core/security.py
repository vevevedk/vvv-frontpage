import logging
import json
from datetime import datetime, timezone

logger = logging.getLogger('security')

class SecurityEventLogger:
    """
    Logger for security-related events.
    """
    @staticmethod
    def log_auth_attempt(email, success, reason=None):
        event = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'event_type': 'auth_attempt',
            'email': email,
            'success': success,
            'reason': reason
        }
        logger.warning(f"Security Event: {json.dumps(event)}")

    @staticmethod
    def log_token_usage(token_id, user_id, action):
        event = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'event_type': 'token_usage',
            'token_id': token_id,
            'user_id': user_id,
            'action': action
        }
        logger.info(f"Security Event: {json.dumps(event)}")

    @staticmethod
    def log_rate_limit_exceeded(ip, endpoint):
        event = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'event_type': 'rate_limit_exceeded',
            'ip': ip,
            'endpoint': endpoint
        }
        logger.warning(f"Security Event: {json.dumps(event)}")

    @staticmethod
    def log_suspicious_activity(ip, details):
        event = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'event_type': 'suspicious_activity',
            'ip': ip,
            'details': details
        }
        logger.error(f"Security Event: {json.dumps(event)}") 