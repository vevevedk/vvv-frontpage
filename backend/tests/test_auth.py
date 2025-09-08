import json
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import User, Company
from unittest.mock import patch

class AuthenticationTests(TestCase):
    def setUp(self):
        """Set up test data and disable throttling"""
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.refresh_url = reverse('token_refresh')
        self.test_user_data = {
            'email': 'test@example.com',
            'password': 'TestPass123!',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'admin',
            'company': {
                'name': 'Test Company',
                'website': 'https://testcompany.com'
            }
        }

        # Disable throttling for all tests
        self.login_patcher = patch('authentication.views.LoginView.throttle_classes', [])
        self.register_patcher = patch('authentication.views.RegisterView.throttle_classes', [])
        self.refresh_patcher = patch('authentication.views.TokenRefreshView.throttle_classes', [])
        
        self.login_patcher.start()
        self.register_patcher.start()
        self.refresh_patcher.start()

    def tearDown(self):
        """Stop all patches"""
        self.login_patcher.stop()
        self.register_patcher.stop()
        self.refresh_patcher.stop()

    def test_user_registration(self):
        """Test user registration endpoint"""
        response = self.client.post(
            self.register_url,
            data=json.dumps(self.test_user_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        self.assertIn('user', response.data)

        # Verify user was created
        user = User.objects.get(email=self.test_user_data['email'])
        self.assertEqual(user.first_name, self.test_user_data['first_name'])
        self.assertEqual(user.last_name, self.test_user_data['last_name'])
        self.assertEqual(user.role, self.test_user_data['role'])

        # Verify company was created
        company = Company.objects.get(name=self.test_user_data['company']['name'])
        self.assertEqual(company.website, self.test_user_data['company']['website'])

    def test_invalid_registration(self):
        """Test registration with invalid data"""
        invalid_data = {
            'email': 'invalid-email',
            'password': 'short',
            'first_name': '',
            'last_name': '',
            'role': 'invalid',
            'company': {
                'name': '',
                'website': 'invalid-url'
            }
        }
        response = self.client.post(
            self.register_url,
            data=json.dumps(invalid_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('message', response.data['error'])
        self.assertIn('code', response.data['error'])
        self.assertIn('category', response.data['error'])

    def test_user_login(self):
        """Test user login endpoint"""
        # First register a user
        self.client.post(
            self.register_url,
            data=json.dumps(self.test_user_data),
            content_type='application/json'
        )

        # Then try to login
        login_data = {
            'email': self.test_user_data['email'],
            'password': self.test_user_data['password']
        }
        response = self.client.post(
            self.login_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        self.assertIn('user', response.data)

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        invalid_data = {
            'email': 'nonexistent@example.com',
            'password': 'wrongpass'
        }
        response = self.client.post(
            self.login_url,
            data=json.dumps(invalid_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('message', response.data['error'])
        self.assertIn('code', response.data['error'])
        self.assertIn('category', response.data['error'])

    def test_token_refresh(self):
        """Test token refresh endpoint"""
        # First register and login to get tokens
        self.client.post(
            self.register_url,
            data=json.dumps(self.test_user_data),
            content_type='application/json'
        )

        login_data = {
            'email': self.test_user_data['email'],
            'password': self.test_user_data['password']
        }
        login_response = self.client.post(
            self.login_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        refresh_token = login_response.data['refresh_token']

        # Test token refresh
        refresh_data = {'refresh_token': refresh_token}
        response = self.client.post(
            self.refresh_url,
            data=json.dumps(refresh_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)

    def test_invalid_token_refresh(self):
        """Test token refresh with invalid token"""
        invalid_data = {'refresh_token': 'invalid_token'}
        response = self.client.post(
            self.refresh_url,
            data=json.dumps(invalid_data),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('error', response.data)
        self.assertIn('message', response.data['error'])
        self.assertIn('code', response.data['error'])
        self.assertIn('category', response.data['error'])

    def test_protected_endpoint(self):
        """Test protected endpoint access"""
        # First register and login to get token
        self.client.post(
            self.register_url,
            data=json.dumps(self.test_user_data),
            content_type='application/json'
        )

        login_data = {
            'email': self.test_user_data['email'],
            'password': self.test_user_data['password']
        }
        login_response = self.client.post(
            self.login_url,
            data=json.dumps(login_data),
            content_type='application/json'
        )
        access_token = login_response.data['access_token']

        # Test protected endpoint
        response = self.client.get(
            '/api/users/me/',
            HTTP_AUTHORIZATION=f'Bearer {access_token}'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_invalid_token(self):
        """Test invalid token handling"""
        response = self.client.get(
            '/api/users/me/',
            HTTP_AUTHORIZATION='Bearer invalid-token'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED) 