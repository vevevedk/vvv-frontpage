import logging
from datetime import date, timedelta

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from pipelines.models import DataPipeline, PipelineJob, PipelineLog, DataQualityCheck, PipelineAnalytics
from users.models import AccountConfiguration

from .clients.ga4 import fetch_ga4_report
from .models import GA4Daily

logger = logging.getLogger(__name__)


@shared_task
def sync_ga4_config(config_id, date_range_days=7):
    """
    Sync GA4 data for a specific AccountConfiguration.

    Fetches the last *date_range_days* of data from the GA4 Data API and
    upserts rows into GA4Daily.  Mirrors the WooCommerce sync pattern:
    find an associated DataPipeline, create a PipelineJob, log results.
    """
    try:
        config = AccountConfiguration.objects.get(
            id=config_id, config_type='google_analytics',
        )
    except AccountConfiguration.DoesNotExist:
        logger.error('GA4 configuration %s not found', config_id)
        return {'success': False, 'error': 'Configuration not found'}

    property_id = config.config_data.get('property_id')
    if not property_id:
        logger.error('No property_id in config %s', config_id)
        return {'success': False, 'error': 'No property_id configured'}

    # Find associated DataPipeline (optional)
    pipeline = DataPipeline.objects.filter(
        account=config.account,
        account_configuration=config,
        pipeline_type='google_analytics',
    ).first()

    # Create PipelineJob
    job = PipelineJob.objects.create(
        pipeline=pipeline,
        job_type='sync',
        status='running',
        started_at=timezone.now(),
        scheduled_at=timezone.now(),
    )

    end = date.today()
    start = end - timedelta(days=date_range_days)

    try:
        rows = fetch_ga4_report(property_id, start, end)

        rows_processed = 0
        rows_created = 0
        rows_updated = 0

        for row in rows:
            try:
                with transaction.atomic():
                    # Normalize None → '' for dimension fields
                    defaults = {
                        'sessions': row['sessions'],
                        'total_users': row['total_users'],
                        'new_users': row['new_users'],
                        'engaged_sessions': row['engaged_sessions'],
                        'conversions': row['conversions'],
                        'purchase_revenue': row['purchase_revenue'],
                        'engagement_rate': row['engagement_rate'],
                    }

                    _, created = GA4Daily.objects.update_or_create(
                        account_configuration=config,
                        date=row['date'],
                        source=row.get('source') or '',
                        medium=row.get('medium') or '',
                        campaign=row.get('campaign') or '',
                        device_category=row.get('device_category') or '',
                        country=row.get('country') or '',
                        defaults=defaults,
                    )

                    rows_processed += 1
                    if created:
                        rows_created += 1
                    else:
                        rows_updated += 1

            except Exception as e:
                logger.error(
                    'Error processing GA4 row for config %s: %s',
                    config_id, e,
                )
                continue

        # Update job
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.total_items = len(rows)
        job.processed_items = rows_processed
        job.created_items = rows_created
        job.updated_items = rows_updated
        job.save()

        # Pipeline bookkeeping
        if pipeline:
            try:
                PipelineLog.objects.create(
                    pipeline=pipeline,
                    level='INFO',
                    message=(
                        f'GA4 sync completed ({rows_processed} processed, '
                        f'{rows_created} created, {rows_updated} updated)'
                    ),
                    details={'job_id': job.id, 'date_range': f'{start} to {end}'},
                )
            except Exception:
                pass

            try:
                completeness = 100.0 if rows_processed > 0 else 0.0
                DataQualityCheck.objects.create(
                    pipeline=pipeline,
                    check_type='completeness',
                    status='passed' if completeness >= 90 else 'warning',
                    score=completeness,
                    details={'rows_processed': rows_processed, 'rows_created': rows_created},
                )
            except Exception:
                pass

            try:
                today = timezone.now().date()
                analytics, _ = PipelineAnalytics.objects.get_or_create(
                    pipeline=pipeline, date=today,
                )
                analytics.total_jobs += 1
                analytics.successful_jobs += 1
                analytics.total_items_processed += rows_processed
                analytics.save()
            except Exception:
                pass

        logger.info(
            'GA4 sync for config %s completed: %d processed, %d created, %d updated',
            config_id, rows_processed, rows_created, rows_updated,
        )

        return {
            'success': True,
            'rows_processed': rows_processed,
            'rows_created': rows_created,
            'rows_updated': rows_updated,
        }

    except Exception as e:
        logger.error('GA4 sync failed for config %s: %s', config_id, e)

        job.status = 'failed'
        job.error_message = str(e)
        job.completed_at = timezone.now()
        job.save()

        if pipeline:
            try:
                PipelineLog.objects.create(
                    pipeline=pipeline,
                    level='ERROR',
                    message=f'GA4 sync failed: {e}',
                    details={'job_id': job.id},
                )
            except Exception:
                pass

        return {'success': False, 'error': str(e)}


@shared_task
def sync_all_ga4_configs():
    """
    Fan-out task: find all active google_analytics configs and trigger
    sync_ga4_config for each one.
    """
    configs = AccountConfiguration.objects.filter(
        config_type='google_analytics',
        is_active=True,
    )

    results = []
    for config in configs:
        result = sync_ga4_config.delay(config.id)
        results.append({
            'config_id': config.id,
            'account_name': config.account.name,
            'config_name': config.name,
            'task_id': result.id,
        })

    logger.info('Started GA4 sync for %d configurations', len(configs))
    return results
