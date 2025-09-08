from rest_framework import serializers
from .models import DataPipeline, PipelineJob, PipelineLog, DataQualityCheck, PipelineAnalytics
from users.serializers import AccountSerializer, AccountConfigurationSerializer


class DataPipelineSerializer(serializers.ModelSerializer):
    account = AccountSerializer(read_only=True)
    account_id = serializers.IntegerField(write_only=True)
    account_configuration = AccountConfigurationSerializer(read_only=True)
    account_configuration_id = serializers.IntegerField(write_only=True)
    pipeline_type_display = serializers.CharField(source='get_pipeline_type_display', read_only=True)
    schedule_display = serializers.CharField(source='get_schedule_display', read_only=True)
    next_run = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = DataPipeline
        fields = [
            'id', 'name', 'account', 'account_id', 'account_configuration', 'account_configuration_id',
            'pipeline_type', 'pipeline_type_display', 'schedule', 'schedule_display', 'enabled',
            'schedule_config', 'config', 'next_run', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate that account_configuration belongs to the account"""
        account_id = data.get('account_id')
        account_configuration_id = data.get('account_configuration_id')
        
        if account_id and account_configuration_id:
            from users.models import Account, AccountConfiguration
            try:
                account = Account.objects.get(id=account_id)
                config = AccountConfiguration.objects.get(id=account_configuration_id)
                
                if config.account_id != account_id:
                    raise serializers.ValidationError(
                        "Account configuration must belong to the selected account"
                    )
                
                # Validate pipeline type matches config type
                pipeline_type = data.get('pipeline_type')
                if pipeline_type and pipeline_type != config.config_type:
                    raise serializers.ValidationError(
                        f"Pipeline type '{pipeline_type}' must match configuration type '{config.config_type}'"
                    )
                    
            except (Account.DoesNotExist, AccountConfiguration.DoesNotExist):
                raise serializers.ValidationError("Invalid account or configuration")
        
        return data
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class PipelineJobSerializer(serializers.ModelSerializer):
    pipeline = DataPipelineSerializer(read_only=True)
    pipeline_id = serializers.IntegerField(write_only=True)
    job_type_display = serializers.CharField(source='get_job_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    progress_percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = PipelineJob
        fields = [
            'id', 'pipeline', 'pipeline_id', 'job_type', 'job_type_display', 'status', 'status_display',
            'scheduled_at', 'started_at', 'completed_at', 'error_message', 'total_items', 'processed_items',
            'created_items', 'updated_items', 'failed_items', 'parameters', 'progress_percentage',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'started_at', 'completed_at']


class PipelineLogSerializer(serializers.ModelSerializer):
    pipeline = DataPipelineSerializer(read_only=True)
    job = PipelineJobSerializer(read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    
    class Meta:
        model = PipelineLog
        fields = [
            'id', 'pipeline', 'job', 'level', 'level_display', 'message', 'details', 'created_at'
        ]
        read_only_fields = ['created_at']


class DataQualityCheckSerializer(serializers.ModelSerializer):
    pipeline = DataPipelineSerializer(read_only=True)
    check_type_display = serializers.CharField(source='get_check_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = DataQualityCheck
        fields = [
            'id', 'pipeline', 'check_type', 'check_type_display', 'status', 'status_display',
            'score', 'details', 'created_at'
        ]
        read_only_fields = ['created_at']


class PipelineAnalyticsSerializer(serializers.ModelSerializer):
    pipeline = DataPipelineSerializer(read_only=True)
    
    class Meta:
        model = PipelineAnalytics
        fields = [
            'id', 'pipeline', 'date', 'total_jobs', 'successful_jobs', 'failed_jobs',
            'total_items_processed', 'avg_job_duration', 'data_quality_score', 'created_at'
        ]
        read_only_fields = ['created_at'] 