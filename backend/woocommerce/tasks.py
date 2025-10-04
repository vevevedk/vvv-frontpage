import requests
import json
import logging
from datetime import datetime, timedelta
from celery import shared_task
from django.utils import timezone
from django.db import transaction
from django.db import models
from django.db.models import F
from pipelines.models import PipelineLog, DataQualityCheck, PipelineAnalytics
from users.models import AccountConfiguration
from .models import (
    WooCommerceJob, 
    WooCommerceOrder, 
    WooCommerceOrderItem,
    WooCommerceSyncLog
)

logger = logging.getLogger(__name__)


def test_woocommerce_connection(config_data):
    """
    Test WooCommerce API connection
    Returns (success: bool, message: str)
    """
    try:
        store_url = config_data.get('store_url', '').rstrip('/')
        consumer_key = config_data.get('consumer_key')
        consumer_secret = config_data.get('consumer_secret')
        
        if not store_url or not consumer_key or not consumer_secret:
            return False, "Missing required configuration (store_url, consumer_key, consumer_secret)"
        
        # Test endpoint
        test_url = f"{store_url}/wp-json/wc/v3/products"
        
        # Try Basic Auth first (recommended), then fall back to query-params auth if rejected
        response = requests.get(
            test_url,
            auth=(consumer_key, consumer_secret),
            params={'per_page': 1},
            timeout=10
        )

        if response.status_code in (401, 403):
            # Some hosts (or reverse proxies) block Basic Auth. Retry with credentials in query params.
            response = requests.get(
                test_url,
                params={
                    'per_page': 1,
                    'consumer_key': consumer_key,
                    'consumer_secret': consumer_secret,
                },
                timeout=10
            )

        if response.status_code == 200:
            return True, "Connection successful"
        if response.status_code == 401:
            return False, "Authentication failed - check your consumer key and secret"
        if response.status_code == 404:
            return False, "WooCommerce REST API not found - check your store URL"
        return False, f"Connection failed with status {response.status_code}: {response.text}"
            
    except requests.exceptions.ConnectionError:
        return False, "Connection error - check your store URL"
    except requests.exceptions.Timeout:
        return False, "Connection timeout - check your store URL"
    except Exception as e:
        return False, f"Connection test failed: {str(e)}"


