from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from users.models import User, Company
from .errors import ErrorCode
from .validators import PasswordValidator
from .models import Invite, LoginEvent

User = get_user_model()

class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['name', 'address', 'phone', 'email', 'website']

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email address")
        return value

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    company = CompanySerializer(required=False)
    invite_token = serializers.UUIDField(required=False, write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'role', 'phone', 'company', 'invite_token']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone': {'required': False},
        }

    def validate_password(self, value):
        validator = PasswordValidator()
        try:
            validator.validate(value)
        except serializers.ValidationError as e:
            raise serializers.ValidationError(e.detail)
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, data):
        # Skip company requirement when invite_token is present
        if data.get('invite_token'):
            return data
        if data.get('role') == 'company_admin' and not data.get('company'):
            raise serializers.ValidationError("Company information is required for company admin role")
        return data


class LoginEventSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = LoginEvent
        fields = ['id', 'user', 'user_email', 'timestamp', 'ip_address', 'user_agent', 'success']
        read_only_fields = fields


class InviteSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True, default=None)
    invited_by_email = serializers.CharField(source='invited_by.email', read_only=True)

    class Meta:
        model = Invite
        fields = [
            'id', 'email', 'company', 'company_name', 'role', 'status',
            'token', 'invited_by', 'invited_by_email', 'accepted_by',
            'expires_at', 'accepted_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'token', 'invited_by', 'invited_by_email', 'accepted_by',
            'status', 'expires_at', 'accepted_at', 'created_at', 'updated_at',
        ]


class InviteCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    company_id = serializers.IntegerField(required=False, allow_null=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='company_user')
