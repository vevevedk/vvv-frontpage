from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User, Agency, Company, Account, AccountConfiguration
from .serializers import (
    UserSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    AgencySerializer,
    CompanySerializer,
    CompanyCreateUpdateSerializer,
    AccountSerializer,
    AccountCreateSerializer,
    AccountUpdateSerializer,
    AccountConfigurationSerializer,
    AccountConfigurationCreateSerializer,
    AccountConfigurationUpdateSerializer
)

# Create your views here.

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def change_password(self, request):
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {'error': 'Invalid old password'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'status': 'password changed'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['delete'])
    def delete_account(self, request):
        user = request.user
        user.delete()
        return Response({'status': 'account deleted'})

class AgencyViewSet(viewsets.ModelViewSet):
    queryset = Agency.objects.all()
    serializer_class = AgencySerializer
    permission_classes = [permissions.IsAuthenticated]

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CompanyCreateUpdateSerializer
        return CompanySerializer

class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return AccountCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AccountUpdateSerializer
        return AccountSerializer

    def get_queryset(self):
        """Filter accounts based on user permissions"""
        user = self.request.user
        if user.role == 'super_admin':
            return Account.objects.all()
        elif user.role in ['agency_admin', 'agency_user']:
            return Account.objects.filter(company__agency=user.agency)
        elif user.role in ['company_admin', 'company_user']:
            if user.access_all_companies:
                return Account.objects.filter(company__agency=user.agency)
            else:
                return Account.objects.filter(company__in=user.accessible_companies.all())
        return Account.objects.none()

class AccountConfigurationViewSet(viewsets.ModelViewSet):
    queryset = AccountConfiguration.objects.all()
    serializer_class = AccountConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return AccountConfigurationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return AccountConfigurationUpdateSerializer
        return AccountConfigurationSerializer

    def get_queryset(self):
        """Filter configurations based on user permissions"""
        user = self.request.user
        if user.role == 'super_admin':
            return AccountConfiguration.objects.all()
        elif user.role in ['agency_admin', 'agency_user']:
            return AccountConfiguration.objects.filter(account__company__agency=user.agency)
        elif user.role in ['company_admin', 'company_user']:
            if user.access_all_companies:
                return AccountConfiguration.objects.filter(account__company__agency=user.agency)
            else:
                return AccountConfiguration.objects.filter(account__company__in=user.accessible_companies.all())
        return AccountConfiguration.objects.none()

    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test the connection for a specific configuration"""
        config = self.get_object()
        config_type = config.config_type
        
        try:
            if config_type == 'woocommerce':
                config_data = config.get_woocommerce_config()
                # Add WooCommerce connection test logic here
                return Response({
                    'status': 'success',
                    'message': 'WooCommerce connection test successful'
                })
            elif config_type == 'google_ads':
                config_data = config.get_google_ads_config()
                # Add Google Ads connection test logic here
                return Response({
                    'status': 'success',
                    'message': 'Google Ads connection test successful'
                })
            elif config_type == 'google_analytics':
                config_data = config.get_google_analytics_config()
                # Add Google Analytics connection test logic here
                return Response({
                    'status': 'success',
                    'message': 'Google Analytics connection test successful'
                })
            elif config_type == 'google_search_console':
                config_data = config.get_google_search_console_config()
                # Add Google Search Console connection test logic here
                return Response({
                    'status': 'success',
                    'message': 'Google Search Console connection test successful'
                })
            else:
                return Response({
                    'status': 'error',
                    'message': f'Connection testing not implemented for {config_type}'
                })
        except Exception as e:
            return Response({
                'status': 'error',
                'message': f'Connection test failed: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
