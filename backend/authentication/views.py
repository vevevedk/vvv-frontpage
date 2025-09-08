from django.shortcuts import render
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import LoginSerializer, RegisterSerializer
from users.models import User, Company
from django.utils import timezone
from .errors import (
    ErrorCode, ErrorCategory,
    authentication_error, validation_error,
    server_error, not_found_error
)
from .throttling import LoginRateThrottle, RegisterRateThrottle, TokenRefreshRateThrottle
from core.security import SecurityEventLogger
import logging

logger = logging.getLogger('authentication')

# Create your views here.

class LoginView(APIView):
    permission_classes = []
    throttle_classes = [LoginRateThrottle]
    
    def post(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            if not serializer.is_valid():
                SecurityEventLogger.log_auth_attempt(
                    serializer.data.get('email'),
                    False,
                    'Invalid data'
                )
                return validation_error(
                    message="Invalid login data",
                    code=ErrorCode.INVALID_EMAIL,
                    details=serializer.errors
                )

            user = authenticate(
                username=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )
            
            if not user:
                SecurityEventLogger.log_auth_attempt(
                    serializer.validated_data['email'],
                    False,
                    'Invalid credentials'
                )
                return authentication_error(
                    message="Invalid credentials",
                    code=ErrorCode.INVALID_CREDENTIALS
                )

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            SecurityEventLogger.log_auth_attempt(
                user.email,
                True
            )
            
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'role': user.role
                }
            })
        except Exception as e:
            logger.error(f"Login error: {str(e)}", exc_info=True)
            return server_error(
                message="An unexpected error occurred during login",
                code=ErrorCode.UNEXPECTED_ERROR,
                details={"error": str(e)}
            )

class RegisterView(APIView):
    permission_classes = []
    throttle_classes = [RegisterRateThrottle]
    
    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if not serializer.is_valid():
                SecurityEventLogger.log_auth_attempt(
                    serializer.data.get('email'),
                    False,
                    'Invalid registration data'
                )
                return validation_error(
                    message="Invalid registration data",
                    code=ErrorCode.INVALID_EMAIL,
                    details=serializer.errors
                )

            # Create company if provided
            company = None
            if 'company' in serializer.validated_data:
                try:
                    company_data = serializer.validated_data.pop('company')
                    company = Company.objects.create(**company_data)
                except Exception as e:
                    logger.error(f"Company creation error: {str(e)}", exc_info=True)
                    return validation_error(
                        message="Failed to create company",
                        code=ErrorCode.INVALID_COMPANY_DATA,
                        details={"error": str(e)}
                    )
            
            try:
                # Create user with email as username
                user_data = serializer.validated_data.copy()
                user = User.objects.create_user(
                    username=user_data['email'],
                    email=user_data['email'],
                    password=user_data['password'],
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                    role=user_data['role'],
                    phone=user_data.get('phone', ''),
                    company=company
                )
                
                # Generate JWT tokens
                refresh = RefreshToken.for_user(user)
                
                SecurityEventLogger.log_auth_attempt(
                    user.email,
                    True,
                    'Registration successful'
                )
                
                return Response({
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'role': user.role
                    }
                }, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"User creation error: {str(e)}", exc_info=True)
                # Clean up company if user creation fails
                if company:
                    company.delete()
                return server_error(
                    message="Failed to create user",
                    code=ErrorCode.DATABASE_ERROR,
                    details={"error": str(e)}
                )
        except Exception as e:
            logger.error(f"Registration error: {str(e)}", exc_info=True)
            return server_error(
                message="An unexpected error occurred during registration",
                code=ErrorCode.UNEXPECTED_ERROR,
                details={"error": str(e)}
            )

class TokenRefreshView(APIView):
    permission_classes = []
    throttle_classes = [TokenRefreshRateThrottle]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                return validation_error(
                    message="Refresh token is required",
                    code=ErrorCode.INVALID_TOKEN
                )
            
            try:
                # Verify and decode the refresh token
                refresh = RefreshToken(refresh_token)
                user = User.objects.get(id=refresh['user_id'])
                
                # Generate new token pair
                new_refresh = RefreshToken.for_user(user)
                
                return Response({
                    'access_token': str(new_refresh.access_token),
                    'refresh_token': str(new_refresh),
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'role': user.role
                    }
                })
            except Exception as e:
                return authentication_error(
                    message="Invalid or expired refresh token",
                    code=ErrorCode.TOKEN_INVALID
                )
        except Exception as e:
            logger.error(f"Token refresh error: {str(e)}", exc_info=True)
            return server_error(
                message="An unexpected error occurred during token refresh",
                code=ErrorCode.UNEXPECTED_ERROR,
                details={"error": str(e)}
            )

class ResendVerificationView(APIView):
    permission_classes = []
    throttle_classes = [LoginRateThrottle]  # Use same throttle as login
    
    def post(self, request):
        try:
            email = request.data.get('email')
            if not email:
                return validation_error(
                    message="Email is required",
                    code=ErrorCode.MISSING_REQUIRED_FIELD
                )
            
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                # Don't reveal if user exists or not for security
                return Response({
                    'message': 'If an account with this email exists, a verification email has been sent.'
                })
            
            if user.email_verified:
                return Response({
                    'message': 'Email is already verified.'
                })
            
            # Here you would typically:
            # 1. Generate a verification token
            # 2. Send verification email
            # 3. Log the attempt
            
            # For now, we'll just return a success message
            # In a real implementation, you'd integrate with your email service
            
            SecurityEventLogger.log_auth_attempt(
                user.email,
                True,
                'Verification email resent'
            )
            
            return Response({
                'message': 'Verification email sent successfully.'
            })
            
        except Exception as e:
            logger.error(f"Resend verification error: {str(e)}", exc_info=True)
            return server_error(
                message="An unexpected error occurred while sending verification email",
                code=ErrorCode.UNEXPECTED_ERROR,
                details={"error": str(e)}
            )
