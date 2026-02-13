from django.shortcuts import render
from rest_framework import status, viewsets, mixins
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import (
    LoginSerializer, RegisterSerializer,
    LoginEventSerializer, InviteSerializer, InviteCreateSerializer,
)
from .models import LoginEvent, Invite
from users.models import User, Company
from django.utils import timezone
from datetime import timedelta
from .errors import (
    ErrorCode, ErrorCategory,
    authentication_error, validation_error,
    server_error, not_found_error
)
from .throttling import LoginRateThrottle, RegisterRateThrottle, TokenRefreshRateThrottle
from core.security import SecurityEventLogger
import logging
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from urllib.parse import quote

logger = logging.getLogger('authentication')


def _notify(task, *args, **kwargs):
    """Fire-and-forget Celery notification — never block the request."""
    try:
        task.delay(*args, **kwargs)
    except Exception as e:
        logger.warning(f"Async notification failed ({task.name}): {e}")


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _record_login_event(request, user, success):
    try:
        LoginEvent.objects.create(
            user=user,
            ip_address=_get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:1000],
            success=success,
        )
    except Exception as e:
        logger.warning(f"Failed to record login event: {e}")


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

            email = serializer.validated_data['email']
            user = authenticate(
                username=email,
                password=serializer.validated_data['password']
            )

            if not user:
                SecurityEventLogger.log_auth_attempt(email, False, 'Invalid credentials')
                # Record failed login for known user
                try:
                    known_user = User.objects.get(email=email)
                    _record_login_event(request, known_user, success=False)
                except User.DoesNotExist:
                    pass
                return authentication_error(
                    message="Invalid credentials",
                    code=ErrorCode.INVALID_CREDENTIALS
                )

            # Successful login
            refresh = RefreshToken.for_user(user)
            SecurityEventLogger.log_auth_attempt(user.email, True)
            _record_login_event(request, user, success=True)
            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])
            from .tasks import notify_login
            _notify(notify_login, user.email, _get_client_ip(request))

            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'role': user.role,
                    'email_verified': user.email_verified
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

            invite_token = serializer.validated_data.pop('invite_token', None)
            invite = None

            # Look up invite if token provided
            if invite_token:
                try:
                    invite = Invite.objects.get(
                        token=invite_token,
                        email=serializer.validated_data['email'],
                        status='pending',
                    )
                    if invite.is_expired:
                        invite.status = 'expired'
                        invite.save(update_fields=['status'])
                        invite = None
                except Invite.DoesNotExist:
                    invite = None

            # Create company if provided (and no invite)
            company = None
            if invite and invite.company:
                company = invite.company
            elif 'company' in serializer.validated_data:
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
            else:
                serializer.validated_data.pop('company', None)

            try:
                user_data = serializer.validated_data.copy()
                role = user_data.get('role', 'company_user')
                if invite:
                    role = invite.role

                user = User.objects.create_user(
                    username=user_data['email'],
                    email=user_data['email'],
                    password=user_data['password'],
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                    role=role,
                    phone=user_data.get('phone', ''),
                    company=company,
                    agency=company.agency if company and company.agency else None,
                    email_verified=True if invite else False,
                )

                # Mark invite as accepted
                if invite:
                    invite.status = 'accepted'
                    invite.accepted_by = user
                    invite.accepted_at = timezone.now()
                    invite.save(update_fields=['status', 'accepted_by', 'accepted_at'])

                # Record first login event and generate JWT tokens
                _record_login_event(request, user, success=True)
                refresh = RefreshToken.for_user(user)

                SecurityEventLogger.log_auth_attempt(
                    user.email,
                    True,
                    'Registration successful'
                )
                from .tasks import notify_registration, notify_invite_accepted
                _notify(notify_registration, user.email, company.name if company else '', bool(invite))
                if invite:
                    _notify(
                        notify_invite_accepted,
                        user.email,
                        invite.invited_by.email if invite.invited_by_id else '',
                        company.name if company else '',
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
                # Clean up company if user creation fails (only if we created it)
                if company and not invite:
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
                        'role': user.role,
                        'email_verified': user.email_verified
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


class InviteValidateView(APIView):
    """Public endpoint to validate an invite token and return basic info."""
    permission_classes = []

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return validation_error(
                message="Token is required",
                code=ErrorCode.MISSING_REQUIRED_FIELD,
            )
        try:
            invite = Invite.objects.select_related('company').get(
                token=token, status='pending',
            )
        except (Invite.DoesNotExist, ValueError):
            return not_found_error(message="Invalid or expired invite")

        if invite.is_expired:
            invite.status = 'expired'
            invite.save(update_fields=['status'])
            return not_found_error(message="Invalid or expired invite")

        return Response({
            'email': invite.email,
            'company_name': invite.company.name if invite.company else None,
            'role': invite.role,
        })


class LoginEventViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = LoginEventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return LoginEvent.objects.select_related('user').order_by('-timestamp')[:500]
        return LoginEvent.objects.filter(user=user).select_related('user').order_by('-timestamp')[:100]


class InviteViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = InviteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'super_admin':
            return Invite.objects.select_related('company', 'invited_by').order_by('-created_at')
        if user.role == 'agency_admin' and user.agency:
            return Invite.objects.filter(
                company__agency=user.agency
            ).select_related('company', 'invited_by').order_by('-created_at')
        return Invite.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = InviteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        company = None
        company_id = serializer.validated_data.get('company_id')
        if company_id:
            try:
                company = Company.objects.get(id=company_id)
            except Company.DoesNotExist:
                return Response(
                    {'error': 'Company not found'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        invite = Invite.objects.create(
            email=serializer.validated_data['email'],
            company=company,
            role=serializer.validated_data.get('role', 'company_user'),
            invited_by=request.user,
            expires_at=timezone.now() + timedelta(hours=72),
        )

        # Send invite email
        email_sent = False
        app_url = getattr(settings, 'APP_URL', 'http://localhost:3000')
        company_name = company.name if company else ''
        invite_url = f"{app_url}/register?invite_token={invite.token}&company={quote(company_name)}"
        try:
            if settings.EMAIL_HOST:
                send_mail(
                    subject='You are invited to VVV Analytics',
                    message=f'You have been invited to access channel reports.\n\nClick here to create your account: {invite_url}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[invite.email],
                    html_message=(
                        f'<p>You have been invited to access channel reports.</p>'
                        f'<p><a href="{invite_url}">Click here to create your account</a></p>'
                    ),
                )
                email_sent = True
                logger.info(f"Invite email sent to {invite.email}")
            else:
                logger.warning("EMAIL_HOST not configured — skipping invite email")
        except Exception as e:
            logger.error(f"Failed to send invite email to {invite.email}: {e}")

        from .tasks import notify_invite_created
        _notify(notify_invite_created, request.user.email, invite.email, company.name if company else '')

        response_data = InviteSerializer(invite).data
        response_data['email_sent'] = email_sent
        response_data['invite_url'] = invite_url
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        try:
            invite = self.get_queryset().get(pk=pk)
        except Invite.DoesNotExist:
            return Response({'error': 'Invite not found'}, status=status.HTTP_404_NOT_FOUND)

        if invite.status != 'pending':
            return Response(
                {'error': f'Cannot cancel invite with status {invite.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        invite.status = 'cancelled'
        invite.save(update_fields=['status'])
        return Response(InviteSerializer(invite).data)

    @action(detail=True, methods=['post'])
    def resend(self, request, pk=None):
        try:
            invite = self.get_queryset().get(pk=pk)
        except Invite.DoesNotExist:
            return Response({'error': 'Invite not found'}, status=status.HTTP_404_NOT_FOUND)

        if invite.status not in ('pending', 'expired'):
            return Response(
                {'error': f'Cannot resend invite with status {invite.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Reset to pending with fresh expiry
        invite.status = 'pending'
        invite.expires_at = timezone.now() + timedelta(hours=72)
        invite.save(update_fields=['status', 'expires_at'])

        # Re-send email
        email_sent = False
        app_url = getattr(settings, 'APP_URL', 'http://localhost:3000')
        company_name = invite.company.name if invite.company else ''
        invite_url = f"{app_url}/register?invite_token={invite.token}&company={quote(company_name)}"
        try:
            if settings.EMAIL_HOST:
                send_mail(
                    subject='You are invited to VVV Analytics',
                    message=f'You have been invited to access channel reports.\n\nClick here to create your account: {invite_url}',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[invite.email],
                    html_message=(
                        f'<p>You have been invited to access channel reports.</p>'
                        f'<p><a href="{invite_url}">Click here to create your account</a></p>'
                    ),
                )
                email_sent = True
            else:
                logger.warning("EMAIL_HOST not configured — skipping invite email")
        except Exception as e:
            logger.error(f"Failed to send invite email to {invite.email}: {e}")

        response_data = InviteSerializer(invite).data
        response_data['email_sent'] = email_sent
        response_data['invite_url'] = invite_url
        return Response(response_data)
