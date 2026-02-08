"""
URL configuration for api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.http import JsonResponse
from users.views import (
    UserViewSet, CompanyViewSet, AgencyViewSet, AccountViewSet, 
    AccountConfigurationViewSet
)
from woocommerce.views import (
    WooCommerceConfigViewSet, WooCommerceJobViewSet, 
    WooCommerceOrderViewSet, WooCommerceSyncLogViewSet,
    ChannelClassificationViewSet
)
from pipelines.views import (
    DataPipelineViewSet, PipelineJobViewSet, PipelineLogViewSet,
    DataQualityCheckViewSet, PipelineAnalyticsViewSet
)
from google_pipelines.views import GA4DailyViewSet
from authentication.views import (
    LoginView, RegisterView, TokenRefreshView
)
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from api.health_view import health_check

def test_connection(request):
    """Simple test endpoint to verify backend connectivity"""
    return JsonResponse({
        'status': 'success',
        'message': 'Django backend is running and accessible',
        'timestamp': '2025-08-20T12:00:00Z'
    })

@csrf_exempt
@require_http_methods(["POST"])
def simple_login(request):
    """Simple login endpoint that bypasses CSRF completely"""
    from django.contrib.auth import authenticate
    from rest_framework_simplejwt.tokens import RefreshToken
    from django.http import JsonResponse
    import json
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return JsonResponse({'error': 'Email and password required'}, status=400)
        
        user = authenticate(username=email, password=password)
        if not user:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
        
        refresh = RefreshToken.for_user(user)
        return JsonResponse({
            'access_token': str(refresh.access_token),
            'refresh_token': str(refresh),
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'email_verified': user.email_verified
            }
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

router = DefaultRouter()

# User management
router.register(r'users', UserViewSet)
router.register(r'companies', CompanyViewSet)
router.register(r'agencies', AgencyViewSet)
router.register(r'accounts', AccountViewSet)
router.register(r'account-configurations', AccountConfigurationViewSet)

# WooCommerce
router.register(r'woocommerce/configs', WooCommerceConfigViewSet)
router.register(r'woocommerce/jobs', WooCommerceJobViewSet)
router.register(r'woocommerce/orders', WooCommerceOrderViewSet)
router.register(r'woocommerce/logs', WooCommerceSyncLogViewSet)
router.register(r'woocommerce/channels/classifications', ChannelClassificationViewSet)

# Pipelines
router.register(r'pipelines', DataPipelineViewSet, basename='pipeline')
router.register(r'pipeline-jobs', PipelineJobViewSet, basename='pipeline-job')
router.register(r'pipeline-logs', PipelineLogViewSet, basename='pipeline-log')
router.register(r'pipeline-quality-checks', DataQualityCheckViewSet, basename='pipeline-quality-check')
router.register(r'pipeline-analytics', PipelineAnalyticsViewSet, basename='pipeline-analytics')

# GA4
router.register(r'ga4/daily', GA4DailyViewSet, basename='ga4-daily')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    
    # Health check endpoint (no auth required)
    path('api/health/', health_check, name='health-check'),
    
    # Authentication endpoints
    path('api/auth/login/', csrf_exempt(LoginView.as_view()), name='auth-login'),
    path('api/auth/register/', csrf_exempt(RegisterView.as_view()), name='auth-register'),
    path('api/auth/refresh/', csrf_exempt(TokenRefreshView.as_view()), name='auth-refresh'),
    
    # Simple login endpoint (bypasses CSRF completely)
    path('api/simple-login/', simple_login, name='simple-login'),
    
    path('api/test/', test_connection, name='test_connection'),
]
