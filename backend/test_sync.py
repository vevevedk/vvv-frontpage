#!/usr/bin/env python
"""
Test script for pipeline sync functionality
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import User
from pipelines.models import DataPipeline, PipelineJob
from pipelines.views import DataPipelineViewSet
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

def test_sync_functionality():
    print("🧪 Testing Pipeline Sync Functionality")
    print("=" * 50)
    
    # Get a user and create a token
    user = User.objects.first()
    if not user:
        print("❌ No users found")
        return
    
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    print(f"👤 Using user: {user.email}")
    print(f"🔑 Access token: {access_token[:50]}...")
    
    # Get the test pipeline
    pipeline = DataPipeline.objects.first()
    if not pipeline:
        print("❌ No pipelines found")
        return
    
    print(f"📊 Testing pipeline: {pipeline.name}")
    print(f"   Type: {pipeline.pipeline_type}")
    print(f"   Account: {pipeline.account.name}")
    print(f"   Config: {pipeline.account_configuration.name}")
    
    # Create a mock request
    factory = APIRequestFactory()
    request = factory.post(f'/api/pipelines/{pipeline.id}/sync_now/')
    request.user = user
    
    # Test the sync_now action
    viewset = DataPipelineViewSet()
    viewset.request = request
    viewset.action = 'sync_now'
    
    try:
        # Get the pipeline object
        pipeline_obj = viewset.get_object()
        print(f"✅ Pipeline object retrieved: {pipeline_obj.name}")
        
        # Test the sync_now method
        response = viewset.sync_now(request, pk=pipeline.id)
        
        print(f"📤 Response status: {response.status_code}")
        print(f"📤 Response data: {response.data}")
        
        if response.status_code == 200:
            print("✅ Sync request successful!")
            if 'job_id' in response.data:
                print(f"✅ Job ID returned: {response.data['job_id']}")
                
                # Check if the job was actually created
                try:
                    job = PipelineJob.objects.get(id=response.data['job_id'])
                    print(f"✅ Job found in database: {job.id}")
                    print(f"   Status: {job.status}")
                    print(f"   Job type: {job.job_type}")
                    print(f"   Pipeline: {job.pipeline.name}")
                except PipelineJob.DoesNotExist:
                    print("❌ Job not found in database")
            else:
                print("❌ No job_id in response")
        else:
            print("❌ Sync request failed")
            
    except Exception as e:
        print(f"❌ Error during sync test: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_sync_functionality() 