import json
import os
import logging

from google.oauth2 import service_account

logger = logging.getLogger(__name__)

GA4_SCOPES = ['https://www.googleapis.com/auth/analytics.readonly']
GSC_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']


def get_google_credentials(scopes):
    """
    Build service-account credentials from either a key-file path or an
    inline JSON string.  Tries GOOGLE_SERVICE_ACCOUNT_KEY_PATH first
    (file on disk), then GOOGLE_SERVICE_ACCOUNT_KEY_JSON (env var with
    the full JSON blob).

    Returns google.oauth2.service_account.Credentials scoped to *scopes*.
    """
    key_path = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY_PATH')
    key_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT_KEY_JSON')

    if key_path:
        logger.info('Loading Google credentials from file: %s', key_path)
        credentials = service_account.Credentials.from_service_account_file(
            key_path, scopes=scopes,
        )
    elif key_json:
        logger.info('Loading Google credentials from GOOGLE_SERVICE_ACCOUNT_KEY_JSON env var')
        info = json.loads(key_json)
        credentials = service_account.Credentials.from_service_account_info(
            info, scopes=scopes,
        )
    else:
        raise RuntimeError(
            'Google service account credentials not configured. '
            'Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH or '
            'GOOGLE_SERVICE_ACCOUNT_KEY_JSON.'
        )

    return credentials
