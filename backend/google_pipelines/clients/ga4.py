import logging
from datetime import date

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
)

from .auth import get_google_credentials, GA4_SCOPES

logger = logging.getLogger(__name__)

DIMENSIONS = [
    'date',
    'sessionSource',
    'sessionMedium',
    'sessionCampaignName',
    'deviceCategory',
    'country',
]

METRICS = [
    'sessions',
    'totalUsers',
    'newUsers',
    'engagedSessions',
    'conversions',
    'purchaseRevenue',
    'engagementRate',
]

# Maps GA4 API camelCase metric names to snake_case model field names
METRIC_FIELD_MAP = {
    'sessions': 'sessions',
    'totalUsers': 'total_users',
    'newUsers': 'new_users',
    'engagedSessions': 'engaged_sessions',
    'conversions': 'conversions',
    'purchaseRevenue': 'purchase_revenue',
    'engagementRate': 'engagement_rate',
}

DIMENSION_FIELD_MAP = {
    'date': 'date',
    'sessionSource': 'source',
    'sessionMedium': 'medium',
    'sessionCampaignName': 'campaign',
    'deviceCategory': 'device_category',
    'country': 'country',
}

ROW_LIMIT = 100_000  # GA4 maximum rows per request


def _parse_ga4_date(raw: str) -> date:
    """Parse GA4's YYYYMMDD date format into a Python date."""
    return date(int(raw[:4]), int(raw[4:6]), int(raw[6:8]))


def _clean_value(value: str):
    """Convert GA4's '(not set)' sentinel to None."""
    if value == '(not set)':
        return None
    return value


def _build_client():
    """Create an authenticated BetaAnalyticsDataClient."""
    credentials = get_google_credentials(GA4_SCOPES)
    return BetaAnalyticsDataClient(credentials=credentials)


def fetch_ga4_report(property_id: str, start_date: date, end_date: date) -> list[dict]:
    """
    Fetch a GA4 report for the given property and date range.

    Returns a list of dicts with snake_case keys matching GA4Daily model fields.
    Handles pagination via offset for results exceeding 100k rows.
    """
    client = _build_client()
    property_name = f'properties/{property_id}'

    all_rows = []
    offset = 0

    while True:
        request = RunReportRequest(
            property=property_name,
            date_ranges=[DateRange(
                start_date=start_date.strftime('%Y-%m-%d'),
                end_date=end_date.strftime('%Y-%m-%d'),
            )],
            dimensions=[Dimension(name=d) for d in DIMENSIONS],
            metrics=[Metric(name=m) for m in METRICS],
            limit=ROW_LIMIT,
            offset=offset,
        )

        response = client.run_report(request)

        for row in response.rows:
            record = {}

            # Dimensions
            for i, dim_header in enumerate(response.dimension_headers):
                field = DIMENSION_FIELD_MAP[dim_header.name]
                raw = row.dimension_values[i].value

                if field == 'date':
                    record[field] = _parse_ga4_date(raw)
                else:
                    record[field] = _clean_value(raw)

            # Metrics
            for i, met_header in enumerate(response.metric_headers):
                field = METRIC_FIELD_MAP[met_header.name]
                raw = row.metric_values[i].value

                if field in ('engagement_rate', 'purchase_revenue'):
                    record[field] = float(raw)
                else:
                    record[field] = int(raw)

            all_rows.append(record)

        # Check if there are more pages
        if len(response.rows) < ROW_LIMIT:
            break
        offset += ROW_LIMIT

    logger.info(
        'Fetched %d rows from GA4 property %s (%s to %s)',
        len(all_rows), property_id, start_date, end_date,
    )
    return all_rows


def test_ga4_connection(property_id: str) -> tuple[bool, str]:
    """
    Validate that the service account can access the given GA4 property.
    Runs a minimal 1-row report. Returns (success, message).
    """
    try:
        client = _build_client()
        property_name = f'properties/{property_id}'

        request = RunReportRequest(
            property=property_name,
            date_ranges=[DateRange(start_date='yesterday', end_date='yesterday')],
            dimensions=[Dimension(name='date')],
            metrics=[Metric(name='sessions')],
            limit=1,
        )

        response = client.run_report(request)
        row_count = len(response.rows)
        return True, f'Connection successful ({row_count} row(s) returned)'

    except Exception as e:
        logger.error('GA4 connection test failed for property %s: %s', property_id, e)
        return False, f'Connection failed: {e}'
