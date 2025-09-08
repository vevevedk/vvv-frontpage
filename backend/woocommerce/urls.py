from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .views import (
    WooCommerceConfigViewSet,
    WooCommerceJobViewSet,
    WooCommerceOrderViewSet,
    WooCommerceSyncLogViewSet,
    ChannelClassificationViewSet
)

router = DefaultRouter()
router.register(r'configs', WooCommerceConfigViewSet)
router.register(r'jobs', WooCommerceJobViewSet)
router.register(r'orders', WooCommerceOrderViewSet)
router.register(r'sync-logs', WooCommerceSyncLogViewSet)
router.register(r'channels/classifications', ChannelClassificationViewSet)

@api_view(['GET'])
def channels_report_view(request):
    """Direct access to channels report endpoint"""
    from .views import WooCommerceOrderViewSet
    viewset = WooCommerceOrderViewSet()
    viewset.request = request
    viewset.format_kwarg = None
    return viewset.channels_report(request)

urlpatterns = [
    path('', include(router.urls)),
    
    # Add direct access to channels report endpoint
    path('channels/report/', channels_report_view, name='channels-report-direct'),
]



