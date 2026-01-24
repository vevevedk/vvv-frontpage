"""
Health check endpoint for Django backend
Checks database, Redis, and other critical services
"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import time
from datetime import datetime


def health_check(request):
    """
    Comprehensive health check endpoint
    Returns status of database, cache, and other services
    """
    health_status = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'version': getattr(settings, 'VERSION', '1.0.0'),
        'services': {}
    }
    
    overall_status = 'healthy'
    
    # Check database
    db_start = time.time()
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        db_response_time = (time.time() - db_start) * 1000  # Convert to ms
        
        health_status['services']['database'] = {
            'status': 'healthy',
            'response_time_ms': round(db_response_time, 2)
        }
    except Exception as e:
        db_response_time = (time.time() - db_start) * 1000
        health_status['services']['database'] = {
            'status': 'unhealthy',
            'error': str(e),
            'response_time_ms': round(db_response_time, 2)
        }
        overall_status = 'unhealthy'
    
    # Check Redis/cache
    cache_start = time.time()
    try:
        cache_key = 'health_check_' + str(time.time())
        cache.set(cache_key, 'ok', 10)
        cache_value = cache.get(cache_key)
        cache.delete(cache_key)
        cache_response_time = (time.time() - cache_start) * 1000
        
        if cache_value == 'ok':
            health_status['services']['cache'] = {
                'status': 'healthy',
                'response_time_ms': round(cache_response_time, 2)
            }
        else:
            health_status['services']['cache'] = {
                'status': 'unhealthy',
                'error': 'Cache read/write failed',
                'response_time_ms': round(cache_response_time, 2)
            }
            overall_status = 'degraded'
    except Exception as e:
        cache_response_time = (time.time() - cache_start) * 1000
        health_status['services']['cache'] = {
            'status': 'unhealthy',
            'error': str(e),
            'response_time_ms': round(cache_response_time, 2)
        }
        overall_status = 'degraded'
    
    # Set overall status
    health_status['status'] = overall_status
    
    # Return appropriate status code
    status_code = 200 if overall_status == 'healthy' else 503
    
    response = JsonResponse(health_status, status=status_code)
    response['Cache-Control'] = 'no-store, must-revalidate'
    response['X-Health-Check'] = 'true'
    
    return response







