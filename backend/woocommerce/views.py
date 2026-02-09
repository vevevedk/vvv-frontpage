from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.db import models
from django.db.models import Count, Sum, Avg, Q, Min, Max, Subquery, OuterRef
from django.db.models.functions import TruncDate, TruncMonth, TruncWeek, ExtractHour
from users.models import AccountConfiguration, Account
from users.serializers import AccountConfigurationSerializer
from .models import (
    WooCommerceJob, 
    WooCommerceOrder,
    WooCommerceSyncLog,
    ChannelClassification
)
from .serializers import (
    WooCommerceJobSerializer,
    WooCommerceOrderSerializer,
    WooCommerceSyncLogSerializer,
    ChannelClassificationSerializer
)
from .tasks import sync_woocommerce_config
import json


def get_currency_for_client(client_name, orders_queryset=None):
    """
    Determine the currency code for a client.
    Priority: 1) Company currency, 2) WooCommerce config currency, 3) First order currency, 4) USD default
    """
    currency_code = 'USD'

    # Normalize client name
    base_client_name = (client_name or '').split(' - ')[0].strip() if client_name else ''

    # 1) Prefer company-level currency
    if base_client_name and base_client_name != 'all':
        try:
            acc = Account.objects.filter(name__iexact=base_client_name).select_related('company').first()
            if acc and acc.company and hasattr(acc.company, 'currency_code') and acc.company.currency_code:
                return acc.company.currency_code
        except Exception:
            pass

    # 2) Prefer client-level currency from active WooCommerce config
    if base_client_name and base_client_name != 'all':
        try:
            cfg = AccountConfiguration.objects.filter(
                account__name__iexact=base_client_name,
                config_type='woocommerce',
                is_active=True
            ).first()
            if cfg:
                code = cfg.get_config('currency_code') or cfg.get_config('currency')
                if code:
                    return code
        except Exception:
            pass

    # 3) Fallback to first order currency in the queryset
    if orders_queryset is not None:
        try:
            first_currency = orders_queryset.exclude(currency__isnull=True).exclude(currency='').values_list('currency', flat=True).first()
            if first_currency:
                return first_currency
        except Exception:
            pass

    return currency_code


class WooCommerceConfigViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for managing WooCommerce configurations"""
    queryset = AccountConfiguration.objects.filter(config_type='woocommerce')
    serializer_class = AccountConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Restrict configs to those the current user can access."""
        user = getattr(self, 'request', None).user if hasattr(self, 'request') else None
        base_qs = AccountConfiguration.objects.filter(config_type='woocommerce')
        if not user:
            return base_qs.none()
        if user.role == 'super_admin':
            return base_qs
        if user.role in ['agency_admin', 'agency_user']:
            if user.access_all_companies:
                return base_qs.filter(account__company__agency=user.agency)
            return base_qs.filter(account__company__in=user.accessible_companies.all())
        if user.role in ['company_admin', 'company_user']:
            if user.access_all_companies:
                return base_qs.filter(account__company__agency=user.agency)
            return base_qs.filter(account__company__in=user.accessible_companies.all())
        return base_qs.none()

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test WooCommerce API connection"""
        config = self.get_object()
        
        try:
            # Simple API call to test connection
            from .tasks import fetch_woocommerce_orders
            orders = fetch_woocommerce_orders(
                config, 
                timezone.now() - timedelta(days=1),
                timezone.now()
            )
            
            return Response({
                'success': True,
                'message': f'Successfully connected to {config.account.name} ({config.name})',
                'orders_found': len(orders)
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Connection failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def sync_now(self, request, pk=None):
        """Trigger immediate sync for a configuration"""
        config = self.get_object()
        job_type = request.data.get('job_type', 'manual_sync')
        # Optional ISO8601 dates (e.g., 2025-08-01 or 2025-08-01T00:00:00Z)
        start_date_str = request.data.get('start_date')
        end_date_str = request.data.get('end_date')
        start_date = None
        end_date = None
        from django.utils.dateparse import parse_datetime, parse_date
        if start_date_str:
            start_date = parse_datetime(start_date_str) or (
                parse_date(start_date_str) and timezone.make_aware(timezone.datetime.combine(parse_date(start_date_str), timezone.datetime.min.time()))
            )
        if end_date_str:
            end_date = parse_datetime(end_date_str) or (
                parse_date(end_date_str) and timezone.make_aware(timezone.datetime.combine(parse_date(end_date_str), timezone.datetime.max.time()))
            )
        
        # Start async task
        if start_date or end_date:
            task = sync_woocommerce_config.delay(config.id, job_type, start_date.isoformat() if start_date else None, end_date.isoformat() if end_date else None)
        else:
            task = sync_woocommerce_config.delay(config.id, job_type)
        
        return Response({
            'success': True,
            'message': f'Sync started for {config.account.name} ({config.name})',
            'task_id': task.id
        })


class WooCommerceJobViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for viewing WooCommerce jobs"""
    queryset = WooCommerceJob.objects.all()
    serializer_class = WooCommerceJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = WooCommerceJob.objects.all()
        request = getattr(self, 'request', None)
        if request:
            client_name = request.GET.get('client_name') if hasattr(request, 'GET') else getattr(request, 'query_params', {}).get('client_name')
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a running job"""
        job = self.get_object()
        
        if job.status == 'running':
            job.status = 'cancelled'
            job.completed_at = timezone.now()
            job.save()
            
            return Response({
                'success': True,
                'message': 'Job cancelled successfully'
            })
        else:
            return Response({
                'success': False,
                'message': 'Job cannot be cancelled (not running)'
            }, status=status.HTTP_400_BAD_REQUEST)


class ChannelClassificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing channel classification rules"""
    
    queryset = ChannelClassification.objects.all()
    serializer_class = ChannelClassificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ChannelClassification.objects.all()
        
        # Filter by channel type
        channel_type = self.request.query_params.get('channel_type')
        if channel_type:
            queryset = queryset.filter(channel_type=channel_type)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(source__icontains=search) |
                Q(medium__icontains=search) |
                Q(channel_type__icontains=search)
            )
        
        return queryset.order_by('channel_type', 'source')

class WooCommerceOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for WooCommerce orders with analytics capabilities"""
    
    queryset = WooCommerceOrder.objects.all()
    serializer_class = WooCommerceOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = WooCommerceOrder.objects.all()
        request = getattr(self, 'request', None)
        user = request.user if request else None
        if user and user.role != 'super_admin':
            # Build allowed client name list based on accessible accounts
            if user.role in ['agency_admin', 'agency_user']:
                if user.access_all_companies:
                    accounts = Account.objects.filter(company__agency=user.agency)
                else:
                    accounts = Account.objects.filter(company__in=user.accessible_companies.all())
            elif user.role in ['company_admin', 'company_user']:
                if user.access_all_companies:
                    accounts = Account.objects.filter(company__agency=user.agency)
                else:
                    accounts = Account.objects.filter(company__in=user.accessible_companies.all())
            else:
                accounts = Account.objects.none()
            allowed_names = list(accounts.values_list('name', flat=True))
            queryset = queryset.filter(client_name__in=allowed_names)

        if request:
            client_name = request.GET.get('client_name') if hasattr(request, 'GET') else getattr(request, 'query_params', {}).get('client_name')
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)
        return queryset.order_by('-date_created')

    @action(detail=False, methods=['get'])
    def client_names(self, request):
        """Get distinct client names from orders for dropdown filtering"""
        queryset = self.get_queryset()
        client_names = (
            queryset
            .exclude(client_name__isnull=True)
            .exclude(client_name='')
            .values_list('client_name', flat=True)
            .distinct()
            .order_by('client_name')
        )
        return Response([
            {'id': name, 'name': name}
            for name in client_names
        ])

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get order statistics"""
        client_name = request.GET.get('client_name') if hasattr(request, 'GET') else getattr(request, 'query_params', {}).get('client_name')
        queryset = self.get_queryset()
        
        if client_name:
            queryset = queryset.filter(client_name__icontains=client_name)
        
        total_orders = queryset.count()
        total_revenue = queryset.aggregate(
            total=models.Sum('total')
        )['total'] or 0
        
        # Orders by status
        status_counts = queryset.values('status').annotate(
            count=models.Count('id')
        )
        
        # Recent orders (last 30 days)
        recent_orders = queryset.filter(
            date_created__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        return Response({
            'total_orders': total_orders,
            'total_revenue': float(total_revenue),
            'recent_orders': recent_orders,
            'status_breakdown': list(status_counts)
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get comprehensive analytics dashboard data"""
        client_name = request.GET.get('client_name') if hasattr(request, 'GET') else getattr(request, 'query_params', {}).get('client_name')
        period = int(request.GET.get('period', 30) if hasattr(request, 'GET') else getattr(request, 'query_params', {}).get('period', 30))  # days
        
        queryset = self.get_queryset()
        if client_name:
            queryset = queryset.filter(client_name__icontains=client_name)
        
        # Date range for analysis
        end_date = timezone.now()
        start_date = end_date - timedelta(days=period)
        period_orders = queryset.filter(date_created__gte=start_date)
        
        # Basic metrics
        total_orders = period_orders.count()
        total_revenue = period_orders.aggregate(Sum('total'))['total__sum'] or 0
        avg_order_value = period_orders.aggregate(Avg('total'))['total__avg'] or 0
        
        # Initialize growth metrics
        revenue_growth = 0
        order_growth = 0
        
        # Growth comparison (previous period) - only if we have orders
        if total_orders > 0:
            prev_start = start_date - timedelta(days=period)
            prev_orders = queryset.filter(date_created__gte=prev_start, date_created__lt=start_date)
            prev_revenue = prev_orders.aggregate(Sum('total'))['total__sum'] or 0
            prev_count = prev_orders.count()
            
            revenue_growth = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
            order_growth = ((total_orders - prev_count) / prev_count * 100) if prev_count > 0 else 0
        
        # Daily trends
        daily_trends = period_orders.annotate(
            date=TruncDate('date_created')
        ).values('date').annotate(
            orders=Count('id'),
            revenue=Sum('total')
        ).order_by('date')
        
        # Orders by status
        status_breakdown = period_orders.values('status').annotate(
            count=Count('id'),
            revenue=Sum('total')
        ).order_by('-count')
        
        # Payment methods
        payment_methods = period_orders.exclude(
            payment_method__isnull=True
        ).values('payment_method').annotate(
            count=Count('id'),
            revenue=Sum('total')
        ).order_by('-count')[:10]
        
        # Top customers by revenue
        top_customers = period_orders.exclude(
            billing_email__isnull=True
        ).values(
            'billing_email', 'billing_first_name', 'billing_last_name'
        ).annotate(
            order_count=Count('id'),
            total_spent=Sum('total')
        ).order_by('-total_spent')[:10]
        
        # Monthly trends (for longer periods)
        if period > 60:
            monthly_trends = period_orders.annotate(
                month=TruncMonth('date_created')
            ).values('month').annotate(
                orders=Count('id'),
                revenue=Sum('total')
            ).order_by('month')
        else:
            monthly_trends = []
        
        # Order completion rate
        completed_orders = period_orders.filter(
            status__in=['completed', 'processing']
        ).count()
        completion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0
        
        # Average time to completion (for completed orders) - simplified for now
        completed_orders_count = period_orders.filter(date_completed__isnull=False).count()
        avg_completion_hours = 24.0  # Default placeholder value
        
        # Customer insights
        unique_customers = period_orders.exclude(
            billing_email__isnull=True
        ).values('billing_email').distinct().count()
        
        # Payment method breakdown with revenue
        payment_methods = period_orders.exclude(
            payment_method__isnull=True
        ).values('payment_method').annotate(
            count=Count('id'),
            revenue=Sum('total')
        ).order_by('-count')[:10]
        
        return Response({
            'period': period,
            'date_range': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'overview': {
                'total_orders': total_orders,
                'total_revenue': float(total_revenue),
                'avg_order_value': float(avg_order_value),
                'completion_rate': round(completion_rate, 1),
                'avg_completion_hours': round(avg_completion_hours, 1),
                'unique_customers': unique_customers
            },
            'growth': {
                'revenue_growth': round(revenue_growth, 1),
                'order_growth': round(order_growth, 1),
                'previous_period': {
                    'orders': prev_count,
                    'revenue': float(prev_revenue)
                }
            },
            'trends': {
                'daily': [
                    {
                        'date': trend['date'].isoformat(),
                        'orders': trend['orders'],
                        'revenue': float(trend['revenue'] or 0)
                    }
                    for trend in daily_trends
                ],
                'monthly': [
                    {
                        'month': trend['month'].isoformat(),
                        'orders': trend['orders'],
                        'revenue': float(trend['revenue'] or 0)
                    }
                    for trend in monthly_trends
                ] if monthly_trends else []
            },
            'breakdowns': {
                'status': [
                    {
                        'status': item['status'],
                        'count': item['count'],
                        'revenue': float(item['revenue'] or 0),
                        'percentage': round(item['count'] / total_orders * 100, 1) if total_orders > 0 else 0
                    }
                    for item in status_breakdown
                ],
                'payment_methods': [
                    {
                        'method': item['payment_method'],
                        'count': item['count'],
                        'revenue': float(item['revenue'] or 0),
                        'percentage': round(item['count'] / total_orders * 100, 1) if total_orders > 0 else 0
                    }
                    for item in payment_methods
                ]
            },
            'customers': {
                'top_customers': [
                    {
                        'email': customer['billing_email'],
                        'name': f"{customer['billing_first_name'] or ''} {customer['billing_last_name'] or ''}".strip(),
                        'orders': customer['order_count'],
                        'total_spent': float(customer['total_spent'])
                    }
                    for customer in top_customers
                ]
            }
        })
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get comprehensive analytics dashboard data - alias for analytics endpoint"""
        return self.analytics(request)
    
    @action(detail=False, methods=['get'])
    def customer_acquisition(self, request):
        """Get customer acquisition analytics with CAC (Customer Acquisition Cost)"""
        try:
            client_name = request.query_params.get('client_name', '')
            period = int(request.query_params.get('period', 30))
            new_customer_window = int(request.query_params.get('new_customer_window', 365))

            queryset = self.get_queryset()
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)

            # Date range for analysis
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period)
            period_orders = queryset.filter(date_created__gte=start_date)

            # Identify new customers using a single annotated query instead of N+1
            # A customer is "new" if they haven't ordered in the last {new_customer_window} days before their current order
            prev_order_qs = WooCommerceOrder.objects.filter(
                billing_email=OuterRef('billing_email'),
                date_created__lt=OuterRef('date_created'),
            )
            if client_name:
                prev_order_qs = prev_order_qs.filter(client_name__icontains=client_name)

            annotated_orders = period_orders.exclude(
                billing_email__isnull=True
            ).exclude(
                billing_email=''
            ).annotate(
                prev_order_date=Subquery(
                    prev_order_qs.order_by('-date_created').values('date_created')[:1]
                )
            )

            new_customers_data = []
            returning_customers_data = []

            for order in annotated_orders:
                prev_date = order.prev_order_date

                if prev_date is None:
                    is_new = True
                    days_since_last_order = None
                else:
                    days_since_last_order = (order.date_created - prev_date).days
                    is_new = days_since_last_order >= new_customer_window

                if is_new:
                    new_customers_data.append({
                        'order_id': order.order_id,
                        'email': order.billing_email,
                        'order_date': order.date_created,
                        'total': float(order.total or 0),
                        'previous_order_date': prev_date
                    })
                else:
                    returning_customers_data.append({
                        'order_id': order.order_id,
                        'email': order.billing_email,
                        'order_date': order.date_created,
                        'total': float(order.total or 0),
                        'days_since_last_order': days_since_last_order
                    })

            # Count unique new customers
            unique_new_customer_emails = set([c['email'] for c in new_customers_data])
            new_customers_count = len(unique_new_customer_emails)

            # Count unique returning customers
            unique_returning_customer_emails = set([c['email'] for c in returning_customers_data])
            returning_customers_count = len(unique_returning_customer_emails)

            # Total unique customers in period
            total_unique_customers = period_orders.exclude(
                billing_email__isnull=True
            ).values('billing_email').distinct().count()

            # Revenue breakdown
            new_customer_revenue = sum([c['total'] for c in new_customers_data])
            returning_customer_revenue = sum([c['total'] for c in returning_customers_data])
            total_revenue = float(period_orders.aggregate(Sum('total'))['total__sum'] or 0)

            # Calculate CAC (Customer Acquisition Cost)
            # Note: We'll need marketing spend data to calculate actual CAC
            # For now, we'll provide placeholders and structure
            # TODO: Integrate with ad spend data from GA4/Facebook/Google Ads

            total_marketing_spend = 0  # Placeholder - integrate with ad platforms
            cac = (total_marketing_spend / new_customers_count) if new_customers_count > 0 else 0

            # Average order value for new vs returning
            avg_new_customer_order_value = (new_customer_revenue / len(new_customers_data)) if new_customers_data else 0
            avg_returning_customer_order_value = (returning_customer_revenue / len(returning_customers_data)) if returning_customers_data else 0

            # Daily new customer trends
            daily_new_customers = {}
            for customer in new_customers_data:
                date_str = customer['order_date'].date().isoformat()
                if date_str not in daily_new_customers:
                    daily_new_customers[date_str] = {
                        'date': date_str,
                        'new_customers': 0,
                        'revenue': 0,
                        'orders': 0
                    }
                daily_new_customers[date_str]['new_customers'] += 1
                daily_new_customers[date_str]['revenue'] += customer['total']
                daily_new_customers[date_str]['orders'] += 1

            daily_trends = sorted(daily_new_customers.values(), key=lambda x: x['date'])

            # Top new customers by spend
            new_customer_spend = {}
            for customer in new_customers_data:
                email = customer['email']
                if email not in new_customer_spend:
                    new_customer_spend[email] = {
                        'email': email,
                        'total_spent': 0,
                        'orders': 0,
                        'first_order_date': customer['order_date']
                    }
                new_customer_spend[email]['total_spent'] += customer['total']
                new_customer_spend[email]['orders'] += 1

            top_new_customers = sorted(
                new_customer_spend.values(),
                key=lambda x: x['total_spent'],
                reverse=True
            )[:10]

            # Format dates for JSON serialization
            for customer in top_new_customers:
                customer['first_order_date'] = customer['first_order_date'].isoformat()

            # Previous period comparison
            prev_start = start_date - timedelta(days=period)
            prev_period_orders = queryset.filter(date_created__gte=prev_start, date_created__lt=start_date)

            # Calculate previous period new customers using annotation
            prev_annotated = prev_period_orders.exclude(
                billing_email__isnull=True
            ).exclude(
                billing_email=''
            ).annotate(
                prev_order_date=Subquery(
                    prev_order_qs.order_by('-date_created').values('date_created')[:1]
                )
            )

            prev_new_customers_count = 0
            for order in prev_annotated:
                prev_date = order.prev_order_date
                if prev_date is None:
                    prev_new_customers_count += 1
                else:
                    days_since_last = (order.date_created - prev_date).days
                    if days_since_last >= new_customer_window:
                        prev_new_customers_count += 1

            # Growth metrics
            new_customer_growth = ((new_customers_count - prev_new_customers_count) / prev_new_customers_count * 100) if prev_new_customers_count > 0 else 0

            # Get currency for this client
            currency_code = get_currency_for_client(client_name, period_orders)

            return Response({
                'period': period,
                'new_customer_window': new_customer_window,
                'currency': currency_code,
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'overview': {
                    'new_customers': new_customers_count,
                    'returning_customers': returning_customers_count,
                    'total_unique_customers': total_unique_customers,
                    'new_customer_percentage': round((new_customers_count / total_unique_customers * 100), 1) if total_unique_customers > 0 else 0,
                    'new_customer_revenue': float(new_customer_revenue),
                    'returning_customer_revenue': float(returning_customer_revenue),
                    'total_revenue': float(total_revenue),
                    'new_customer_revenue_percentage': round((new_customer_revenue / total_revenue * 100), 1) if total_revenue > 0 else 0,
                    'avg_new_customer_order_value': round(avg_new_customer_order_value, 2),
                    'avg_returning_customer_order_value': round(avg_returning_customer_order_value, 2),
                    'total_new_customer_orders': len(new_customers_data),
                    'total_returning_customer_orders': len(returning_customers_data)
                },
                'cac_metrics': {
                    'total_marketing_spend': float(total_marketing_spend),
                    'customer_acquisition_cost': round(cac, 2),
                    'revenue_per_new_customer': round((new_customer_revenue / new_customers_count), 2) if new_customers_count > 0 else 0,
                    'cac_payback_ratio': round((new_customer_revenue / total_marketing_spend), 2) if total_marketing_spend > 0 else 0,
                    'note': 'Marketing spend data needs to be integrated from ad platforms'
                },
                'growth': {
                    'new_customer_growth': round(new_customer_growth, 1),
                    'previous_period': {
                        'new_customers': prev_new_customers_count
                    }
                },
                'trends': {
                    'daily': daily_trends
                },
                'top_new_customers': top_new_customers
            })
        except Exception as e:
            import traceback
            return Response(
                {'error': f'Failed to generate customer acquisition analytics: {str(e)}', 'traceback': traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def subscription_analytics(self, request):
        """
        Analyze subscription/repeat purchase patterns.
        Identifies customers who repeatedly purchase the same product.
        """
        try:
            # Get parameters
            client_name = request.query_params.get('client_name', '')
            period = int(request.query_params.get('period', 90))
            min_purchases = int(request.query_params.get('min_purchases', 2))
            reorder_window = int(request.query_params.get('reorder_window_days', 35))
            churn_multiplier = float(request.query_params.get('churn_multiplier', 1.5))
            at_risk_days = int(request.query_params.get('at_risk_days', 7))

            # Date ranges
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period)

            # Get currency
            currency_code = get_currency_for_client(client_name)

            # Filter orders
            queryset = self.get_queryset()
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)

            # Get all orders with items (not just period orders - we need history)
            all_orders = queryset.prefetch_related('items')

            # Find subscribers: customers who purchased same product multiple times
            # Group by email + product_id
            from collections import defaultdict
            customer_product_orders = defaultdict(list)

            for order in all_orders.exclude(billing_email__isnull=True).exclude(billing_email=''):
                for item in order.items.all():
                    key = (order.billing_email.lower(), item.product_id, item.product_name)
                    customer_product_orders[key].append({
                        'order_id': order.order_id,
                        'date': order.date_created or order.order_date,
                        'quantity': item.quantity,
                        'total': float(item.total_price),
                        'order_total': float(order.total) if order.total else 0,
                    })

            # Identify subscribers (min_purchases of same product)
            subscribers = []
            for (email, product_id, product_name), orders_list in customer_product_orders.items():
                if len(orders_list) >= min_purchases:
                    # Sort orders by date
                    orders_list.sort(key=lambda x: x['date'] if x['date'] else timezone.now())

                    # Calculate intervals between orders
                    intervals = []
                    for i in range(1, len(orders_list)):
                        if orders_list[i]['date'] and orders_list[i-1]['date']:
                            interval = (orders_list[i]['date'] - orders_list[i-1]['date']).days
                            if interval > 0:
                                intervals.append(interval)

                    avg_interval = sum(intervals) / len(intervals) if intervals else reorder_window
                    last_order_date = orders_list[-1]['date']
                    first_order_date = orders_list[0]['date']
                    total_revenue = sum(o['total'] for o in orders_list)
                    total_orders = len(orders_list)

                    # Determine status
                    if last_order_date:
                        days_since_last = (end_date - last_order_date).days
                        expected_interval = avg_interval if avg_interval > 0 else reorder_window

                        if days_since_last > expected_interval * churn_multiplier:
                            status = 'churned'
                        elif days_since_last > expected_interval - at_risk_days:
                            status = 'at_risk'
                        else:
                            status = 'active'
                    else:
                        status = 'unknown'
                        days_since_last = None

                    # Check if became subscriber in this period
                    is_new_subscriber = False
                    if len(orders_list) >= min_purchases:
                        # The date they became a subscriber is the date of their min_purchases-th order
                        subscription_start_date = orders_list[min_purchases - 1]['date']
                        if subscription_start_date and subscription_start_date >= start_date:
                            is_new_subscriber = True

                    subscribers.append({
                        'email': email,
                        'product_id': product_id,
                        'product_name': product_name,
                        'total_orders': total_orders,
                        'total_revenue': total_revenue,
                        'first_order_date': first_order_date,
                        'last_order_date': last_order_date,
                        'avg_interval_days': round(avg_interval, 1),
                        'days_since_last_order': days_since_last,
                        'status': status,
                        'is_new_subscriber': is_new_subscriber,
                    })

            # Calculate overview metrics
            total_subscribers = len(subscribers)
            active_subscribers = len([s for s in subscribers if s['status'] == 'active'])
            at_risk_subscribers = len([s for s in subscribers if s['status'] == 'at_risk'])
            churned_subscribers = len([s for s in subscribers if s['status'] == 'churned'])
            new_subscribers_period = len([s for s in subscribers if s['is_new_subscriber']])

            # Revenue metrics
            total_subscriber_revenue = sum(s['total_revenue'] for s in subscribers)

            # Get total revenue for period to calculate percentage
            period_orders = queryset.filter(date_created__gte=start_date)
            total_period_revenue = float(period_orders.aggregate(Sum('total'))['total__sum'] or 0)

            subscriber_revenue_percentage = (total_subscriber_revenue / total_period_revenue * 100) if total_period_revenue > 0 else 0

            # Average metrics
            avg_subscriber_ltv = (total_subscriber_revenue / total_subscribers) if total_subscribers > 0 else 0
            avg_orders_per_subscriber = (sum(s['total_orders'] for s in subscribers) / total_subscribers) if total_subscribers > 0 else 0

            # Calculate average subscription length (months from first to last order)
            subscription_lengths = []
            for s in subscribers:
                if s['first_order_date'] and s['last_order_date']:
                    length_days = (s['last_order_date'] - s['first_order_date']).days
                    subscription_lengths.append(length_days / 30)  # Convert to months
            avg_subscription_length_months = (sum(subscription_lengths) / len(subscription_lengths)) if subscription_lengths else 0

            # Churn rate (churned / (active + churned) in period)
            active_plus_churned = active_subscribers + churned_subscribers
            churn_rate = (churned_subscribers / active_plus_churned * 100) if active_plus_churned > 0 else 0

            # Net subscriber growth
            net_subscriber_growth = new_subscribers_period - churned_subscribers

            # Health metrics
            avg_days_between_orders = (sum(s['avg_interval_days'] for s in subscribers) / total_subscribers) if total_subscribers > 0 else 0

            # At-risk subscriber list (sorted by days overdue)
            at_risk_list = sorted(
                [s for s in subscribers if s['status'] == 'at_risk'],
                key=lambda x: x['days_since_last_order'] or 0,
                reverse=True
            )[:20]

            # Recently churned list
            recently_churned_list = sorted(
                [s for s in subscribers if s['status'] == 'churned'],
                key=lambda x: x['days_since_last_order'] or 0
            )[:20]

            # New subscribers this period
            new_subscribers_list = sorted(
                [s for s in subscribers if s['is_new_subscriber']],
                key=lambda x: x['last_order_date'] or timezone.now(),
                reverse=True
            )[:20]

            # Format dates for JSON serialization
            def format_subscriber(s):
                return {
                    'email': s['email'],
                    'product_name': s['product_name'],
                    'total_orders': s['total_orders'],
                    'total_revenue': s['total_revenue'],
                    'first_order_date': s['first_order_date'].isoformat() if s['first_order_date'] else None,
                    'last_order_date': s['last_order_date'].isoformat() if s['last_order_date'] else None,
                    'days_since_last_order': s['days_since_last_order'],
                    'avg_interval_days': s['avg_interval_days'],
                    'status': s['status'],
                }

            return Response({
                'period': period,
                'currency': currency_code,
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'params': {
                    'min_purchases': min_purchases,
                    'reorder_window_days': reorder_window,
                    'churn_multiplier': churn_multiplier,
                    'at_risk_days': at_risk_days,
                },
                'overview': {
                    'total_subscribers': total_subscribers,
                    'active_subscribers': active_subscribers,
                    'at_risk_subscribers': at_risk_subscribers,
                    'churned_subscribers': churned_subscribers,
                    'new_subscribers_period': new_subscribers_period,
                    'subscriber_revenue': round(total_subscriber_revenue, 2),
                    'subscriber_revenue_percentage': round(subscriber_revenue_percentage, 1),
                    'avg_subscriber_ltv': round(avg_subscriber_ltv, 2),
                    'avg_subscription_length_months': round(avg_subscription_length_months, 1),
                    'churn_rate': round(churn_rate, 1),
                    'net_subscriber_growth': net_subscriber_growth,
                },
                'health': {
                    'avg_orders_per_subscriber': round(avg_orders_per_subscriber, 1),
                    'avg_days_between_orders': round(avg_days_between_orders, 1),
                },
                'at_risk_subscribers': [format_subscriber(s) for s in at_risk_list],
                'recently_churned': [format_subscriber(s) for s in recently_churned_list],
                'new_subscribers': [format_subscriber(s) for s in new_subscribers_list],
            })

        except Exception as e:
            import traceback
            return Response(
                {'error': f'Failed to generate subscription analytics: {str(e)}', 'traceback': traceback.format_exc()},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def traffic_sources_discovery(self, request):
        """Discover traffic sources across all clients, optionally only unclassified."""
        try:
            only_unclassified = str(request.query_params.get('only_unclassified', 'true')).lower() in ['true', '1', 'yes']

            # Build quick lookup for existing active rules
            classification_pairs = {
                (rule.source.lower(), rule.medium.lower())
                for rule in ChannelClassification.objects.filter(is_active=True)
            }

            # Iterate orders and derive source/medium using the same logic as reporting
            traffic_sources = {}
            for order in WooCommerceOrder.objects.all():
                source, medium = self._extract_traffic_source(order)
                pair = (source.lower(), medium.lower())

                if only_unclassified and pair in classification_pairs:
                    continue

                key = f"{source}/{medium}"
                bucket = traffic_sources.setdefault(
                    key,
                    {
                        'source': source,
                        'medium': medium,
                        'source_medium': key,
                        'order_count': 0,
                        'total_revenue': 0.0,
                        'clients': set(),
                        'examples': []
                    },
                )
                bucket['order_count'] += 1
                bucket['total_revenue'] += float(order.total or 0)
                bucket['clients'].add(order.client_name or 'Unknown')
                if len(bucket['examples']) < 3:
                    bucket['examples'].append({
                        'order_id': order.order_id,
                        'client': order.client_name,
                        'total': order.total,
                        'date': order.date_created.isoformat() if order.date_created else None,
                    })

            # Convert sets to lists
            for key, value in traffic_sources.items():
                value['clients'] = list(value['clients'])

            sorted_sources = sorted(traffic_sources.values(), key=lambda x: x['order_count'], reverse=True)

            return Response({
                'traffic_sources': sorted_sources,
                'total_sources': len(sorted_sources),
                'total_orders': sum(s['order_count'] for s in sorted_sources),
                'total_revenue': sum(s['total_revenue'] for s in sorted_sources),
            })

        except Exception as e:
            return Response({'error': f'Failed to discover traffic sources: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def channels_report(self, request):
        """Get comprehensive channel performance report with period-over-period comparison"""
        try:
            # Get query parameters
            period = int(request.query_params.get('period', 30))
            comparison_type = request.query_params.get('comparison_type', 'MoM')
            client_name = request.query_params.get('client_name', '')
            export_detailed = request.query_params.get('export', 'false').lower() == 'true'
            
            # Calculate date ranges
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period)
            
            # Calculate comparison period
            if comparison_type == 'MoM':
                comparison_start = start_date - timedelta(days=period)
                comparison_end = start_date
            elif comparison_type == 'QoQ':
                comparison_start = start_date - timedelta(days=period * 3)
                comparison_end = start_date
            elif comparison_type == 'YoY':
                comparison_start = start_date - timedelta(days=365)
                comparison_end = start_date
            else:
                comparison_start = start_date - timedelta(days=period)
                comparison_end = start_date
            
            # Normalize client name (strip suffixes like " - woocommerce")
            def normalize_client_label(label: str) -> str:
                try:
                    return (label or '').split(' - ')[0].strip()
                except Exception:
                    return (label or '').strip()

            base_client_name = normalize_client_label(client_name)

            # Filter orders by client if specified (tolerant to naming differences)
            orders_q = models.Q()
            if base_client_name and base_client_name != 'all':
                normalized = base_client_name
                orders_q &= (
                    models.Q(client_name__iexact=normalized) |
                    models.Q(client_name__istartswith=f"{normalized} -") |
                    models.Q(client_name__icontains=normalized)
                )
            
            # Get current period data (use order_date to match WooCommerce reports)
            current_orders = (
                WooCommerceOrder.objects
                .filter(order_date__gte=start_date, order_date__lte=end_date)
                .filter(orders_q)
            )
            
            # Get comparison period data
            comparison_orders = (
                WooCommerceOrder.objects
                .filter(order_date__gte=comparison_start, order_date__lte=comparison_end)
                .filter(orders_q)
            )
            
            # Process channel data for current period
            current_channel_data = self._process_channel_data(current_orders)
            
            # Process channel data for comparison period
            comparison_channel_data = self._process_channel_data(comparison_orders)
            
            # Calculate period-over-period changes
            pop_changes = self._calculate_pop_changes(current_channel_data, comparison_channel_data)
            
            # Get unclassified data
            unclassified_data = self._get_unclassified_data(current_orders)
            
            # Prepare response
            currency_code = 'USD'
            # 1) Prefer company-level currency
            try:
                if base_client_name and base_client_name != 'all':
                    from users.models import Account
                    acc = Account.objects.filter(name__iexact=base_client_name).select_related('company').first()
                    if acc and acc.company and acc.company.currency_code:
                        currency_code = acc.company.currency_code
            except Exception:
                pass

            # 2) Otherwise prefer client-level currency from active WooCommerce config
            try:
                if base_client_name and base_client_name != 'all':
                    cfg = AccountConfiguration.objects.filter(
                        account__name__iexact=base_client_name,
                        config_type='woocommerce',
                        is_active=True
                    ).first()
                    if cfg:
                        code = cfg.get_config('currency_code') or cfg.get_config('currency')
                        if code:
                            currency_code = code
            except Exception:
                pass
            # 3) Fallback to first order currency in the period
            if currency_code == 'USD':
                try:
                    first_currency = current_orders.values_list('currency', flat=True).first()
                    if first_currency:
                        currency_code = first_currency
                except Exception:
                    pass
            response_data = {
                'currency': currency_code,
                'currentPeriod': {
                    'dateStart': start_date.strftime('%Y-%m-%d'),
                    'dateEnd': end_date.strftime('%Y-%m-%d'),
                    'offset': 0,
                    'lookback': period,
                    'comparison': comparison_type,
                    'total': current_channel_data.get('total', {}),
                    'channels': current_channel_data.get('channels', [])
                },
                'comparisonPeriod': {
                    'dateStart': comparison_start.strftime('%Y-%m-%d'),
                    'dateEnd': comparison_end.strftime('%Y-%m-%d'),
                    'period': comparison_type,
                    'total': comparison_channel_data.get('total', {}),
                    'channels': comparison_channel_data.get('channels', [])
                },
                'popChange': pop_changes,
                'unclassifiedData': unclassified_data
            }
            
            # Add detailed orders for export if requested
            if export_detailed:
                detailed_orders = self._get_detailed_orders_for_export(current_orders)
                response_data['orders'] = detailed_orders
            
            return Response(response_data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate channel report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _process_channel_data(self, orders):
        """
        Process orders to extract channel performance data
        
        NOTE: This method currently relies on UTM parameters being present in WooCommerce order data.
        Most WooCommerce stores don't capture UTM parameters by default, so orders will default to 'Direct' channel.
        
        To get proper channel attribution, you need to:
        1. Install a UTM tracking plugin in WooCommerce, OR
        2. Integrate with Google Analytics to get traffic source data, OR
        3. Modify your WooCommerce checkout to capture UTM parameters
        """
        # Get all active classification rules
        classifications = ChannelClassification.objects.filter(is_active=True)
        # Build a case-insensitive lookup for (source, medium)
        classification_map = {
            (rule.source.lower(), rule.medium.lower()): rule for rule in classifications
        }
        
        # Initialize channel data
        channel_data = {}
        total_sessions = 0
        total_orders = 0
        total_revenue = 0
        
        # Process each order
        for order in orders:
            # Extract source/medium from order metadata, referrer, or UTM parameters
            source, medium = self._extract_traffic_source(order)
            
            # Try to get source/medium from order metadata
            if hasattr(order, 'raw_data') and order.raw_data:
                raw_data = order.raw_data
                
                # Check for UTM parameters in order notes or metadata
                if isinstance(raw_data, dict):
                    # Look for UTM parameters in various places
                    utm_source = (
                        raw_data.get('utm_source') or 
                        raw_data.get('source') or 
                        raw_data.get('referrer') or
                        raw_data.get('_source') or
                        raw_data.get('_medium')
                    )
                    
                    utm_medium = (
                        raw_data.get('utm_medium') or 
                        raw_data.get('medium') or 
                        raw_data.get('_medium')
                    )
                    
                    # Check order notes for UTM parameters
                    if not utm_source and raw_data.get('note'):
                        note = raw_data.get('note', '')
                        # Simple regex to extract UTM parameters from notes
                        import re
                        utm_match = re.search(r'utm_source=([^&\s]+)', note)
                        if utm_match:
                            utm_source = utm_match.group(1)
                        
                        utm_medium_match = re.search(r'utm_medium=([^&\s]+)', note)
                        if utm_medium_match:
                            utm_medium = utm_medium_match.group(1)
                    
                    if utm_source:
                        source = utm_source
                    if utm_medium:
                        medium = utm_medium
                    
                    # Debug: Log what we found in raw_data
                    if source != '(direct)' or medium != 'typein':
                        print(f"Order {order.order_id}: Found UTM data - Source: {source}, Medium: {medium}")
                    else:
                        print(f"Order {order.order_id}: No UTM data found in raw_data. Keys available: {list(raw_data.keys())}")
                        # Check if there are any other potential sources of traffic data
                        if 'meta_data' in raw_data:
                            meta_data = raw_data['meta_data']
                            print(f"  Meta data keys: {[item.get('key', '') for item in meta_data if isinstance(item, dict)]}")
                        if 'note' in raw_data and raw_data['note']:
                            print(f"  Order note: {raw_data['note'][:100]}...")
            
            # Find matching classification (case-insensitive)
            classification = classification_map.get((source, medium))
            
            # Use classification or default to 'Direct' instead of 'ChanelNotFound'
            channel_type = classification.channel_type if classification else 'Direct'
            
            # Debug logging for channel classification
            if source != '(direct)' or medium != 'typein':
                print(f"Order {order.order_id}: Source={source}, Medium={medium} → Channel={channel_type}")
            
            # Initialize channel if not exists
            if channel_type not in channel_data:
                channel_data[channel_type] = {
                    'channelType': channel_type,
                    'sessions': 0,
                    'orders': 0,
                    'orderTotal': 0,
                    'cvr': 0,
                    'aov': 0,
                    'sourceMedium': f"{source}/{medium}"
                }
            
            # Override grouping for specific sources to align with expected report buckets
            if source == 'bing':
                channel_type = 'Bing'
                if channel_type not in channel_data:
                    channel_data[channel_type] = {
                        'channelType': channel_type,
                        'sessions': 0,
                        'orders': 0,
                        'orderTotal': 0,
                        'cvr': 0,
                        'aov': 0,
                        'sourceMedium': f"{source}/{medium}"
                    }
            elif source in ['trustpilot']:
                channel_type = 'Trustpulot' if 'Trustpulot' in channel_data else 'Trustpilot'
                if channel_type not in channel_data:
                    channel_data[channel_type] = {
                        'channelType': channel_type,
                        'sessions': 0,
                        'orders': 0,
                        'orderTotal': 0,
                        'cvr': 0,
                        'aov': 0,
                        'sourceMedium': f"{source}/{medium}"
                    }
            elif source in ['chatgpt', 'openai']:
                channel_type = 'ChatGpt'
                if channel_type not in channel_data:
                    channel_data[channel_type] = {
                        'channelType': channel_type,
                        'sessions': 0,
                        'orders': 0,
                        'orderTotal': 0,
                        'cvr': 0,
                        'aov': 0,
                        'sourceMedium': f"{source}/{medium}"
                    }

            # Update channel data
            channel_data[channel_type]['orders'] += 1
            order_total_val = float(order.total or 0)
            channel_data[channel_type]['orderTotal'] += order_total_val
            total_orders += 1
            total_revenue += order_total_val

            # Sessions: prefer attribution_session_count if available; fallback to 1
            try:
                session_count_val = int(getattr(order, 'attribution_session_count', 0) or 0)
            except (ValueError, TypeError):
                session_count_val = 0
            if session_count_val <= 0:
                session_count_val = 1
            channel_data[channel_type]['sessions'] += session_count_val
            total_sessions += session_count_val
        
        # Calculate CVR and AOV for each channel
        for channel in channel_data.values():
            if channel['sessions'] > 0:
                channel['cvr'] = (channel['orders'] / channel['sessions']) * 100
            if channel['orders'] > 0:
                channel['aov'] = channel['orderTotal'] / channel['orders']
        
        # Calculate totals
        total_cvr = (total_orders / total_sessions * 100) if total_sessions > 0 else 0
        total_aov = (total_revenue / total_orders) if total_orders > 0 else 0
        
        # Debug: Print classification summary
        print(f"\n=== Channel Classification Summary ===")
        print(f"Total orders processed: {total_orders}")
        for channel_type, data in channel_data.items():
            print(f"  {channel_type}: {data['orders']} orders")
        print(f"=====================================\n")
        
        return {
            'total': {
                'channelType': 'Total',
                'sessions': total_sessions,
                'orders': total_orders,
                'orderTotal': total_revenue,
                'cvr': total_cvr,
                'aov': total_aov,
                'sourceMedium': 'All Channels'
            },
            'channels': list(channel_data.values())
        }
    
    def _calculate_pop_changes(self, current_data, comparison_data):
        """Calculate period-over-period percentage changes"""
        pop_changes = {
            'total': {},
            'channels': {}
        }
        
        # Calculate total changes
        current_total = current_data.get('total', {})
        comparison_total = comparison_data.get('total', {})
        
        for metric in ['sessions', 'orders', 'orderTotal', 'cvr', 'aov']:
            current_val = current_total.get(metric, 0)
            comparison_val = comparison_total.get(metric, 0)
            
            if comparison_val != 0:
                change = ((current_val - comparison_val) / comparison_val) * 100
            else:
                change = 0 if current_val == 0 else 100
            
            pop_changes['total'][metric] = change
        
        # Calculate channel-level changes
        current_channels = {c['channelType']: c for c in current_data.get('channels', [])}
        comparison_channels = {c['channelType']: c for c in comparison_data.get('channels', [])}
        
        all_channel_types = set(current_channels.keys()) | set(comparison_channels.keys())
        
        for channel_type in all_channel_types:
            current_channel = current_channels.get(channel_type, {})
            comparison_channel = comparison_channels.get(channel_type, {})
            
            pop_changes['channels'][channel_type] = {}
            
            for metric in ['sessions', 'orders', 'orderTotal', 'cvr', 'aov']:
                current_val = current_channel.get(metric, 0)
                comparison_val = comparison_channel.get(metric, 0)
                
                if comparison_val != 0:
                    change = ((current_val - comparison_val) / comparison_val) * 100
                else:
                    change = 0 if current_val == 0 else 100
                
                pop_changes['channels'][channel_type][metric] = change
        
        return pop_changes
    
    def _get_unclassified_data(self, orders):
        """Get examples of unclassified traffic sources"""
        # Get all active classification rules, normalized to lowercase for comparison
        classifications = ChannelClassification.objects.filter(is_active=True)
        classification_pairs = {(rule.source.lower(), rule.medium.lower()) for rule in classifications}
        
        # Find unclassified source/medium combinations
        unclassified_sources = {}
        
        for order in orders:
            # Reuse the extractor to ensure consistent parsing
            source, medium = self._extract_traffic_source(order)
            source = (source or '(direct)').lower()
            medium = (medium or 'typein').lower()
            
            if (source, medium) not in classification_pairs:
                key = f"{source}/{medium}"
                if key not in unclassified_sources:
                    unclassified_sources[key] = {
                        'source': source,
                        'medium': medium,
                        'sourceMedium': key,
                        'sessions': 0
                    }
                
                # Estimate sessions
                estimated_sessions = max(1, int(float(order.total or 0) / 100))
                unclassified_sources[key]['sessions'] += estimated_sessions
        
        # Convert to list and sort by sessions
        unclassified_list = list(unclassified_sources.values())
        unclassified_list.sort(key=lambda x: x['sessions'], reverse=True)
        
        return {
            'count': len(unclassified_list),
            'examples': unclassified_list[:10]  # Top 10 examples
        }
    
    def _extract_traffic_source(self, order):
        """
        Enhanced method to extract traffic source and medium from WooCommerce order data
        
        Returns tuple of (source, medium)
        """
        source = '(direct)'
        medium = 'typein'
        
        # Prefer normalized attribution fields persisted on the model
        try:
            attr_source = getattr(order, 'attribution_utm_source', None)
            attr_medium = getattr(order, 'attribution_source_type', None)
            if attr_source:
                source = str(attr_source).strip().lower()
                medium = str(attr_medium or 'utm').strip().lower()
                # Normalize and return early if attribution fields exist
                return self._normalize_source(source), self._normalize_medium(medium)
        except Exception:
            pass
        
        if not hasattr(order, 'raw_data') or not order.raw_data:
            return source, medium
        
        raw_data = order.raw_data
        if not isinstance(raw_data, dict):
            return source, medium
        
        # Method 1: Direct UTM parameters or WooCommerce attribution meta
        utm_source = (
            raw_data.get('utm_source') or 
            raw_data.get('source') or 
            raw_data.get('_source')
        )
        
        utm_medium = (
            raw_data.get('utm_medium') or 
            raw_data.get('medium') or 
            raw_data.get('_medium')
        )
        
        # Method 2: Check meta_data array for UTM parameters and WC attribution keys
        if not utm_source or not utm_medium:
            meta_data = raw_data.get('meta_data', [])
            if isinstance(meta_data, list):
                for meta_item in meta_data:
                    if isinstance(meta_item, dict):
                        key = meta_item.get('key', '').lower()
                        value = meta_item.get('value', '')
                        
                        if 'utm_source' in key and value:
                            utm_source = value
                        elif 'utm_medium' in key and value:
                            utm_medium = value
                        # WooCommerce Order Attribution plugin keys
                        elif key == '_wc_order_attribution_utm_source' and value:
                            utm_source = value
                        elif key == '_wc_order_attribution_source_type' and value:
                            utm_medium = value
                        elif 'source' in key and value:
                            utm_source = value
                        elif 'medium' in key and value:
                            utm_medium = value
        
        # Method 3: Extract from order notes using regex
        if not utm_source or not utm_medium:
            note = raw_data.get('note', '')
            if note:
                import re
                
                # Look for UTM parameters in notes
                utm_source_match = re.search(r'utm_source[=:]\s*([^&\s\n\r]+)', note, re.IGNORECASE)
                if utm_source_match:
                    utm_source = utm_source_match.group(1)
                
                utm_medium_match = re.search(r'utm_medium[=:]\s*([^&\s\n\r]+)', note, re.IGNORECASE)
                if utm_medium_match:
                    utm_medium = utm_medium_match.group(1)
                
                # Look for other traffic source indicators
                if not utm_source:
                    source_match = re.search(r'source[=:]\s*([^&\s\n\r]+)', note, re.IGNORECASE)
                    if source_match:
                        utm_source = source_match.group(1)
                
                if not utm_medium:
                    medium_match = re.search(r'medium[=:]\s*([^&\s\n\r]+)', note, re.IGNORECASE)
                    if medium_match:
                        utm_medium = medium_match.group(1)
        
        # Method 4: Check for referrer information
        if not utm_source:
            referrer = raw_data.get('referrer') or raw_data.get('_referrer')
            if referrer:
                import re
                # Extract domain from referrer
                domain_match = re.search(r'https?://(?:www\.)?([^/]+)', referrer)
                if domain_match:
                    domain = domain_match.group(1).lower()
                    if 'google' in domain:
                        utm_source = 'google'
                        utm_medium = 'organic'
                    elif 'bing' in domain:
                        utm_source = 'bing'
                        utm_medium = 'organic'
                    elif 'yahoo' in domain:
                        utm_source = 'yahoo'
                        utm_medium = 'organic'
                    elif 'trustpilot' in domain:
                        utm_source = 'trustpilot'
                        utm_medium = 'referral'
                    elif 'chatgpt' in domain or 'openai' in domain:
                        utm_source = 'chatgpt'
                        utm_medium = 'referral'
                    elif 'facebook' in domain:
                        utm_source = 'facebook'
                        utm_medium = 'social'
                    elif 'instagram' in domain:
                        utm_source = 'instagram'
                        utm_medium = 'social'
                    elif 'linkedin' in domain:
                        utm_source = 'linkedin'
                        utm_medium = 'social'
                    elif 'twitter' in domain or 'x.com' in domain:
                        utm_source = 'twitter'
                        utm_medium = 'social'
        
        # Method 5: Check custom fields that might contain traffic data
        if not utm_source or not utm_medium:
            for key, value in raw_data.items():
                if isinstance(value, str) and value:
                    key_lower = key.lower()
                    if 'traffic' in key_lower or 'source' in key_lower:
                        if not utm_source:
                            utm_source = value
                        elif not utm_medium:
                            utm_medium = value
        
        # Clean and validate extracted values
        if utm_source and utm_source.strip():
            source = utm_source.strip().lower()
        if utm_medium and utm_medium.strip():
            medium = utm_medium.strip().lower()
        
        # Normalize common values
        source = self._normalize_source(source)
        medium = self._normalize_medium(medium)
        
        return source, medium
    
    def _normalize_source(self, source):
        """Normalize common source values"""
        source = source.lower().strip()
        
        # Normalize common sources
        if 'google' in source:
            return 'google'
        elif 'facebook' in source or 'fb' in source:
            return 'facebook'
        elif 'instagram' in source or 'ig' in source:
            return 'instagram'
        elif 'linkedin' in source:
            return 'linkedin'
        elif 'twitter' in source or 'x.com' in source:
            return 'twitter'
        elif 'youtube' in source or 'yt' in source:
            return 'youtube'
        elif 'tiktok' in source:
            return 'tiktok'
        elif 'pinterest' in source:
            return 'pinterest'
        elif 'bing' in source:
            return 'bing'
        elif 'yahoo' in source:
            return 'yahoo'
        elif 'direct' in source or source == '(direct)':
            return '(direct)'
        elif 'email' in source:
            return 'email'
        elif 'referral' in source or 'referrer' in source:
            return 'referral'
        
        return source
    
    def _normalize_medium(self, medium):
        """Normalize common medium values"""
        medium = medium.lower().strip()
        
        # Normalize common mediums
        if 'organic' in medium or 'natural' in medium:
            return 'organic'
        elif 'cpc' in medium or 'paid' in medium or 'ppc' in medium:
            return 'cpc'
        elif 'utm' in medium:
            return 'utm'  # Keep utm as utm for Paid Search classification
        elif 'social' in medium:
            return 'social'
        elif 'email' in medium:
            return 'email'
        elif 'referral' in medium:
            return 'referral'
        elif 'typein' in medium or 'direct' in medium:
            return 'typein'
        elif 'banner' in medium or 'display' in medium:
            return 'display'
        elif 'affiliate' in medium:
            return 'affiliate'
        
        return medium
    
    @action(detail=False, methods=['get'])
    def enhanced_analytics(self, request):
        """Get enhanced analytics with better performance metrics and insights"""
        try:
            client_name = request.query_params.get('client_name', '')
            period = int(request.query_params.get('period', 30))
            
            # Calculate date ranges
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period)
            
            # Filter orders
            queryset = self.get_queryset()
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)
            
            period_orders = queryset.filter(date_created__gte=start_date)
            
            # Enhanced metrics
            total_orders = period_orders.count()
            total_revenue = period_orders.aggregate(Sum('total'))['total__sum'] or 0
            avg_order_value = period_orders.aggregate(Avg('total'))['total__avg'] or 0
            
            # Customer metrics
            unique_customers = period_orders.exclude(
                billing_email__isnull=True
            ).values('billing_email').distinct().count()
            
            # Repeat customer analysis
            customer_order_counts = period_orders.exclude(
                billing_email__isnull=True
            ).values('billing_email').annotate(
                order_count=Count('id')
            )
            
            repeat_customers = sum(1 for c in customer_order_counts if c['order_count'] > 1)
            repeat_customer_rate = (repeat_customers / unique_customers * 100) if unique_customers > 0 else 0
            
            # Geographic analysis
            top_countries = period_orders.exclude(
                billing_country__isnull=True
            ).values('billing_country').annotate(
                count=Count('id'),
                revenue=Sum('total')
            ).order_by('-count')[:5]
            
            # Product performance (from order items)
            from .models import WooCommerceOrderItem
            
            order_items = WooCommerceOrderItem.objects.filter(
                order__in=period_orders.values_list('id', flat=True)
            )
            
            top_products = order_items.values('product_name').annotate(
                quantity=Sum('quantity'),
                revenue=Sum('total_price')
            ).order_by('-revenue')[:10]
            
            # Payment method analysis
            payment_methods = period_orders.exclude(
                payment_method__isnull=True
            ).values('payment_method').annotate(
                count=Count('id'),
                revenue=Sum('total'),
                avg_value=Avg('total')
            ).order_by('-revenue')
            
            # Time-based analysis
            hourly_distribution = period_orders.annotate(
                hour=models.functions.ExtractHour('date_created')
            ).values('hour').annotate(
                orders=Count('id'),
                revenue=Sum('total')
            ).order_by('hour')
            
            # Status analysis with revenue
            status_breakdown = period_orders.values('status').annotate(
                count=Count('id'),
                revenue=Sum('total'),
                avg_value=Avg('total')
            ).order_by('-revenue')
            
            # Conversion funnel (simplified)
            # This would ideally come from actual session data
            estimated_sessions = total_orders * 10  # Rough estimate
            conversion_rate = (total_orders / estimated_sessions * 100) if estimated_sessions > 0 else 0

            # Get currency for this client
            currency_code = get_currency_for_client(client_name, period_orders)

            return Response({
                'period': period,
                'currency': currency_code,
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'overview': {
                    'total_orders': total_orders,
                    'total_revenue': float(total_revenue),
                    'avg_order_value': float(avg_order_value),
                    'unique_customers': unique_customers,
                    'repeat_customer_rate': round(repeat_customer_rate, 1),
                    'estimated_conversion_rate': round(conversion_rate, 2)
                },
                'customer_insights': {
                    'repeat_customers': repeat_customers,
                    'new_customers': unique_customers - repeat_customers,
                    'customer_lifetime_value': float(total_revenue / unique_customers) if unique_customers > 0 else 0
                },
                'geographic': {
                    'top_countries': [
                        {
                            'country': item['billing_country'],
                            'orders': item['count'],
                            'revenue': float(item['revenue'] or 0)
                        }
                        for item in top_countries
                    ]
                },
                'product_performance': {
                    'top_products': [
                        {
                            'name': item['product_name'],
                            'quantity': item['quantity'],
                            'revenue': float(item['revenue'] or 0)
                        }
                        for item in top_products
                    ]
                },
                'payment_analysis': {
                    'methods': [
                        {
                            'method': item['payment_method'],
                            'orders': item['count'],
                            'revenue': float(item['revenue'] or 0),
                            'avg_value': float(item['avg_value'] or 0)
                        }
                        for item in payment_methods
                    ]
                },
                'time_analysis': {
                    'hourly_distribution': [
                        {
                            'hour': item['hour'],
                            'orders': item['orders'],
                            'revenue': float(item['revenue'] or 0)
                        }
                        for item in hourly_distribution
                    ]
                },
                'status_breakdown': [
                    {
                        'status': item['status'],
                        'count': item['count'],
                        'revenue': float(item['revenue'] or 0),
                        'avg_value': float(item['avg_value'] or 0)
                    }
                    for item in status_breakdown
                ]
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate enhanced analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def real_time_analytics(self, request):
        """Get real-time analytics for live dashboard updates"""
        try:
            client_name = request.query_params.get('client_name', '')
            
            # Get current time and calculate recent periods
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            yesterday_start = today_start - timedelta(days=1)
            week_start = today_start - timedelta(days=7)
            month_start = today_start - timedelta(days=30)
            
            # Filter orders
            queryset = self.get_queryset()
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)
            
            # Today's metrics
            today_orders = queryset.filter(date_created__gte=today_start)
            today_revenue = today_orders.aggregate(Sum('total'))['total__sum'] or 0
            today_count = today_orders.count()
            
            # Yesterday comparison
            yesterday_orders = queryset.filter(
                date_created__gte=yesterday_start,
                date_created__lt=today_start
            )
            yesterday_revenue = yesterday_orders.aggregate(Sum('total'))['total__sum'] or 0
            yesterday_count = yesterday_orders.count()
            
            # Week metrics
            week_orders = queryset.filter(date_created__gte=week_start)
            week_revenue = week_orders.aggregate(Sum('total'))['total__sum'] or 0
            week_count = week_orders.count()
            
            # Month metrics
            month_orders = queryset.filter(date_created__gte=month_start)
            month_revenue = month_orders.aggregate(Sum('total'))['total__sum'] or 0
            month_count = month_orders.count()
            
            # Recent activity (last 10 orders)
            recent_orders = queryset.order_by('-date_created')[:10]
            recent_activity = [
                {
                    'order_id': order.order_id,
                    'order_number': order.order_number,
                    'client_name': order.client_name,
                    'total': float(order.total or 0),
                    'status': order.status,
                    'date': order.date_created.isoformat(),
                    'customer_name': f"{order.billing_first_name or ''} {order.billing_last_name or ''}".strip()
                }
                for order in recent_orders
            ]
            
            # Hourly breakdown for today
            hourly_breakdown = today_orders.annotate(
                hour=models.functions.ExtractHour('date_created')
            ).values('hour').annotate(
                orders=Count('id'),
                revenue=Sum('total')
            ).order_by('hour')
            
            # Status breakdown for today
            today_status = today_orders.values('status').annotate(
                count=Count('id'),
                revenue=Sum('total')
            ).order_by('-count')
            
            # Calculate growth rates
            day_over_day_revenue = ((today_revenue - yesterday_revenue) / yesterday_revenue * 100) if yesterday_revenue > 0 else 0
            day_over_day_orders = ((today_count - yesterday_count) / yesterday_count * 100) if yesterday_count > 0 else 0
            
            return Response({
                'timestamp': now.isoformat(),
                'periods': {
                    'today': {
                        'orders': today_count,
                        'revenue': float(today_revenue),
                        'start_time': today_start.isoformat()
                    },
                    'yesterday': {
                        'orders': yesterday_count,
                        'revenue': float(yesterday_revenue)
                    },
                    'week': {
                        'orders': week_count,
                        'revenue': float(week_revenue)
                    },
                    'month': {
                        'orders': month_count,
                        'revenue': float(month_revenue)
                    }
                },
                'growth': {
                    'revenue_day_over_day': round(day_over_day_revenue, 1),
                    'orders_day_over_day': round(day_over_day_orders, 1)
                },
                'recent_activity': recent_activity,
                'hourly_breakdown': [
                    {
                        'hour': item['hour'],
                        'orders': item['orders'],
                        'revenue': float(item['revenue'] or 0)
                    }
                    for item in hourly_breakdown
                ],
                'status_breakdown': [
                    {
                        'status': item['status'],
                        'count': item['count'],
                        'revenue': float(item['revenue'] or 0)
                    }
                    for item in today_status
                ]
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate real-time analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def customer_segmentation(self, request):
        """Get customer segmentation analytics based on order behavior"""
        try:
            client_name = request.query_params.get('client_name', '')
            period = int(request.query_params.get('period', 365))  # Default to 1 year
            
            # Calculate date range
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period)
            
            # Filter orders
            queryset = self.get_queryset()
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)
            
            period_orders = queryset.filter(date_created__gte=start_date)
            
            # Customer analysis
            customer_data = period_orders.exclude(
                billing_email__isnull=True
            ).values('billing_email').annotate(
                order_count=Count('id'),
                total_spent=Sum('total'),
                first_order=Min('date_created'),
                last_order=Max('date_created'),
                avg_order_value=Avg('total')
            )
            
            # Segment customers
            segments = {
                'new_customers': [],
                'returning_customers': [],
                'high_value_customers': [],
                'lapsed_customers': []
            }
            
            # Calculate thresholds
            total_customers = len(customer_data)
            if total_customers > 0:
                avg_spend = sum(c['total_spent'] for c in customer_data) / total_customers
                high_value_threshold = avg_spend * 2  # 2x average spend
                
                for customer in customer_data:
                    customer_info = {
                        'email': customer['billing_email'],
                        'order_count': customer['order_count'],
                        'total_spent': float(customer['total_spent'] or 0),
                        'avg_order_value': float(customer['avg_order_value'] or 0),
                        'first_order': customer['first_order'].isoformat() if customer['first_order'] else None,
                        'last_order': customer['last_order'].isoformat() if customer['last_order'] else None
                    }
                    
                    # Determine segment
                    if customer['order_count'] == 1:
                        segments['new_customers'].append(customer_info)
                    elif customer['order_count'] > 1:
                        segments['returning_customers'].append(customer_info)
                    
                    if customer['total_spent'] >= high_value_threshold:
                        segments['high_value_customers'].append(customer_info)
                    
                    # Check if lapsed (no orders in last 90 days)
                    if customer['last_order']:
                        days_since_last = (end_date - customer['last_order']).days
                        if days_since_last > 90:
                            segments['lapsed_customers'].append(customer_info)
            
            # Calculate segment metrics
            segment_metrics = {}
            for segment_name, customers in segments.items():
                if customers:
                    segment_metrics[segment_name] = {
                        'count': len(customers),
                        'percentage': round(len(customers) / total_customers * 100, 1),
                        'total_revenue': sum(c['total_spent'] for c in customers),
                        'avg_order_value': sum(c['avg_order_value'] for c in customers) / len(customers) if customers else 0
                    }
                else:
                    segment_metrics[segment_name] = {
                        'count': 0,
                        'percentage': 0,
                        'total_revenue': 0,
                        'avg_order_value': 0
                    }
            
            # Customer lifetime value analysis
            customer_lifetime_values = []
            for customer in customer_data:
                if customer['first_order'] and customer['last_order']:
                    lifetime_days = (customer['last_order'] - customer['first_order']).days
                    if lifetime_days > 0:
                        customer_lifetime_values.append({
                            'email': customer['billing_email'],
                            'lifetime_days': lifetime_days,
                            'total_spent': float(customer['total_spent'] or 0),
                            'daily_value': float(customer['total_spent'] or 0) / lifetime_days
                        })
            
            # Sort by lifetime value
            customer_lifetime_values.sort(key=lambda x: x['daily_value'], reverse=True)
            
            return Response({
                'period': period,
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'overview': {
                    'total_customers': total_customers,
                    'total_orders': period_orders.count(),
                    'total_revenue': float(period_orders.aggregate(Sum('total'))['total__sum'] or 0)
                },
                'segment_metrics': segment_metrics,
                'segments': {
                    'new_customers': segments['new_customers'][:20],  # Top 20
                    'returning_customers': segments['returning_customers'][:20],
                    'high_value_customers': segments['high_value_customers'][:20],
                    'lapsed_customers': segments['lapsed_customers'][:20]
                },
                'customer_lifetime_value': {
                    'top_customers': customer_lifetime_values[:20],
                    'average_lifetime_days': sum(c['lifetime_days'] for c in customer_lifetime_values) / len(customer_lifetime_values) if customer_lifetime_values else 0
                }
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate customer segmentation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def product_analytics(self, request):
        """Get detailed product performance analytics"""
        try:
            client_name = request.query_params.get('client_name', '')
            period = int(request.query_params.get('period', 30))
            
            # Calculate date range
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period)
            
            # Filter orders
            queryset = self.get_queryset()
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)
            
            period_orders = queryset.filter(date_created__gte=start_date)
            
            # Get order items for the period
            from .models import WooCommerceOrderItem
            
            order_items = WooCommerceOrderItem.objects.filter(
                order__in=period_orders.values_list('id', flat=True)
            )
            
            # Product performance by revenue
            top_products_by_revenue = order_items.values('product_name', 'product_sku').annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum('total_price'),
                order_count=Count('order', distinct=True),
                avg_price=Avg('unit_price')
            ).order_by('-total_revenue')[:20]
            
            # Product performance by quantity
            top_products_by_quantity = order_items.values('product_name', 'product_sku').annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum('total_price'),
                order_count=Count('order', distinct=True),
                avg_price=Avg('unit_price')
            ).order_by('-total_quantity')[:20]
            
            # Product performance by order frequency
            top_products_by_orders = order_items.values('product_name', 'product_sku').annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum('total_price'),
                order_count=Count('order', distinct=True),
                avg_price=Avg('unit_price')
            ).order_by('-order_count')[:20]
            
            # Category analysis (if available)
            # This would require additional product metadata or category fields
            
            # Product growth analysis
            # Compare current period with previous period
            prev_start = start_date - timedelta(days=period)
            prev_orders = queryset.filter(
                date_created__gte=prev_start,
                date_created__lt=start_date
            )
            
            prev_order_items = WooCommerceOrderItem.objects.filter(
                order__in=prev_orders.values_list('id', flat=True)
            )
            
            # Calculate growth for top products
            product_growth = []
            for product in top_products_by_revenue[:10]:
                current_revenue = product['total_revenue'] or 0
                current_quantity = product['total_quantity'] or 0
                
                # Find previous period data
                prev_product = prev_order_items.filter(
                    product_name=product['product_name']
                ).aggregate(
                    total_revenue=Sum('total_price'),
                    total_quantity=Sum('quantity')
                )
                
                prev_revenue = prev_product['total_revenue'] or 0
                prev_quantity = prev_product['total_quantity'] or 0
                
                revenue_growth = ((current_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
                quantity_growth = ((current_quantity - prev_quantity) / prev_quantity * 100) if prev_quantity > 0 else 0
                
                product_growth.append({
                    'product_name': product['product_name'],
                    'product_sku': product['product_sku'],
                    'current_revenue': float(current_revenue),
                    'current_quantity': current_quantity,
                    'current_orders': product['order_count'],
                    'prev_revenue': float(prev_revenue),
                    'prev_quantity': prev_quantity,
                    'revenue_growth': round(revenue_growth, 1),
                    'quantity_growth': round(quantity_growth, 1),
                    'avg_price': float(product['avg_price'] or 0)
                })
            
            # Sort by revenue growth
            product_growth.sort(key=lambda x: x['revenue_growth'], reverse=True)
            
            return Response({
                'period': period,
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'overview': {
                    'total_products': order_items.values('product_name').distinct().count(),
                    'total_quantity_sold': order_items.aggregate(Sum('quantity'))['quantity__sum'] or 0,
                    'total_product_revenue': float(order_items.aggregate(Sum('total_price'))['total_price__sum'] or 0)
                },
                'top_products': {
                    'by_revenue': [
                        {
                            'name': item['product_name'],
                            'sku': item['product_sku'],
                            'quantity': item['total_quantity'],
                            'revenue': float(item['total_revenue'] or 0),
                            'orders': item['order_count'],
                            'avg_price': float(item['avg_price'] or 0)
                        }
                        for item in top_products_by_revenue
                    ],
                    'by_quantity': [
                        {
                            'name': item['product_name'],
                            'sku': item['product_sku'],
                            'quantity': item['total_quantity'],
                            'revenue': float(item['total_revenue'] or 0),
                            'orders': item['order_count'],
                            'avg_price': float(item['avg_price'] or 0)
                        }
                        for item in top_products_by_quantity
                    ],
                    'by_orders': [
                        {
                            'name': item['product_name'],
                            'sku': item['product_sku'],
                            'quantity': item['total_quantity'],
                            'revenue': float(item['total_revenue'] or 0),
                            'orders': item['order_count'],
                            'avg_price': float(item['avg_price'] or 0)
                        }
                        for item in top_products_by_orders
                    ]
                },
                'growth_analysis': product_growth
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate product analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def inventory_analytics(self, request):
        """Get inventory and stock performance analytics"""
        try:
            client_name = request.query_params.get('client_name', '')
            period = int(request.query_params.get('period', 30))
            
            # Calculate date range
            end_date = timezone.now()
            start_date = end_date - timedelta(days=period)
            
            # Filter orders
            queryset = self.get_queryset()
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)
            
            period_orders = queryset.filter(date_created__gte=start_date)
            
            # Get order items for the period
            from .models import WooCommerceOrderItem
            
            order_items = WooCommerceOrderItem.objects.filter(
                order__in=period_orders.values_list('id', flat=True)
            )
            
            # Product performance analysis
            product_performance = order_items.values('product_name', 'product_sku').annotate(
                total_quantity=Sum('quantity'),
                total_revenue=Sum('total_price'),
                order_count=Count('order', distinct=True),
                avg_price=Avg('unit_price'),
                min_price=Min('unit_price'),
                max_price=Max('unit_price')
            ).order_by('-total_revenue')
            
            # Calculate inventory turnover (simplified)
            # In a real scenario, you'd have actual inventory levels
            inventory_turnover = []
            for product in product_performance[:20]:
                # Estimate inventory turnover based on order frequency
                turnover_rate = product['order_count'] / period * 30  # Monthly turnover
                
                inventory_turnover.append({
                    'product_name': product['product_name'],
                    'sku': product['product_sku'],
                    'quantity_sold': product['total_quantity'],
                    'revenue': float(product['total_revenue'] or 0),
                    'orders': product['order_count'],
                    'avg_price': float(product['avg_price'] or 0),
                    'price_range': {
                        'min': float(product['min_price'] or 0),
                        'max': float(product['max_price'] or 0)
                    },
                    'estimated_turnover_rate': round(turnover_rate, 2)
                })
            
            # Seasonal analysis (monthly breakdown)
            monthly_sales = order_items.annotate(
                month=models.functions.ExtractMonth('order__date_created')
            ).values('month').annotate(
                quantity=Sum('quantity'),
                revenue=Sum('total_price'),
                orders=Count('order', distinct=True)
            ).order_by('month')
            
            # Product category analysis (if categories are available)
            # This would require additional product metadata
            
            # Stock level recommendations (simplified)
            stock_recommendations = []
            for product in inventory_turnover[:10]:
                # Simple stock recommendation based on turnover
                if product['estimated_turnover_rate'] > 2:
                    recommendation = 'High turnover - maintain good stock levels'
                elif product['estimated_turnover_rate'] > 1:
                    recommendation = 'Moderate turnover - monitor stock levels'
                else:
                    recommendation = 'Low turnover - consider reducing stock'
                
                stock_recommendations.append({
                    'product_name': product['product_name'],
                    'sku': product['sku'],
                    'turnover_rate': product['estimated_turnover_rate'],
                    'recommendation': recommendation,
                    'quantity_sold': product['quantity_sold']
                })
            
            return Response({
                'period': period,
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'overview': {
                    'total_products': product_performance.count(),
                    'total_quantity_sold': sum(p['total_quantity'] for p in product_performance),
                    'total_revenue': float(sum(p['total_revenue'] for p in product_performance)),
                    'avg_products_per_order': order_items.count() / period_orders.count() if period_orders.count() > 0 else 0
                },
                'product_performance': inventory_turnover,
                'monthly_trends': [
                    {
                        'month': item['month'],
                        'quantity': item['quantity'],
                        'revenue': float(item['revenue'] or 0),
                        'orders': item['orders']
                    }
                    for item in monthly_sales
                ],
                'stock_recommendations': stock_recommendations
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate inventory analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def forecasting_analytics(self, request):
        """Get predictive analytics and forecasting for business planning"""
        try:
            client_name = request.query_params.get('client_name', '')
            forecast_periods = int(request.query_params.get('forecast_periods', 12))  # Default to 12 months
            
            # Get historical data for the last 2 years
            end_date = timezone.now()
            start_date = end_date - timedelta(days=730)  # 2 years
            
            # Filter orders
            queryset = self.get_queryset()
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)
            
            historical_orders = queryset.filter(date_created__gte=start_date)
            
            # Monthly aggregation for trend analysis
            monthly_data = historical_orders.annotate(
                year_month=models.functions.TruncMonth('date_created')
            ).values('year_month').annotate(
                orders=Count('id'),
                revenue=Sum('total'),
                customers=Count('billing_email', distinct=True)
            ).order_by('year_month')
            
            # Convert to list for easier processing
            monthly_list = list(monthly_data)
            
            if len(monthly_list) < 6:
                return Response({
                    'error': 'Insufficient historical data for forecasting. Need at least 6 months of data.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Simple trend analysis and forecasting
            # In a production environment, you'd use more sophisticated forecasting models
            
            # Calculate moving averages
            def calculate_moving_average(data, window=3):
                moving_averages = []
                for i in range(len(data)):
                    if i < window - 1:
                        moving_averages.append(None)
                    else:
                        window_data = data[i-window+1:i+1]
                        avg = sum(window_data) / len(window_data)
                        moving_averages.append(avg)
                return moving_averages
            
            # Extract revenue data
            revenue_data = [float(item['revenue'] or 0) for item in monthly_list]
            orders_data = [item['orders'] for item in monthly_list]
            customers_data = [item['customers'] for item in monthly_list]
            
            # Calculate moving averages
            revenue_ma = calculate_moving_average(revenue_data, 3)
            orders_ma = calculate_moving_average(orders_data, 3)
            customers_ma = calculate_moving_average(customers_data, 3)
            
            # Simple linear trend projection
            def simple_forecast(data, periods):
                if len(data) < 2:
                    return []
                
                # Calculate simple linear trend
                x_values = list(range(len(data)))
                y_values = data
                
                # Simple linear regression
                n = len(x_values)
                sum_x = sum(x_values)
                sum_y = sum(y_values)
                sum_xy = sum(x * y for x, y in zip(x_values, y_values))
                sum_x2 = sum(x * x for x in x_values)
                
                if n * sum_x2 - sum_x * sum_x == 0:
                    return []
                
                slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
                intercept = (sum_y - slope * sum_x) / n
                
                # Generate forecast
                forecast = []
                for i in range(len(data), len(data) + periods):
                    forecast.append(intercept + slope * i)
                
                return forecast
            
            # Generate forecasts
            revenue_forecast = simple_forecast(revenue_data, forecast_periods)
            orders_forecast = simple_forecast(orders_data, forecast_periods)
            customers_forecast = simple_forecast(customers_data, forecast_periods)
            
            # Calculate growth rates
            def calculate_growth_rate(data):
                if len(data) < 2:
                    return 0
                return ((data[-1] - data[0]) / data[0] * 100) if data[0] != 0 else 0
            
            revenue_growth = calculate_growth_rate(revenue_data)
            orders_growth = calculate_growth_rate(orders_data)
            customers_growth = calculate_growth_rate(customers_data)
            
            # Seasonal patterns (simplified)
            seasonal_patterns = {}
            for i, month_data in enumerate(monthly_list):
                month = month_data['year_month'].month
                if month not in seasonal_patterns:
                    seasonal_patterns[month] = {
                        'orders': [],
                        'revenue': [],
                        'customers': []
                    }
                
                seasonal_patterns[month]['orders'].append(month_data['orders'])
                seasonal_patterns[month]['revenue'].append(float(month_data['revenue'] or 0))
                seasonal_patterns[month]['customers'].append(month_data['customers'])
            
            # Calculate seasonal averages
            seasonal_averages = {}
            for month, data in seasonal_patterns.items():
                seasonal_averages[month] = {
                    'orders': sum(data['orders']) / len(data['orders']) if data['orders'] else 0,
                    'revenue': sum(data['revenue']) / len(data['revenue']) if data['revenue'] else 0,
                    'customers': sum(data['customers']) / len(data['customers']) if data['customers'] else 0
                }
            
            # Business insights and recommendations
            insights = []
            
            if revenue_growth > 20:
                insights.append("Strong revenue growth - consider expanding inventory and marketing")
            elif revenue_growth > 10:
                insights.append("Good revenue growth - maintain current strategies")
            elif revenue_growth > 0:
                insights.append("Moderate growth - look for opportunities to accelerate")
            else:
                insights.append("Revenue declining - review pricing, marketing, and product strategy")
            
            if orders_growth > customers_growth:
                insights.append("Increasing order frequency - customers are buying more")
            elif customers_growth > orders_growth:
                insights.append("Growing customer base - focus on retention and repeat purchases")
            
            # Identify best performing months
            best_month = max(seasonal_averages.items(), key=lambda x: x[1]['revenue'])
            insights.append(f"Best performing month: {best_month[0]} (${best_month[1]['revenue']:.2f} avg)")
            
            return Response({
                'forecast_periods': forecast_periods,
                'historical_data': {
                    'months': [item['year_month'].isoformat() for item in monthly_list],
                    'revenue': revenue_data,
                    'orders': orders_data,
                    'customers': customers_data,
                    'revenue_moving_average': revenue_ma,
                    'orders_moving_average': orders_ma,
                    'customers_moving_average': customers_ma
                },
                'forecasts': {
                    'revenue': revenue_forecast,
                    'orders': orders_forecast,
                    'customers': customers_forecast
                },
                'growth_analysis': {
                    'revenue_growth': round(revenue_growth, 1),
                    'orders_growth': round(orders_growth, 1),
                    'customers_growth': round(customers_growth, 1)
                },
                'seasonal_patterns': seasonal_averages,
                'insights': insights,
                'recommendations': [
                    "Monitor forecast accuracy and adjust models as needed",
                    "Use seasonal patterns for inventory planning",
                    "Focus on customer retention strategies",
                    "Consider expanding product offerings based on growth trends"
                ]
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate forecasting analytics: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def debug_orders(self, request):
        """Debug endpoint to see what data is available in WooCommerce orders"""
        try:
            # Get a few recent orders to examine their structure
            orders = WooCommerceOrder.objects.all()[:5]
            
            debug_data = []
            for order in orders:
                order_info = {
                    'order_id': order.order_id,
                    'client_name': order.client_name,
                    'date_created': order.date_created.isoformat(),
                    'raw_data_keys': list(order.raw_data.keys()) if order.raw_data else [],
                    'has_utm_source': 'utm_source' in (order.raw_data or {}),
                    'has_utm_medium': 'utm_medium' in (order.raw_data or {}),
                    'note': order.raw_data.get('note', '')[:200] if order.raw_data else '',
                    'meta_data_keys': [item.get('key', '') for item in order.raw_data.get('meta_data', [])] if order.raw_data else []
                }
                debug_data.append(order_info)
            
            return Response({
                'message': 'Debug information for recent WooCommerce orders',
                'orders_analyzed': len(debug_data),
                'orders': debug_data
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to debug orders: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _get_detailed_orders_for_export(self, orders_queryset):
        """Get detailed order data for CSV export with channel classification"""
        # Get all active classification rules
        classifications = ChannelClassification.objects.filter(is_active=True)
        classification_map = {
            (rule.source.lower(), rule.medium.lower()): rule for rule in classifications
        }
        
        orders_data = []
        
        for order in orders_queryset.select_related().order_by('-order_date'):
            # Extract source/medium from order metadata, referrer, or UTM parameters
            source, medium = self._extract_traffic_source(order)
            
            # Find matching classification (case-insensitive)
            classification = classification_map.get((source.lower(), medium.lower()))
            
            # Use classification or default to 'Direct'
            channel_type = classification.channel_type if classification else 'Direct'
            
            orders_data.append({
                'order_id': order.order_id,
                'order_date': order.order_date.strftime('%Y-%m-%d %H:%M:%S') if order.order_date else '',
                'order_total': float(order.order_total) if order.order_total else 0.0,
                'attribution_utm_source': order.attribution_utm_source or '',
                'attribution_source_type': order.attribution_source_type or '',
                'channel_type': channel_type,
                'billing_email': order.billing_email or '',
                'status': order.status or '',
                'currency': order.currency or '',
                'client_name': order.client_name or ''
            })
        
        return orders_data

    @action(detail=False, methods=['get'])
    def validate_data_coverage(self, request):
        """Validate data coverage and detect missing orders or channels"""
        client_name = request.GET.get('client_name') if hasattr(request, 'GET') else getattr(request, 'query_params', {}).get('client_name')
        
        queryset = self.get_queryset()
        if client_name:
            queryset = queryset.filter(client_name__icontains=client_name)
        
        # Check date coverage
        date_stats = queryset.aggregate(
            earliest_order=Min('date_created'),
            latest_order=Max('date_created'),
            total_orders=Count('id')
        )
        
        # Check for gaps in daily data (last 30 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=30)
        
        daily_counts = queryset.filter(
            date_created__gte=start_date
        ).annotate(
            date=TruncDate('date_created')
        ).values('date').annotate(
            order_count=Count('id')
        ).order_by('date')
        
        # Check channel coverage
        channel_stats = queryset.filter(
            date_created__gte=start_date
        ).values('attribution_utm_source', 'attribution_source_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Check for missing Paid Search orders (google + utm)
        paid_search_count = queryset.filter(
            attribution_utm_source='google',
            attribution_source_type='utm',
            date_created__gte=start_date
        ).count()
        
        # Check for unclassified orders (no attribution data)
        unclassified_count = queryset.filter(
            date_created__gte=start_date
        ).filter(
            Q(attribution_utm_source__isnull=True) | Q(attribution_utm_source='') |
            Q(attribution_source_type__isnull=True) | Q(attribution_source_type='')
        ).count()
        
        warnings = []
        if paid_search_count == 0:
            warnings.append("⚠️ No Paid Search orders found in the last 30 days")
        
        if unclassified_count > 0:
            warnings.append(f"⚠️ {unclassified_count} orders have no attribution data")
        
        # Check for data gaps
        expected_days = 30
        actual_days = daily_counts.count()
        if actual_days < expected_days:
            warnings.append(f"⚠️ Only {actual_days} days have data in the last {expected_days} days")
        
        return Response({
            'date_coverage': {
                'earliest_order': date_stats['earliest_order'],
                'latest_order': date_stats['latest_order'],
                'total_orders': date_stats['total_orders'],
                'days_with_data': actual_days
            },
            'channel_coverage': {
                'paid_search_orders': paid_search_count,
                'unclassified_orders': unclassified_count,
                'top_sources': list(channel_stats[:10])
            },
            'warnings': warnings,
            'daily_breakdown': list(daily_counts)
        })


class WooCommerceSyncLogViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint for viewing sync logs"""
    queryset = WooCommerceSyncLog.objects.all()
    serializer_class = WooCommerceSyncLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = WooCommerceSyncLog.objects.all()
        request = getattr(self, 'request', None)
        if request:
            client_name = request.GET.get('client_name') if hasattr(request, 'GET') else getattr(request, 'query_params', {}).get('client_name')
            if client_name:
                queryset = queryset.filter(client_name__icontains=client_name)
        return queryset.order_by('-created_at')