#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import Agency, Company, User

def setup_veveve():
    # Create Veveve super agency
    veveve, created = Agency.objects.get_or_create(
        name='Veveve',
        defaults={
            'is_super_agency': True,
            'email': 'admin@veveve.dk',
            'website': 'https://veveve.dk'
        }
    )
    
    if created:
        print(f"✅ Created Veveve super agency: {veveve}")
    else:
        print(f"✅ Veveve super agency already exists: {veveve}")
    
    # Update existing companies to belong to Veveve
    companies = Company.objects.filter(agency__isnull=True)
    for company in companies:
        company.agency = veveve
        company.save()
    
    print(f"✅ Updated {companies.count()} companies to Veveve agency")
    
    # Update existing user to be a super admin
    users = User.objects.all()
    for user in users:
        user.agency = veveve
        user.role = 'super_admin'
        user.save()
    
    print(f"✅ Updated {users.count()} users to Veveve super admin role")
    
    # Create a test client agency
    test_agency, created = Agency.objects.get_or_create(
        name='Test Client Agency',
        defaults={
            'is_super_agency': False,
            'email': 'admin@testagency.com',
            'website': 'https://testagency.com'
        }
    )
    
    if created:
        print(f"✅ Created test client agency: {test_agency}")
        
        # Create a test company for the client agency
        test_company, created = Company.objects.get_or_create(
            name='Test Company',
            defaults={
                'agency': test_agency,
                'email': 'info@testcompany.com',
                'website': 'https://testcompany.com'
            }
        )
        
        if created:
            print(f"✅ Created test company: {test_company}")
    
    print("\n🎉 Setup complete!")
    print(f"📊 Agencies: {Agency.objects.count()}")
    print(f"🏢 Companies: {Company.objects.count()}")
    print(f"👥 Users: {User.objects.count()}")

if __name__ == '__main__':
    setup_veveve() 