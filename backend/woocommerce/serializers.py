from rest_framework import serializers
from .models import (
    WooCommerceJob,
    WooCommerceOrder,
    WooCommerceOrderItem,
    WooCommerceSyncLog,
    ChannelClassification
)


class WooCommerceOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WooCommerceOrderItem
        fields = [
            'id', 'product_id', 'product_name', 'product_sku',
            'quantity', 'unit_price', 'total_price', 'subtotal', 'tax_class',
            'tax_total', 'meta_data', 'created_at'
        ]


class WooCommerceOrderSerializer(serializers.ModelSerializer):
    items = WooCommerceOrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = WooCommerceOrder
        fields = [
            'id', 'client_name', 'order_id', 'order_number', 'order_date', 'paid_date',
            'status', 'shipping_total', 'shipping_tax_total', 'fee_total', 'fee_tax_total',
            'tax_total', 'cart_discount', 'order_discount', 'discount_total', 'order_total',
            'order_subtotal', 'order_key', 'order_currency', 'payment_method', 'payment_method_title',
            'transaction_id', 'customer_ip_address', 'customer_user_agent', 'shipping_method',
            'customer_id', 'customer_user', 'customer_email', 'billing_first_name', 'billing_last_name',
            'billing_company', 'billing_email', 'billing_phone', 'billing_address_1', 'billing_address_2',
            'billing_postcode', 'billing_city', 'billing_state', 'billing_country',
            'shipping_first_name', 'shipping_last_name', 'shipping_company', 'shipping_phone',
            'shipping_address_1', 'shipping_address_2', 'shipping_postcode', 'shipping_city',
            'shipping_state', 'shipping_country', 'customer_note', 'wt_import_key',
            'attribution_device_type', 'attribution_referrer', 'attribution_session_count',
            'attribution_session_entry', 'attribution_session_pages', 'attribution_session_start_time',
            'attribution_source_type', 'attribution_user_agent', 'attribution_utm_source',
            # Legacy fields for backward compatibility
            'total', 'currency', 'customer_first_name', 'customer_last_name', 'billing_address',
            'shipping_address', 'date_created', 'date_modified', 'date_completed',
            'items', 'created_at', 'updated_at'
        ]


class WooCommerceJobSerializer(serializers.ModelSerializer):
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = WooCommerceJob
        fields = [
            'id', 'client_name', 'job_type', 'job_type_display',
            'status', 'status_display', 'scheduled_at', 'started_at',
            'completed_at', 'error_message', 'orders_processed',
            'orders_created', 'orders_updated', 'created_by',
            'created_at', 'updated_at'
        ]


class WooCommerceSyncLogSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    
    class Meta:
        model = WooCommerceSyncLog
        fields = [
            'id', 'client_name', 'job', 'level', 'level_display',
            'message', 'details', 'created_at'
        ] 


class ChannelClassificationSerializer(serializers.ModelSerializer):
    """Serializer for ChannelClassification model"""
    
    class Meta:
        model = ChannelClassification
        fields = [
            'id', 'source', 'medium', 'source_medium', 
            'channel', 'channel_type', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        # Ensure source and medium combination is unique
        source = data.get('source')
        medium = data.get('medium')
        
        if source and medium:
            existing = ChannelClassification.objects.filter(
                source=source, 
                medium=medium
            ).exclude(id=self.instance.id if self.instance else None)
            
            if existing.exists():
                raise serializers.ValidationError(
                    f"A classification rule already exists for source '{source}' and medium '{medium}'"
                )
        
        return data 