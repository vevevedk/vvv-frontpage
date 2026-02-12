from rest_framework import serializers
from users.serializers import AccountConfigurationSerializer
from .models import GA4Daily, GSCSearchData


class GA4DailySerializer(serializers.ModelSerializer):
    account_configuration = AccountConfigurationSerializer(read_only=True)

    class Meta:
        model = GA4Daily
        fields = [
            'id',
            'account_configuration',
            'date',
            'source',
            'medium',
            'campaign',
            'device_category',
            'country',
            'sessions',
            'total_users',
            'new_users',
            'engaged_sessions',
            'conversions',
            'purchase_revenue',
            'engagement_rate',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class GA4DailySummarySerializer(serializers.Serializer):
    total_sessions = serializers.IntegerField()
    total_users = serializers.IntegerField()
    total_new_users = serializers.IntegerField()
    total_engaged_sessions = serializers.IntegerField()
    total_conversions = serializers.IntegerField()
    total_purchase_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    avg_engagement_rate = serializers.FloatField()
    row_count = serializers.IntegerField()


class GSCSearchDataSerializer(serializers.ModelSerializer):
    account_configuration = AccountConfigurationSerializer(read_only=True)

    class Meta:
        model = GSCSearchData
        fields = [
            'id',
            'account_configuration',
            'date',
            'query',
            'page',
            'clicks',
            'impressions',
            'ctr',
            'position',
            'created_at',
            'updated_at',
        ]
        read_only_fields = fields


class GSCSearchDataSummarySerializer(serializers.Serializer):
    total_clicks = serializers.IntegerField()
    total_impressions = serializers.IntegerField()
    avg_ctr = serializers.FloatField()
    avg_position = serializers.FloatField()
    unique_queries = serializers.IntegerField()
    unique_pages = serializers.IntegerField()
    row_count = serializers.IntegerField()
