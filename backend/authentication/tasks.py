import logging
from datetime import timedelta
from celery import shared_task
from django.utils import timezone
from django.db.models import Count, Q

logger = logging.getLogger('authentication')


@shared_task
def notify_login(user_email, ip_address=''):
    """Send a Slack notification when a user logs in."""
    from core.slack import send_slack_message
    send_slack_message(f":key: *Login* — {user_email} (IP: {ip_address or 'unknown'})")


@shared_task
def notify_registration(user_email, company_name=''):
    """Send a Slack notification when a new user registers."""
    from core.slack import send_slack_message
    company_part = f" | Company: {company_name}" if company_name else ""
    send_slack_message(
        f":tada: *New Registration* — {user_email}{company_part}"
    )


@shared_task
def notify_invite_created(inviter_email, invitee_email, company_name=''):
    """Send a Slack notification when an invite is created."""
    from core.slack import send_slack_message
    company_part = f" to {company_name}" if company_name else ""
    send_slack_message(
        f":envelope: *Invite Sent* — {inviter_email} invited {invitee_email}{company_part}"
    )


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
def notify_invite_accepted(invitee_email, inviter_email='', company_name=''):
    """Send a Slack notification when an invite is accepted."""
    from core.slack import send_slack_message
    parts = [f":white_check_mark: *Invite Accepted* — {invitee_email} registered"]
    if inviter_email:
        parts.append(f"(invited by {inviter_email})")
    if company_name:
        parts.append(f"| Company: {company_name}")
    send_slack_message(' '.join(parts))


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


@shared_task
def daily_invite_summary():
    """Daily Slack report with full invite funnel analytics."""
    from authentication.models import Invite
    from core.slack import send_slack_message

    now = timezone.now()
    yesterday = now.date() - timedelta(days=1)
    day_start = timezone.make_aware(
        timezone.datetime.combine(yesterday, timezone.datetime.min.time())
    )
    day_end = day_start + timedelta(days=1)

    # --- Yesterday's activity ---
    created_yesterday = Invite.objects.filter(created_at__gte=day_start, created_at__lt=day_end)
    accepted_yesterday = Invite.objects.filter(accepted_at__gte=day_start, accepted_at__lt=day_end)
    sent = created_yesterday.count()
    accepted = accepted_yesterday.count()

    # --- All-time funnel ---
    all_invites = Invite.objects.all()
    total = all_invites.count()
    by_status = dict(
        all_invites.values_list('status').annotate(c=Count('id')).values_list('status', 'c')
    )
    total_accepted = by_status.get('accepted', 0)
    total_pending = by_status.get('pending', 0)
    total_expired = by_status.get('expired', 0)
    total_cancelled = by_status.get('cancelled', 0)

    # Mark stale pending invites as expired for accurate counts
    stale = Invite.objects.filter(status='pending', expires_at__lt=now)
    stale_count = stale.count()
    if stale_count:
        stale.update(status='expired')
        total_expired += stale_count
        total_pending -= stale_count

    acceptance_rate = (total_accepted / total * 100) if total else 0

    # --- Average time to accept ---
    accepted_invites = Invite.objects.filter(
        status='accepted', accepted_at__isnull=False
    )
    if accepted_invites.exists():
        deltas = [
            (inv.accepted_at - inv.created_at).total_seconds()
            for inv in accepted_invites.only('accepted_at', 'created_at')
        ]
        avg_seconds = sum(deltas) / len(deltas)
        avg_hours = avg_seconds / 3600
        if avg_hours < 1:
            avg_time_str = f"{avg_seconds / 60:.0f} min"
        elif avg_hours < 48:
            avg_time_str = f"{avg_hours:.1f} hrs"
        else:
            avg_time_str = f"{avg_hours / 24:.1f} days"
    else:
        avg_time_str = "N/A"

    # --- Top inviters (last 30 days) ---
    thirty_days_ago = now - timedelta(days=30)
    top_inviters = (
        Invite.objects.filter(created_at__gte=thirty_days_ago)
        .values('invited_by__email')
        .annotate(
            sent_count=Count('id'),
            accepted_count=Count('id', filter=Q(status='accepted')),
        )
        .order_by('-sent_count')[:5]
    )
    inviter_lines = []
    for row in top_inviters:
        rate = (row['accepted_count'] / row['sent_count'] * 100) if row['sent_count'] else 0
        inviter_lines.append(
            f"  • {row['invited_by__email']}: "
            f"{row['sent_count']} sent, {row['accepted_count']} accepted ({rate:.0f}%)"
        )
    inviter_list = '\n'.join(inviter_lines) or '  (none)'

    # --- Expiring soon (next 24 hours) ---
    expiring_soon = Invite.objects.filter(
        status='pending',
        expires_at__gte=now,
        expires_at__lt=now + timedelta(hours=24),
    )
    expiring_lines = [f"  • {inv.email}" for inv in expiring_soon[:10]]
    expiring_count = expiring_soon.count()

    # --- Build message ---
    text = (
        f":bar_chart: *Daily Invite Summary — {yesterday.isoformat()}*\n\n"
        f"*Yesterday:*  {sent} sent  |  {accepted} accepted\n\n"
        f"*All-time funnel:*\n"
        f"  Total: {total}  |  Accepted: {total_accepted}  |  "
        f"Pending: {total_pending}  |  Expired: {total_expired}  |  "
        f"Cancelled: {total_cancelled}\n"
        f"  Acceptance rate: {acceptance_rate:.0f}%  |  "
        f"Avg time to accept: {avg_time_str}\n\n"
        f"*Top inviters (30d):*\n{inviter_list}\n"
    )

    if expiring_count:
        expiring_list = '\n'.join(expiring_lines)
        extra = f" (+{expiring_count - 10} more)" if expiring_count > 10 else ""
        text += (
            f"\n:warning: *Expiring in <24h:* ({expiring_count}){extra}\n"
            f"{expiring_list}\n"
        )

    logger.info(
        'Daily invite summary: %d sent yesterday, %d accepted, %d total, %.0f%% acceptance',
        sent, accepted, total, acceptance_rate,
    )
    send_slack_message(text)