@shared_task
def sync_woocommerce_config(config_id, job_type='daily_sync', start_date=None, end_date=None):
    """
    Sync WooCommerce data for a specific account configuration
    """
    try:
        config = AccountConfiguration.objects.get(id=config_id, config_type='woocommerce')
        
        # Create job record
        job = WooCommerceJob.objects.create(
            client_name=config.account.name,  # Store account name for backward compatibility
            job_type=job_type,
            status='running',
            started_at=timezone.now(),
            scheduled_at=timezone.now()
        )
        
        # Log start
        WooCommerceSyncLog.objects.create(
            client_name=config.account.name,  # Store account name for backward compatibility
            job=job,
            level='INFO',
            message=f'Starting {job_type} for {config.account.name} ({config.name})',
            details={'job_id': job.id, 'config_id': config.id}
        )
        
        # Determine date range
        from django.utils.dateparse import parse_datetime
        if isinstance(start_date, str):
            start_date = parse_datetime(start_date)
        if isinstance(end_date, str):
            end_date = parse_datetime(end_date)

        if not start_date:
            if job_type == 'daily_sync':
                start_date = timezone.now() - timedelta(days=30)  # Extended to 30 days to catch more historical data
            else:
                start_date = timezone.now() - timedelta(days=365)  # Last year for backfill
        
        if not end_date:
            end_date = timezone.now()
        
        # Fetch orders from WooCommerce API
        def log(level, message, details=None):
            WooCommerceSyncLog.objects.create(
                client_name=config.account.name,
                job=job,
                level=level,
                message=message,
                details=details or {}
            )

        orders_data = fetch_woocommerce_orders(config, start_date, end_date, log=log)
        
        # Process orders
        orders_processed = 0
        orders_created = 0
        orders_updated = 0
        
        for order_data in orders_data:
            try:
                with transaction.atomic():
                    order, created = process_woocommerce_order(config, order_data)
                    orders_processed += 1
                    
                    if created:
                        orders_created += 1
                    else:
                        orders_updated += 1
                        
            except Exception as e:
                WooCommerceSyncLog.objects.create(
                    client_name=config.account.name,
                    job=job,
                    level='ERROR',
                    message=f'Failed to process order {order_data.get("id")}: {str(e)}',
                    details={'order_data': order_data, 'error': str(e)}
                )
                continue
        
        # Update job status
        job.status = 'completed'
        job.completed_at = timezone.now()
        job.orders_processed = orders_processed
        job.orders_created = orders_created
        job.orders_updated = orders_updated
        job.save()
        
        # Log completion
        WooCommerceSyncLog.objects.create(
            client_name=config.account.name,
            job=job,
            level='INFO',
            message=f'Completed {job_type} for {config.account.name}: {orders_processed} processed, {orders_created} created, {orders_updated} updated',
            details={
                'orders_processed': orders_processed,
                'orders_created': orders_created,
                'orders_updated': orders_updated,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            }
        )

        # Map to a DataPipeline if one exists for this account/config
        try:
            from pipelines.models import DataPipeline
            pipeline = DataPipeline.objects.filter(account=config.account, account_configuration=config, pipeline_type='woocommerce').first()
        except Exception:
            pipeline = None

        # Pipeline logs (aggregate summary)
        try:
            if pipeline:
                PipelineLog.objects.create(
                    pipeline=pipeline,
                    level='INFO',
                    message=f'WooCommerce sync completed ({orders_processed} processed, {orders_created} created, {orders_updated} updated)',
                    details={'job_type': job_type, 'job_id': job.id}
                )
        except Exception:
            pass

        # Simple Data Quality check: completeness proxy using created vs processed
        try:
            if pipeline:
                completeness = 100.0 if orders_processed > 0 else 0.0
                DataQualityCheck.objects.create(
                    pipeline=pipeline,
                    check_type='completeness',
                    status='passed' if completeness >= 90 else 'warning',
                    score=completeness,
                    details={'orders_processed': orders_processed, 'orders_created': orders_created}
                )
        except Exception:
            pass

        # Daily analytics rollup (very basic)
        try:
            if pipeline:
                from django.utils.timezone import now
                today = now().date()
                analytics, _ = PipelineAnalytics.objects.get_or_create(pipeline=pipeline, date=today)
                analytics.total_jobs += 1
                analytics.successful_jobs += 1
                analytics.failed_jobs += 0
                analytics.total_items_processed += int(orders_processed)
                analytics.save()
        except Exception:
            pass
        
        return {
            'success': True,
            'orders_processed': orders_processed,
            'orders_created': orders_created,
            'orders_updated': orders_updated
        }
        
    except AccountConfiguration.DoesNotExist:
        logger.error(f"WooCommerce configuration {config_id} not found")
        return {'success': False, 'error': 'Configuration not found'}
    except Exception as e:
        logger.error(f"Error syncing WooCommerce configuration {config_id}: {str(e)}")
        
        # Update job status to failed
        if 'job' in locals():
            job.status = 'failed'
            job.error_message = str(e)
            job.completed_at = timezone.now()
            job.save()
            
            WooCommerceSyncLog.objects.create(
                client_name=config.account.name if 'config' in locals() else None,
                job=job,
                level='ERROR',
                message=f'Sync failed: {str(e)}',
                details={'error': str(e)}
            )
        
        return {'success': False, 'error': str(e)}


