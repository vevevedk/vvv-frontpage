import logging
from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from django.db.models import Count, Q

logger = logging.getLogger('authentication')


@shared_task
def daily_login_summary():
    """Send a daily Slack summary of login activity from the previous day."""
    from authentication.models import LoginEvent
    from core.slack import send_slack_message

    yesterday = timezone.now().date() - timedelta(days=1)
    start = timezone.make_aware(timezone.datetime.combine(yesterday, timezone.datetime.min.time()))
    end = start + timedelta(days=1)

    events = LoginEvent.objects.filter(timestamp__gte=start, timestamp__lt=end)
    total = events.count()
    successful = events.filter(success=True).count()
    failed = events.filter(success=False).count()
    unique_users = events.filter(success=True).values('user').distinct().count()

    top_users = (
        events.filter(success=True)
        .values('user__email')
        .annotate(login_count=Count('id'))
        .order_by('-login_count')[:5]
    )
    top_list = '\n'.join(
        f"  • {row['user__email']}: {row['login_count']} logins"
        for row in top_users
    ) or '  (none)'

    text = (
        f"*Daily Login Summary — {yesterday.isoformat()}*\n"
        f"Total logins: {total}  |  Successful: {successful}  |  Failed: {failed}\n"
        f"Unique users: {unique_users}\n\n"
        f"*Top 5 most active:*\n{top_list}"
    )

    logger.info(f"Daily login summary: {total} total, {successful} ok, {failed} failed, {unique_users} unique")
    send_slack_message(text)


@shared_task
def inactive_user_alerts():
    """Alert on Slack about active users who haven't logged in for 7+ days."""
    from authentication.models import LoginEvent
    from users.models import User
    from core.slack import send_slack_message

    cutoff = timezone.now() - timedelta(days=7)
    new_account_cutoff = timezone.now() - timedelta(days=7)

    # Active users created more than 7 days ago
    active_users = User.objects.filter(
        is_active=True,
        created_at__lt=new_account_cutoff,
    )

    # Users who have a successful login in the last 7 days
    recent_logins = (
        LoginEvent.objects.filter(success=True, timestamp__gte=cutoff)
        .values_list('user_id', flat=True)
        .distinct()
    )

    inactive = active_users.exclude(id__in=recent_logins).order_by('email')[:20]

    if not inactive.exists():
        logger.info('No inactive users found — skipping Slack alert')
        return

    user_list = '\n'.join(f"  • {u.email}" for u in inactive)
    count = inactive.count()

    text = (
        f"*Inactive User Alert*\n"
        f"{count} active user(s) haven't logged in for 7+ days:\n{user_list}"
    )

    logger.info(f"Inactive user alert: {count} users")
    send_slack_message(text)
