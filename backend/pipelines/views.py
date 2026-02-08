from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import DataPipeline, PipelineJob, PipelineLog, DataQualityCheck, PipelineAnalytics
from .serializers import (
    DataPipelineSerializer, PipelineJobSerializer, PipelineLogSerializer,
    DataQualityCheckSerializer, PipelineAnalyticsSerializer
)
from users.models import User, Account, AccountConfiguration


class DataPipelineViewSet(viewsets.ModelViewSet):
    """ViewSet for managing data pipelines"""
    serializer_class = DataPipelineSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter pipelines based on user access"""
        user = self.request.user
        
        # Super admin can see all pipelines
        if user.role == 'super_admin':
            return DataPipeline.objects.all()
        
        # Agency admin can see pipelines for their agency's companies
        if user.role == 'agency_admin':
            if user.access_all_companies:
                return DataPipeline.objects.filter(account__company__agency=user.agency)
            else:
                return DataPipeline.objects.filter(
                    account__company__in=user.accessible_companies.all()
                )
        
        # Agency user can see pipelines for their accessible companies
        if user.role == 'agency_user':
            if user.access_all_companies:
                return DataPipeline.objects.filter(account__company__agency=user.agency)
            else:
                return DataPipeline.objects.filter(
                    account__company__in=user.accessible_companies.all()
                )
        
        # Company admin can see pipelines for their company
        if user.role == 'company_admin':
            return DataPipeline.objects.filter(account__company=user.company)
        
        # Company user can see pipelines for their company
        if user.role == 'company_user':
            return DataPipeline.objects.filter(account__company=user.company)
        
        return DataPipeline.objects.none()
    
    def perform_create(self, serializer):
        """Set the created_by user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test the pipeline connection"""
        pipeline = self.get_object()
        
        try:
            # Test the account configuration connection
            config = pipeline.account_configuration
            
            if pipeline.pipeline_type == 'woocommerce':
                # Test WooCommerce connection
                woocommerce_config = config.get_woocommerce_config()
                if not woocommerce_config:
                    return Response({
                        'success': False,
                        'message': 'Invalid WooCommerce configuration'
                    })
                
                # Import and test the connection
                from woocommerce.tasks import test_woocommerce_connection
                success, message = test_woocommerce_connection(woocommerce_config)
                
                return Response({
                    'success': success,
                    'message': message
                })
            
            elif pipeline.pipeline_type == 'google_analytics':
                property_id = config.config_data.get('property_id')
                if not property_id:
                    return Response({
                        'success': False,
                        'message': 'No property_id configured'
                    })

                from google_pipelines.clients.ga4 import test_ga4_connection
                success, message = test_ga4_connection(property_id)

                return Response({
                    'success': success,
                    'message': message
                })

            return Response({
                'success': False,
                'message': f'Connection testing not implemented for {pipeline.pipeline_type}'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Connection test failed: {str(e)}'
            })
    
    @action(detail=True, methods=['post'])
    def sync_now(self, request, pk=None):
        """Trigger an immediate sync for the pipeline"""
        pipeline = self.get_object()
        
        try:
            # Create a new job
            job = PipelineJob.objects.create(
                pipeline=pipeline,
                job_type='sync',
                status='pending',
                scheduled_at=timezone.now(),
                created_by=request.user
            )
            
            # Trigger the appropriate sync task based on pipeline type
            if pipeline.pipeline_type == 'woocommerce':
                from woocommerce.tasks import sync_woocommerce_config
                # Get the account configuration
                config = pipeline.account_configuration
                
                try:
                    # Run sync synchronously to get immediate results
                    result = sync_woocommerce_config(config.id, 'manual_sync')
                    
                    if result.get('success'):
                        # Update job status to completed
                        job.status = 'completed'
                        job.completed_at = timezone.now()
                        job.orders_processed = result.get('orders_processed', 0)
                        job.orders_created = result.get('orders_created', 0)
                        job.orders_updated = result.get('orders_updated', 0)
                        job.save()
                        
                        return Response({
                            'success': True,
                            'message': f'Sync completed successfully! {result.get("orders_processed", 0)} orders processed',
                            'job_id': job.id,
                            'orders_processed': result.get('orders_processed', 0),
                            'orders_created': result.get('orders_created', 0),
                            'orders_updated': result.get('orders_updated', 0)
                        })
                    else:
                        # Update job status to failed
                        job.status = 'failed'
                        job.error_message = result.get('error', 'Unknown error')
                        job.completed_at = timezone.now()
                        job.save()
                        
                        return Response({
                            'success': False,
                            'message': f'Sync failed: {result.get("error", "Unknown error")}',
                            'job_id': job.id
                        })
                        
                except Exception as sync_error:
                    # Update job status to failed
                    job.status = 'failed'
                    job.error_message = str(sync_error)
                    job.completed_at = timezone.now()
                    job.save()
                    
                    return Response({
                        'success': False,
                        'message': f'Failed to start sync: {str(sync_error)}',
                        'job_id': job.id
                    })

            elif pipeline.pipeline_type == 'google_analytics':
                from google_pipelines.tasks import sync_ga4_config
                config = pipeline.account_configuration

                try:
                    result = sync_ga4_config(config.id)

                    if result.get('success'):
                        job.status = 'completed'
                        job.completed_at = timezone.now()
                        job.processed_items = result.get('rows_processed', 0)
                        job.created_items = result.get('rows_created', 0)
                        job.updated_items = result.get('rows_updated', 0)
                        job.save()

                        return Response({
                            'success': True,
                            'message': f'GA4 sync completed! {result.get("rows_processed", 0)} rows processed',
                            'job_id': job.id,
                            'rows_processed': result.get('rows_processed', 0),
                            'rows_created': result.get('rows_created', 0),
                            'rows_updated': result.get('rows_updated', 0),
                        })
                    else:
                        job.status = 'failed'
                        job.error_message = result.get('error', 'Unknown error')
                        job.completed_at = timezone.now()
                        job.save()

                        return Response({
                            'success': False,
                            'message': f'GA4 sync failed: {result.get("error", "Unknown error")}',
                            'job_id': job.id,
                        })

                except Exception as sync_error:
                    job.status = 'failed'
                    job.error_message = str(sync_error)
                    job.completed_at = timezone.now()
                    job.save()

                    return Response({
                        'success': False,
                        'message': f'Failed to start GA4 sync: {str(sync_error)}',
                        'job_id': job.id,
                    })

            return Response({
                'success': True,
                'message': 'Sync job created successfully',
                'job_id': job.id
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to start sync: {str(e)}'
            })
    
    @action(detail=False, methods=['get'])
    def available_accounts(self, request):
        """Get accounts available to the current user"""
        user = request.user
        
        if user.role == 'super_admin':
            accounts = Account.objects.all()
        elif user.role in ['agency_admin', 'agency_user']:
            if user.access_all_companies:
                accounts = Account.objects.filter(company__agency=user.agency)
            else:
                accounts = Account.objects.filter(company__in=user.accessible_companies.all())
        elif user.role in ['company_admin', 'company_user']:
            accounts = Account.objects.filter(company=user.company)
        else:
            accounts = Account.objects.none()
        
        from users.serializers import AccountSerializer
        return Response(AccountSerializer(accounts, many=True).data)
    
    @action(detail=False, methods=['get'])
    def available_configurations(self, request):
        """Get account configurations available to the current user"""
        account_id = request.query_params.get('account_id')
        pipeline_type = request.query_params.get('pipeline_type')
        
        if not account_id:
            return Response({'error': 'account_id is required'}, status=400)
        
        user = request.user
        account = Account.objects.get(id=account_id)
        
        # Check if user has access to this account
        if not user.can_access_account(account):
            return Response({'error': 'Access denied'}, status=403)
        
        configurations = AccountConfiguration.objects.filter(account=account)
        
        if pipeline_type:
            configurations = configurations.filter(config_type=pipeline_type)
        
        from users.serializers import AccountConfigurationSerializer
        return Response(AccountConfigurationSerializer(configurations, many=True).data)


class PipelineJobViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing pipeline jobs"""
    serializer_class = PipelineJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter jobs based on user access to pipelines"""
        user = self.request.user
        
        # Get accessible pipelines first
        pipeline_viewset = DataPipelineViewSet()
        pipeline_viewset.request = self.request
        accessible_pipelines = pipeline_viewset.get_queryset()
        
        return PipelineJob.objects.filter(pipeline__in=accessible_pipelines)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a running job"""
        job = self.get_object()
        
        if job.status == 'running':
            job.status = 'cancelled'
            job.save()
            return Response({'success': True, 'message': 'Job cancelled'})
        else:
            return Response({
                'success': False,
                'message': 'Only running jobs can be cancelled'
            })


class PipelineLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing pipeline logs"""
    serializer_class = PipelineLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter logs based on user access to pipelines"""
        user = self.request.user
        
        # Get accessible pipelines first
        pipeline_viewset = DataPipelineViewSet()
        pipeline_viewset.request = self.request
        accessible_pipelines = pipeline_viewset.get_queryset()
        
        return PipelineLog.objects.filter(pipeline__in=accessible_pipelines)


class DataQualityCheckViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing data quality checks"""
    serializer_class = DataQualityCheckSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter quality checks based on user access to pipelines"""
        user = self.request.user
        
        # Get accessible pipelines first
        pipeline_viewset = DataPipelineViewSet()
        pipeline_viewset.request = self.request
        accessible_pipelines = pipeline_viewset.get_queryset()
        
        return DataQualityCheck.objects.filter(pipeline__in=accessible_pipelines)


class PipelineAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing pipeline analytics"""
    serializer_class = PipelineAnalyticsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter analytics based on user access to pipelines"""
        user = self.request.user
        
        # Get accessible pipelines first
        pipeline_viewset = DataPipelineViewSet()
        pipeline_viewset.request = self.request
        accessible_pipelines = pipeline_viewset.get_queryset()
        
        return PipelineAnalytics.objects.filter(pipeline__in=accessible_pipelines)
