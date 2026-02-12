import logging
from datetime import date, timedelta

from googleapiclient.discovery import build

from .auth import get_google_credentials, GSC_SCOPES

logger = logging.getLogger(__name__)

ROW_LIMIT = 25_000  # GSC API maximum rows per request


def _build_client():
    """Create an authenticated Search Console service client."""
    credentials = get_google_credentials(GSC_SCOPES)
    return build('searchconsole', 'v1', credentials=credentials)


def fetch_gsc_search_data(site_url: str, start_date: date, end_date: date) -> list[dict]:
    """
    Fetch GSC search analytics for the given site and date range.

    Paginates via startRow (25k rows per page).
    Returns a list of dicts with keys: date, query, page, clicks, impressions, ctr, position.
    """
    service = _build_client()
    all_rows = []
    start_row = 0

    while True:
        body = {
            'startDate': start_date.strftime('%Y-%m-%d'),
            'endDate': end_date.strftime('%Y-%m-%d'),
            'dimensions': ['query', 'page', 'date'],
            'rowLimit': ROW_LIMIT,
            'startRow': start_row,
        }

        response = service.searchanalytics().query(
            siteUrl=site_url, body=body,
        ).execute()

        rows = response.get('rows', [])
        if not rows:
            break

        for row in rows:
            keys = row['keys']
            all_rows.append({
                'query': keys[0],
                'page': keys[1],
                'date': date.fromisoformat(keys[2]),
                'clicks': row['clicks'],
                'impressions': row['impressions'],
                'ctr': row['ctr'],
                'position': row['position'],
            })

        if len(rows) < ROW_LIMIT:
            break
        start_row += ROW_LIMIT

    logger.info(
        'Fetched %d rows from GSC site %s (%s to %s)',
        len(all_rows), site_url, start_date, end_date,
    )
    return all_rows


def test_gsc_connection(site_url: str) -> tuple[bool, str]:
    """
    Validate that the service account can access the given GSC property.
    Runs a minimal query for 3 days ago. Returns (success, message).
    """
    try:
        service = _build_client()
        three_days_ago = date.today() - timedelta(days=3)

        body = {
            'startDate': three_days_ago.strftime('%Y-%m-%d'),
            'endDate': three_days_ago.strftime('%Y-%m-%d'),
            'dimensions': ['query'],
            'rowLimit': 1,
        }

        response = service.searchanalytics().query(
            siteUrl=site_url, body=body,
        ).execute()

        row_count = len(response.get('rows', []))
        return True, f'Connection successful ({row_count} row(s) returned)'

    except Exception as e:
        logger.error('GSC connection test failed for site %s: %s', site_url, e)
        return False, f'Connection failed: {e}'
