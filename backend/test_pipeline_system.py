#!/usr/bin/env python
"""
Test script for the new pipeline system
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import Agency, Company, Account, AccountConfiguration, User
from pipelines.models import DataPipeline, PipelineJob
from pipelines.serializers import DataPipelineSerializer

def test_pipeline_system():
    print("🧪 Testing New Pipeline System")
    print("=" * 50)
    
    # Check if we have any accounts
    accounts = Account.objects.all()
    print(f"📊 Found {accounts.count()} accounts")
    
    for account in accounts:
        print(f"  - {account.name} ({account.company.name})")
        
        # Check configurations
        configs = account.configurations.all()
        print(f"    Configurations: {configs.count()}")
        for config in configs:
            print(f"      - {config.name} ({config.config_type})")
    
    # Check pipelines
    pipelines = DataPipeline.objects.all()
    print(f"\n📊 Found {pipelines.count()} pipelines")
    
    for pipeline in pipelines:
        print(f"  - {pipeline.name} ({pipeline.pipeline_type})")
        print(f"    Account: {pipeline.account.name}")
        print(f"    Config: {pipeline.account_configuration.name}")
        print(f"    Schedule: {pipeline.schedule}")
        print(f"    Enabled: {pipeline.enabled}")
    
    # Check jobs
    jobs = PipelineJob.objects.all()
    print(f"\n📊 Found {jobs.count()} pipeline jobs")
    
    for job in jobs:
        pipeline_name = job.pipeline.name if job.pipeline else "Unknown"
        print(f"  - {pipeline_name} - {job.job_type} ({job.status})")
    
    print("\n✅ Pipeline system test completed!")

def create_test_pipeline():
    """Create a test pipeline if none exist"""
    print("\n🔧 Creating test pipeline...")
    
    # Get first account and configuration
    account = Account.objects.first()
    if not account:
        print("❌ No accounts found. Please create an account first.")
        return
    
    config = AccountConfiguration.objects.filter(account=account, config_type='woocommerce').first()
    if not config:
        print("❌ No WooCommerce configuration found. Please create a configuration first.")
        return
    
    # Create test pipeline
    pipeline = DataPipeline.objects.create(
        name="Test WooCommerce Pipeline",
        account=account,
        account_configuration=config,
        pipeline_type='woocommerce',
        schedule='manual',
        enabled=True,
        created_by=User.objects.first()
    )
    
    print(f"✅ Created test pipeline: {pipeline.name}")
    print(f"   Account: {pipeline.account.name}")
    print(f"   Config: {pipeline.account_configuration.name}")
    print(f"   Type: {pipeline.pipeline_type}")
    print(f"   Schedule: {pipeline.schedule}")

if __name__ == "__main__":
    test_pipeline_system()
    
    # Create test pipeline if none exist
    if DataPipeline.objects.count() == 0:
        create_test_pipeline()
        test_pipeline_system() 