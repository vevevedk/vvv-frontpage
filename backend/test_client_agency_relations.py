#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import Agency, Company, User, Account
from django.contrib.auth.hashers import make_password

def test_client_agency_relations():
    print("🧪 Testing Client-Agency Relationships")
    print("=" * 50)
    
    # 1. Test Agency Creation and Hierarchy
    print("\n1. Testing Agency Hierarchy...")
    
    # Create Veveve super agency
    veveve, created = Agency.objects.get_or_create(
        name='Veveve',
        defaults={
            'is_super_agency': True,
            'email': 'admin@veveve.dk',
            'website': 'https://veveve.dk'
        }
    )
    print(f"✅ Veveve super agency: {veveve}")
    
    # Create client agencies
    client_agency_1, created = Agency.objects.get_or_create(
        name='Client Agency 1',
        defaults={
            'is_super_agency': False,
            'email': 'admin@clientagency1.com',
            'website': 'https://clientagency1.com'
        }
    )
    print(f"✅ Client Agency 1: {client_agency_1}")
    
    client_agency_2, created = Agency.objects.get_or_create(
        name='Client Agency 2',
        defaults={
            'is_super_agency': False,
            'email': 'admin@clientagency2.com',
            'website': 'https://clientagency2.com'
        }
    )
    print(f"✅ Client Agency 2: {client_agency_2}")
    
    # 2. Test Company Creation and Agency Assignment
    print("\n2. Testing Company-Agency Relationships...")
    
    # Companies under Veveve directly
    veveve_company_1, created = Company.objects.get_or_create(
        name='Direct Veveve Client 1',
        defaults={
            'agency': veveve,
            'email': 'info@directclient1.com',
            'website': 'https://directclient1.com'
        }
    )
    print(f"✅ Direct Veveve Client 1: {veveve_company_1}")
    
    veveve_company_2, created = Company.objects.get_or_create(
        name='Direct Veveve Client 2',
        defaults={
            'agency': veveve,
            'email': 'info@directclient2.com',
            'website': 'https://directclient2.com'
        }
    )
    print(f"✅ Direct Veveve Client 2: {veveve_company_2}")
    
    # Companies under Client Agency 1
    client1_company_1, created = Company.objects.get_or_create(
        name='Client Agency 1 Company 1',
        defaults={
            'agency': client_agency_1,
            'email': 'info@client1company1.com',
            'website': 'https://client1company1.com'
        }
    )
    print(f"✅ Client Agency 1 Company 1: {client1_company_1}")
    
    client1_company_2, created = Company.objects.get_or_create(
        name='Client Agency 1 Company 2',
        defaults={
            'agency': client_agency_1,
            'email': 'info@client1company2.com',
            'website': 'https://client1company2.com'
        }
    )
    print(f"✅ Client Agency 1 Company 2: {client1_company_2}")
    
    # Companies under Client Agency 2
    client2_company_1, created = Company.objects.get_or_create(
        name='Client Agency 2 Company 1',
        defaults={
            'agency': client_agency_2,
            'email': 'info@client2company1.com',
            'website': 'https://client2company1.com'
        }
    )
    print(f"✅ Client Agency 2 Company 1: {client2_company_1}")
    
    # 3. Test User Creation with Different Roles
    print("\n3. Testing User Roles and Permissions...")
    
    # Veveve super admin
    veveve_admin, created = User.objects.get_or_create(
        email='admin@veveve.dk',
        defaults={
            'username': 'veveve_admin',
            'first_name': 'Veveve',
            'last_name': 'Admin',
            'password': make_password('testpass123'),
            'agency': veveve,
            'role': 'super_admin',
            'is_active': True,
            'email_verified': True
        }
    )
    print(f"✅ Veveve Super Admin: {veveve_admin.email} ({veveve_admin.role})")
    
    # Client Agency 1 admin
    client1_admin, created = User.objects.get_or_create(
        email='admin@clientagency1.com',
        defaults={
            'username': 'client1_admin',
            'first_name': 'Client',
            'last_name': 'Admin 1',
            'password': make_password('testpass123'),
            'agency': client_agency_1,
            'role': 'agency_admin',
            'is_active': True,
            'email_verified': True
        }
    )
    print(f"✅ Client Agency 1 Admin: {client1_admin.email} ({client1_admin.role})")
    
    # Client Agency 1 user
    client1_user, created = User.objects.get_or_create(
        email='user@clientagency1.com',
        defaults={
            'username': 'client1_user',
            'first_name': 'Client',
            'last_name': 'User 1',
            'password': make_password('testpass123'),
            'agency': client_agency_1,
            'role': 'agency_user',
            'is_active': True,
            'email_verified': True
        }
    )
    print(f"✅ Client Agency 1 User: {client1_user.email} ({client1_user.role})")
    
    # Company admin for Client Agency 1 Company 1
    company1_admin, created = User.objects.get_or_create(
        email='admin@client1company1.com',
        defaults={
            'username': 'company1_admin',
            'first_name': 'Company',
            'last_name': 'Admin 1',
            'password': make_password('testpass123'),
            'agency': client_agency_1,
            'company': client1_company_1,
            'role': 'company_admin',
            'is_active': True,
            'email_verified': True
        }
    )
    print(f"✅ Company 1 Admin: {company1_admin.email} ({company1_admin.role})")
    
    # Company user for Client Agency 1 Company 1
    company1_user, created = User.objects.get_or_create(
        email='user@client1company1.com',
        defaults={
            'username': 'company1_user',
            'first_name': 'Company',
            'last_name': 'User 1',
            'password': make_password('testpass123'),
            'agency': client_agency_1,
            'company': client1_company_1,
            'role': 'company_user',
            'is_active': True,
            'email_verified': True
        }
    )
    print(f"✅ Company 1 User: {company1_user.email} ({company1_user.role})")
    
    # 4. Test Account Creation
    print("\n4. Testing Account Creation...")
    
    # Accounts for Client Agency 1 Company 1
    account1, created = Account.objects.get_or_create(
        name='Google Ads Account 1',
        company=client1_company_1,
        defaults={
            'account_type': 'google_ads',
            'account_id': '123456789',
            'is_active': True
        }
    )
    print(f"✅ Google Ads Account for {client1_company_1.name}: {account1}")
    
    account2, created = Account.objects.get_or_create(
        name='Facebook Ads Account 1',
        company=client1_company_1,
        defaults={
            'account_type': 'facebook_ads',
            'account_id': '987654321',
            'is_active': True
        }
    )
    print(f"✅ Facebook Ads Account for {client1_company_1.name}: {account2}")
    
    # 5. Test Permission Methods
    print("\n5. Testing Permission Methods...")
    
    # Test Veveve admin permissions
    print(f"Veveve Admin can access Veveve: {veveve_admin.can_access_agency(veveve)}")
    print(f"Veveve Admin can access Client Agency 1: {veveve_admin.can_access_agency(client_agency_1)}")
    print(f"Veveve Admin can access Client Agency 1 Company 1: {veveve_admin.can_access_company(client1_company_1)}")
    print(f"Veveve Admin has full access: {veveve_admin.has_full_access()}")
    
    # Test Client Agency 1 admin permissions
    print(f"Client Agency 1 Admin can access Veveve: {client1_admin.can_access_agency(veveve)}")
    print(f"Client Agency 1 Admin can access Client Agency 1: {client1_admin.can_access_agency(client_agency_1)}")
    print(f"Client Agency 1 Admin can access Client Agency 1 Company 1: {client1_admin.can_access_company(client1_company_1)}")
    print(f"Client Agency 1 Admin can access Client Agency 2 Company 1: {client1_admin.can_access_company(client2_company_1)}")
    
    # Test Company admin permissions
    print(f"Company 1 Admin can access Client Agency 1: {company1_admin.can_access_agency(client_agency_1)}")
    print(f"Company 1 Admin can access Client Agency 1 Company 1: {company1_admin.can_access_company(client1_company_1)}")
    print(f"Company 1 Admin can access Client Agency 1 Company 2: {company1_admin.can_access_company(client1_company_2)}")
    print(f"Company 1 Admin can access account: {company1_admin.can_access_account(account1)}")
    
    # 6. Test Data Isolation
    print("\n6. Testing Data Isolation...")
    
    # Count companies per agency
    veveve_companies = Company.objects.filter(agency=veveve)
    client1_companies = Company.objects.filter(agency=client_agency_1)
    client2_companies = Company.objects.filter(agency=client_agency_2)
    
    print(f"Veveve has {veveve_companies.count()} companies: {[c.name for c in veveve_companies]}")
    print(f"Client Agency 1 has {client1_companies.count()} companies: {[c.name for c in client1_companies]}")
    print(f"Client Agency 2 has {client2_companies.count()} companies: {[c.name for c in client2_companies]}")
    
    # Count users per agency
    veveve_users = User.objects.filter(agency=veveve)
    client1_users = User.objects.filter(agency=client_agency_1)
    client2_users = User.objects.filter(agency=client_agency_2)
    
    print(f"Veveve has {veveve_users.count()} users")
    print(f"Client Agency 1 has {client1_users.count()} users")
    print(f"Client Agency 2 has {client2_users.count()} users")
    
    # 7. Summary
    print("\n7. Summary...")
    print(f"📊 Total Agencies: {Agency.objects.count()}")
    print(f"🏢 Total Companies: {Company.objects.count()}")
    print(f"👥 Total Users: {User.objects.count()}")
    print(f"🔐 Total Accounts: {Account.objects.count()}")
    
    print("\n🎉 Client-Agency Relationship Test Complete!")
    print("=" * 50)

if __name__ == '__main__':
    test_client_agency_relations() 