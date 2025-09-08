#!/usr/bin/env python
"""
Test login endpoint
"""
import requests
import json

def test_login():
    print("🔐 Testing Login Endpoint")
    print("=" * 40)
    
    # Test credentials
    test_users = [
        {"email": "andreas@veveve.dk", "password": "testpass123"},
        {"email": "admin@example.com", "password": "testpass123"},
        {"email": "test@example.com", "password": "testpass123"},
    ]
    
    base_url = "http://127.0.0.1:8001/api"
    
    for user in test_users:
        print(f"\n🧪 Testing login for: {user['email']}")
        
        try:
            response = requests.post(
                f"{base_url}/auth/login/",
                json=user,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login successful!")
                print(f"   Access token: {data['access_token'][:50]}...")
                print(f"   User role: {data['user']['role']}")
                
                # Test pipeline endpoint with the token
                headers = {
                    "Authorization": f"Bearer {data['access_token']}",
                    "Content-Type": "application/json"
                }
                
                pipeline_response = requests.get(f"{base_url}/pipelines/", headers=headers)
                if pipeline_response.status_code == 200:
                    print(f"✅ Pipeline endpoint accessible!")
                else:
                    print(f"❌ Pipeline endpoint failed: {pipeline_response.status_code}")
                    
            else:
                print(f"❌ Login failed: {response.status_code}")
                print(f"   Response: {response.text}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_login() 