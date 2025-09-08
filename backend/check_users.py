#!/usr/bin/env python
"""
Check existing users in the database
"""
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings.dev')
django.setup()

from users.models import User

def check_users():
    print("👥 Checking Users in Database")
    print("=" * 40)
    
    users = User.objects.all()
    print(f"📊 Found {users.count()} users")
    
    for user in users:
        print(f"  - {user.email} (ID: {user.id})")
        print(f"    Role: {user.role}")
        print(f"    Email verified: {user.email_verified}")
        if user.company:
            print(f"    Company: {user.company.name}")
        if user.agency:
            print(f"    Agency: {user.agency.name}")
        print()

if __name__ == "__main__":
    check_users() 