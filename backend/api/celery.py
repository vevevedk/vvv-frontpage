import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')

# Create Celery app
app = Celery('vvv_api')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Ensure this app is the default for @shared_task and app_or_default()
app.set_default()

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Celery Beat Schedule
app.conf.beat_schedule = {
    'daily-woocommerce-sync': {
        'task': 'woocommerce.tasks.sync_all_woocommerce_configs',
        'schedule': 86400.0,  # 24 hours
    },
    'daily-ga4-sync': {
        'task': 'google_pipelines.tasks.sync_all_ga4_configs',
        'schedule': 86400.0,  # 24 hours
    },
    'daily-login-summary': {
        'task': 'authentication.tasks.daily_login_summary',
        'schedule': crontab(hour=8, minute=0),  # 8 AM UTC
    },
    'daily-inactive-user-alerts': {
        'task': 'authentication.tasks.inactive_user_alerts',
        'schedule': crontab(hour=8, minute=15),  # 8:15 AM UTC
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 