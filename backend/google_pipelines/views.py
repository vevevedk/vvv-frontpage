from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count

from .models import GA4Daily, GSCSearchData
from .serializers import (
    GA4DailySerializer, GA4DailySummarySerializer,
    GSCSearchDataSerializer, GSCSearchDataSummarySerializer,
)


class GA4DailyViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for GA4 daily analytics data."""

    serializer_class = GA4DailySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Tenant-filtered queryset mirroring DataPipelineViewSet."""
        user = self.request.user
        qs = GA4Daily.objects.select_related(
            'account_configuration__account__company__agency',
        )

        # Role-based filtering
        if user.role == 'super_admin':
            pass  # see everything
        elif user.role in ('agency_admin', 'agency_user'):
            if user.access_all_companies:
                qs = qs.filter(
                    account_configuration__account__company__agency=user.agency,
                )
            else:
                qs = qs.filter(
                    account_configuration__account__company__in=user.accessible_companies.all(),
                )
        elif user.role in ('company_admin', 'company_user'):
            qs = qs.filter(
                account_configuration__account__company=user.company,
            )
        else:
            return GA4Daily.objects.none()

        # Query-param filters
        params = self.request.query_params

        config_id = params.get('account_configuration')
        if config_id:
            qs = qs.filter(account_configuration_id=config_id)

        date_from = params.get('date_from')
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = params.get('date_to')
        if date_to:
            qs = qs.filter(date__lte=date_to)

        source = params.get('source')
        if source:
            qs = qs.filter(source=source)

        medium = params.get('medium')
        if medium:
            qs = qs.filter(medium=medium)

        country = params.get('country')
        if country:
            qs = qs.filter(country=country)

        device = params.get('device_category')
        if device:
            qs = qs.filter(device_category=device)

        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Aggregated metrics for the current filtered queryset."""
        qs = self.get_queryset()

        agg = qs.aggregate(
            total_sessions=Sum('sessions'),
            total_users=Sum('total_users'),
            total_new_users=Sum('new_users'),
            total_engaged_sessions=Sum('engaged_sessions'),
            total_conversions=Sum('conversions'),
            total_purchase_revenue=Sum('purchase_revenue'),
            avg_engagement_rate=Avg('engagement_rate'),
            row_count=Count('id'),
        )

        # Replace None with 0 for empty querysets
        for key in agg:
            if agg[key] is None:
                agg[key] = 0

        serializer = GA4DailySummarySerializer(agg)
        return Response(serializer.data)


class GSCSearchDataViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only viewset for GSC search analytics data."""

    serializer_class = GSCSearchDataSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Tenant-filtered queryset mirroring GA4DailyViewSet."""
        user = self.request.user
        qs = GSCSearchData.objects.select_related(
            'account_configuration__account__company__agency',
        )

        # Role-based filtering
        if user.role == 'super_admin':
            pass  # see everything
        elif user.role in ('agency_admin', 'agency_user'):
            if user.access_all_companies:
                qs = qs.filter(
                    account_configuration__account__company__agency=user.agency,
                )
            else:
                qs = qs.filter(
                    account_configuration__account__company__in=user.accessible_companies.all(),
                )
        elif user.role in ('company_admin', 'company_user'):
            qs = qs.filter(
                account_configuration__account__company=user.company,
            )
        else:
            return GSCSearchData.objects.none()

        # Query-param filters
        params = self.request.query_params

        config_id = params.get('account_configuration')
        if config_id:
            qs = qs.filter(account_configuration_id=config_id)

        date_from = params.get('date_from')
        if date_from:
            qs = qs.filter(date__gte=date_from)

        date_to = params.get('date_to')
        if date_to:
            qs = qs.filter(date__lte=date_to)

        query = params.get('query')
        if query:
            qs = qs.filter(query__icontains=query)

        page_url = params.get('page_url')
        if page_url:
            qs = qs.filter(page__icontains=page_url)

        return qs

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Aggregated metrics for the current filtered queryset."""
        qs = self.get_queryset()

        agg = qs.aggregate(
            total_clicks=Sum('clicks'),
            total_impressions=Sum('impressions'),
            avg_ctr=Avg('ctr'),
            avg_position=Avg('position'),
            unique_queries=Count('query', distinct=True),
            unique_pages=Count('page', distinct=True),
            row_count=Count('id'),
        )

        # Replace None with 0 for empty querysets
        for key in agg:
            if agg[key] is None:
                agg[key] = 0

        serializer = GSCSearchDataSummarySerializer(agg)
        return Response(serializer.data)
