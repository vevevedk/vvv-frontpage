import logging
import requests
from django.conf import settings

logger = logging.getLogger('django')


def _env_prefix():
    label = getattr(settings, 'ENV_LABEL', '')
    return f"[{label}] " if label else ''


def send_slack_message(text, blocks=None):
    """Send a message to the configured Slack webhook.

    Returns True on success, False if the webhook is not configured or the
    request fails.  Messages are automatically prefixed with ENV_LABEL.
    """
    url = getattr(settings, 'SLACK_WEBHOOK_URL', '')
    if not url:
        logger.warning('SLACK_WEBHOOK_URL not configured — skipping Slack notification')
        return False

    prefix = _env_prefix()
    payload = {'text': f'{prefix}{text}'}
    if blocks:
        payload['blocks'] = blocks

    try:
        resp = requests.post(url, json=payload, timeout=10)
        resp.raise_for_status()
        return True
    except Exception as e:
        logger.error(f'Slack notification failed: {e}')
        return False
