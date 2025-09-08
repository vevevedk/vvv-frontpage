from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from users.models import User, Company
from .errors import ErrorCode
from .validators import PasswordValidator

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
    
    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'role', 'phone', 'company']
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
        if data.get('role') == 'company_admin' and not data.get('company'):
            raise serializers.ValidationError("Company information is required for company admin role")
        return data 