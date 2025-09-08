from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Setting
from .serializers import SettingSerializer
from users.models import Company
from users.serializers import CompanySerializer

# Create your views here.

class SettingViewSet(viewsets.ModelViewSet):
    queryset = Setting.objects.all()
    serializer_class = SettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def get_by_key(self, request):
        key = request.query_params.get('key')
        try:
            setting = Setting.objects.get(key=key)
            return Response(self.get_serializer(setting).data)
        except Setting.DoesNotExist:
            return Response({'error': 'Setting not found'}, status=404)

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]