@shared_task
def sync_all_woocommerce_configs():
    """
    Sync all enabled WooCommerce configurations (daily task)
    """
    configs = AccountConfiguration.objects.filter(
        config_type='woocommerce',
        is_active=True
    )
    results = []
    
    for config in configs:
        result = sync_woocommerce_config.delay(config.id, 'daily_sync')
        results.append({
            'config_id': config.id,
            'account_name': config.account.name,
            'config_name': config.name,
            'task_id': result.id
        })
    
    WooCommerceSyncLog.objects.create(
        level='INFO',
        message=f'Started daily sync for {len(configs)} WooCommerce configurations',
        details={'configs': results}
    )
    
    return results


def fetch_woocommerce_orders(config, start_date, end_date, log=None):
    """
    Fetch orders from WooCommerce REST API using account configuration
    """
    woocommerce_config = config.get_woocommerce_config()
    if not woocommerce_config:
        raise Exception("Invalid WooCommerce configuration")
    
    base_url = woocommerce_config['store_url'].rstrip('/')
    api_url = f"{base_url}/wp-json/wc/v3/orders"
    
    headers = {
        'Content-Type': 'application/json',
    }
    
    # Use Zulu time formatting for maximum compatibility
    def z(dt):
        try:
            from django.utils import timezone as djtz
            dt = dt if djtz.is_aware(dt) else djtz.make_aware(dt)
            return dt.astimezone(djtz.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        except Exception:
            return dt.isoformat()

    params = {
        'consumer_key': woocommerce_config['consumer_key'],
        'consumer_secret': woocommerce_config['consumer_secret'],
        'per_page': 100,  # Maximum allowed by WooCommerce
        'after': z(start_date),
        'before': z(end_date),
        'status': 'any',
        'orderby': 'date',
        'order': 'asc'
    }
    
    orders = []
    page = 1
    
    if log:
        log('INFO', 'Starting WooCommerce fetch', {
            'base_url': base_url,
            'after': params['after'],
            'before': params['before']
        })

    while True:
        params['page'] = page
        response = requests.get(api_url, headers=headers, params=params)
        if response.status_code in (401, 403):
            # Retry with credentials in params only – some hosts reject Basic Auth entirely
            retry_params = params.copy()
            # If first request used params (it does), keep as-is; this simply standardizes retry path
            response = requests.get(api_url, headers=headers, params=retry_params)
        
        if response.status_code != 200:
            if log:
                log('ERROR', 'WooCommerce API error', {
                    'status': response.status_code,
                    'body': response.text[:500],
                    'page': page
                })
            raise Exception(f"WooCommerce API error: {response.status_code} - {response.text}")
        
        page_orders = response.json()
        if log:
            try:
                count = len(page_orders)
            except Exception:
                count = 'unknown'
            log('INFO', 'Fetched page', {'page': page, 'orders_in_page': count})
        
        if not page_orders:
            break
            
        orders.extend(page_orders)
        page += 1
        
        # Safety check to prevent infinite loops
        if page > 100:
            break
    
    if log:
        log('INFO', 'WooCommerce fetch completed', {'total_orders': len(orders)})
    return orders


def process_woocommerce_order(config, order_data):
    """
    Process a single WooCommerce order and save to database
    """
    order_id = str(order_data['id'])
    
    # Extract attribution data from meta fields
    attribution_data = {}
    if 'meta_data' in order_data:
        for meta_item in order_data['meta_data']:
            if isinstance(meta_item, dict):
                key = meta_item.get('key', '')
                value = meta_item.get('value', '')
                
                # Map WooCommerce attribution meta fields to our model fields
                if key == '_wc_order_attribution_device_type':
                    attribution_data['attribution_device_type'] = value
                elif key == '_wc_order_attribution_referrer':
                    attribution_data['attribution_referrer'] = value
                elif key == '_wc_order_attribution_session_count':
                    attribution_data['attribution_session_count'] = value
                elif key == '_wc_order_attribution_session_entry':
                    attribution_data['attribution_session_entry'] = value
                elif key == '_wc_order_attribution_session_pages':
                    attribution_data['attribution_session_pages'] = value
                elif key == '_wc_order_attribution_session_start_time':
                    attribution_data['attribution_session_start_time'] = value
                elif key == '_wc_order_attribution_source_type':
                    attribution_data['attribution_source_type'] = value
                elif key == '_wc_order_attribution_user_agent':
                    attribution_data['attribution_user_agent'] = value
                elif key == '_wc_order_attribution_utm_source':
                    attribution_data['attribution_utm_source'] = value
    
    # Helper to parse timestamps to timezone-aware UTC datetimes
    from django.utils import dateparse

    def parse_aware(dt_value):
        """Convert various datetime representations to aware UTC datetime or None."""
        if not dt_value:
            return None
        if isinstance(dt_value, datetime):
            dt = dt_value
        else:
            # Try Django parser first
            dt = dateparse.parse_datetime(dt_value)
            if dt is None:
                # Fallback to fromisoformat with 'Z' handling
                try:
                    dt = datetime.fromisoformat(str(dt_value).replace('Z', '+00:00'))
                except Exception:
                    return None
        try:
            return dt if timezone.is_aware(dt) else timezone.make_aware(dt, timezone.utc)
        except Exception:
            # As a last resort, return naive parsed value
            return dt

    # Check if order already exists
    order, created = WooCommerceOrder.objects.get_or_create(
        client_name=config.account.name,  # Store account name for backward compatibility
        order_id=order_id,
        defaults={
            'order_number': order_data.get('number', order_id),
            'order_date': parse_aware(order_data.get('date_created')),
            'paid_date': parse_aware(order_data.get('date_paid')),
            'status': order_data.get('status', ''),
            
            # Financial fields
            'shipping_total': order_data.get('shipping_total', '0.00'),
            'shipping_tax_total': order_data.get('shipping_tax_total', '0.00'),
            'fee_total': order_data.get('fee_total', '0.00'),
            'fee_tax_total': order_data.get('fee_tax_total', '0.00'),
            'tax_total': order_data.get('tax_total', '0.00'),
            'cart_discount': order_data.get('cart_discount', '0.00'),
            'order_discount': order_data.get('order_discount', '0.00'),
            'discount_total': order_data.get('discount_total', '0.00'),
            'order_total': order_data.get('total', '0.00'),
            'order_subtotal': order_data.get('subtotal', '0.00'),
            
            'order_key': order_data.get('order_key'),
            'order_currency': order_data.get('currency', 'USD'),
            
            # Payment details
            'payment_method': order_data.get('payment_method'),
            'payment_method_title': order_data.get('payment_method_title'),
            'transaction_id': order_data.get('transaction_id'),
            
            # Customer analytics
            'customer_ip_address': order_data.get('customer_ip_address'),
            'customer_user_agent': order_data.get('customer_user_agent'),
            
            # Shipping details
            'shipping_method': order_data.get('shipping_method'),
            
            # Customer info
            'customer_id': order_data.get('customer_id'),
            'customer_user': order_data.get('customer_user'),
            
            # Detailed billing address
            'billing_first_name': order_data.get('billing', {}).get('first_name'),
            'billing_last_name': order_data.get('billing', {}).get('last_name'),
            'billing_company': order_data.get('billing', {}).get('company'),
            'billing_email': order_data.get('billing', {}).get('email'),
            'billing_phone': order_data.get('billing', {}).get('phone'),
            'billing_address_1': order_data.get('billing', {}).get('address_1'),
            'billing_address_2': order_data.get('billing', {}).get('address_2'),
            'billing_postcode': order_data.get('billing', {}).get('postcode'),
            'billing_city': order_data.get('billing', {}).get('city'),
            'billing_state': order_data.get('billing', {}).get('state'),
            'billing_country': order_data.get('billing', {}).get('country'),
            
            # Detailed shipping address
            'shipping_first_name': order_data.get('shipping', {}).get('first_name'),
            'shipping_last_name': order_data.get('shipping', {}).get('last_name'),
            'shipping_company': order_data.get('shipping', {}).get('company'),
            'shipping_phone': order_data.get('shipping', {}).get('phone'),
            'shipping_address_1': order_data.get('shipping', {}).get('address_1'),
            'shipping_address_2': order_data.get('shipping', {}).get('address_2'),
            'shipping_postcode': order_data.get('shipping', {}).get('postcode'),
            'shipping_city': order_data.get('shipping', {}).get('city'),
            'shipping_state': order_data.get('shipping', {}).get('state'),
            'shipping_country': order_data.get('shipping', {}).get('country'),
            
            # Customer notes and import key
            'customer_note': order_data.get('customer_note'),
            'wt_import_key': order_data.get('wt_import_key'),
            
            # Attribution data
            'attribution_device_type': attribution_data.get('attribution_device_type'),
            'attribution_referrer': attribution_data.get('attribution_referrer'),
            'attribution_session_count': attribution_data.get('attribution_session_count'),
            'attribution_session_entry': attribution_data.get('attribution_session_entry'),
            'attribution_session_pages': attribution_data.get('attribution_session_pages'),
            'attribution_session_start_time': parse_aware(attribution_data.get('attribution_session_start_time')),
            'attribution_source_type': attribution_data.get('attribution_source_type'),
            'attribution_user_agent': attribution_data.get('attribution_user_agent'),
            'attribution_utm_source': attribution_data.get('attribution_utm_source'),
            
            # Legacy fields for backward compatibility
            'total': order_data.get('total', '0.00'),
            'currency': order_data.get('currency', 'USD'),
            'billing_address': order_data.get('billing', {}),
            'shipping_address': order_data.get('shipping', {}),
            'date_created': parse_aware(order_data.get('date_created')),
            'date_modified': parse_aware(order_data.get('date_modified')),
            'date_completed': parse_aware(order_data.get('date_completed')),
            'raw_data': order_data
        }
    )
    
    # Mark as new customer if this is the first order for this client+billing_email
    billing_email = order_data.get('billing', {}).get('email')
    if billing_email:
        from .models import WooCommerceOrder as WOrder
        existed = WOrder.objects.filter(client_name=config.account.name, billing_email=billing_email).exclude(id=F('id')).exists()
        # existed will always be False for a brand-new row; set flag accordingly after create
    
    if not created:
        # Update existing order with new data
        order.status = order_data.get('status', '')
        order.order_total = order_data.get('total', '0.00')
        order.order_date = parse_aware(order_data.get('date_modified'))
        order.raw_data = order_data
        order.save()
    else:
        if billing_email:
            # First time we see this billing email for this client?
            from .models import WooCommerceOrder as WOrder
            before_count = WOrder.objects.filter(client_name=config.account.name, billing_email=billing_email).exclude(id=F('id')).count()
            order.is_new_customer = before_count == 0
            order.save(update_fields=['is_new_customer'])

    # Process order items
    process_order_items(order, order_data.get('line_items', []))
    
    return order, created


def process_order_items(order, line_items):
    """
    Process line items for a WooCommerce order
    """
    # Remove existing items for this order
    WooCommerceOrderItem.objects.filter(order=order).delete()
    
    # Create new items
    for item_data in line_items:
        WooCommerceOrderItem.objects.create(
            order=order,
            product_id=str(item_data.get('product_id', '')),
            product_name=item_data.get('name', ''),
            product_sku=item_data.get('sku'),
            quantity=item_data.get('quantity', 0),
            unit_price=item_data.get('price', '0.00'),
            total_price=item_data.get('total', '0.00'),
            subtotal=item_data.get('subtotal', '0.00'),  # Product Item X Subtotal
            tax_class=item_data.get('tax_class'),
            tax_total=item_data.get('total_tax', '0.00'),
            meta_data=item_data.get('meta_data', [])
        ) 