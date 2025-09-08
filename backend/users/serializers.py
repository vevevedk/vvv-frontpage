from rest_framework import serializers
from .models import User, Company, Agency, Account, AccountConfiguration

class AgencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Agency
        fields = ['id', 'name', 'is_super_agency', 'address', 'phone', 'email', 'website', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class CompanySerializer(serializers.ModelSerializer):
    agency = AgencySerializer(read_only=True)
    
    class Meta:
        model = Company
        fields = ['id', 'name', 'agency', 'address', 'phone', 'email', 'website', 'currency_code', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating companies with agency_id write support."""
    agency_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Company
        fields = ['name', 'address', 'phone', 'email', 'website', 'currency_code', 'agency_id']

    def create(self, validated_data):
        agency_id = validated_data.pop('agency_id', None)
        agency = None
        if agency_id:
            try:
                agency = Agency.objects.get(id=agency_id)
            except Agency.DoesNotExist:
                raise serializers.ValidationError({'agency_id': 'Agency not found'})
        company = Company.objects.create(agency=agency, **validated_data)
        return company

    def update(self, instance, validated_data):
        agency_id = validated_data.pop('agency_id', None)
        if agency_id is not None:
            if agency_id:
                try:
                    instance.agency = Agency.objects.get(id=agency_id)
                except Agency.DoesNotExist:
                    raise serializers.ValidationError({'agency_id': 'Agency not found'})
            else:
                instance.agency = None

        for field in ['name', 'address', 'phone', 'email', 'website', 'currency_code']:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        instance.save()
        return instance

class AccountConfigurationSerializer(serializers.ModelSerializer):
    enabled = serializers.BooleanField(source='is_active', read_only=True)
    
    class Meta:
        model = AccountConfiguration
        fields = ['id', 'account', 'config_type', 'name', 'config_data', 'is_active', 'enabled', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class AccountSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    configurations = AccountConfigurationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Account
        fields = ['id', 'name', 'description', 'company', 'is_active', 'configurations', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class AccountCreateSerializer(serializers.ModelSerializer):
    company_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Account
        fields = ['name', 'description', 'company_id', 'is_active']
    
    def create(self, validated_data):
        company_id = validated_data.pop('company_id')
        
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            raise serializers.ValidationError({'company_id': 'Company not found'})
        
        validated_data['company'] = company
        return super().create(validated_data)

class AccountUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ['name', 'description', 'is_active']

class AccountConfigurationCreateSerializer(serializers.ModelSerializer):
    account_id = serializers.IntegerField(write_only=True)
    config_data = serializers.JSONField(required=False, default=dict)
    
    class Meta:
        model = AccountConfiguration
        fields = ['config_type', 'name', 'account_id', 'is_active', 'config_data']
    
    def create(self, validated_data):
        account_id = validated_data.pop('account_id')
        config_data = validated_data.pop('config_data', {})
        
        try:
            account = Account.objects.get(id=account_id)
        except Account.DoesNotExist:
            raise serializers.ValidationError({'account_id': 'Account not found'})
        
        validated_data['account'] = account
        validated_data['config_data'] = config_data
        return super().create(validated_data)

class AccountConfigurationUpdateSerializer(serializers.ModelSerializer):
    config_data = serializers.JSONField(required=False)
    
    class Meta:
        model = AccountConfiguration
        fields = ['config_type', 'name', 'is_active', 'config_data']
    
    def update(self, instance, validated_data):
        config_data = validated_data.pop('config_data', None)
        
        # Update configuration
        config = super().update(instance, validated_data)
        
        # Update config_data if provided
        if config_data is not None:
            config.config_data.update(config_data)
            config.save()
        
        return config

class UserSerializer(serializers.ModelSerializer):
    company = CompanySerializer(read_only=True)
    agency = AgencySerializer(read_only=True)
    agency_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    access_all_companies = serializers.BooleanField(required=False, default=True)
    company_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list
    )
    accessible_company_ids = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'phone', 'company', 'agency', 'is_active', 'email_verified', 'agency_id', 'access_all_companies', 'company_ids', 'accessible_company_ids']
        read_only_fields = ['id']

    def get_accessible_company_ids(self, obj):
        """Get the IDs of companies the user has access to"""
        if obj.access_all_companies:
            # If user has access to all companies, return all company IDs in their agency
            if obj.agency:
                return list(obj.agency.companies.values_list('id', flat=True))
            return []
        else:
            # Return only the specific companies the user has access to
            return list(obj.accessible_companies.values_list('id', flat=True))

    def create(self, validated_data):
        agency_id = validated_data.pop('agency_id', None)
        access_all_companies = validated_data.pop('access_all_companies', True)
        company_ids = validated_data.pop('company_ids', [])
        
        # Set the agency
        if agency_id:
            try:
                agency = Agency.objects.get(id=agency_id)
                validated_data['agency'] = agency
            except Agency.DoesNotExist:
                raise serializers.ValidationError({'agency_id': 'Agency not found'})
        
        # Create the user
        user = super().create(validated_data)
        
        # Handle company access
        user.access_all_companies = access_all_companies
        if not access_all_companies and company_ids:
            try:
                companies = Company.objects.filter(id__in=company_ids, agency=user.agency)
                user.accessible_companies.set(companies)
            except Company.DoesNotExist:
                raise serializers.ValidationError({'company_ids': 'One or more companies not found'})
        user.save()
        
        return user

    def update(self, instance, validated_data):
        agency_id = validated_data.pop('agency_id', None)
        access_all_companies = validated_data.pop('access_all_companies', True)
        company_ids = validated_data.pop('company_ids', [])
        
        # Update the agency
        if agency_id is not None:
            if agency_id:
                try:
                    agency = Agency.objects.get(id=agency_id)
                    validated_data['agency'] = agency
                except Agency.DoesNotExist:
                    raise serializers.ValidationError({'agency_id': 'Agency not found'})
            else:
                validated_data['agency'] = None
        
        # Update the user
        user = super().update(instance, validated_data)
        
        # Handle company access
        user.access_all_companies = access_all_companies
        if not access_all_companies and company_ids:
            try:
                companies = Company.objects.filter(id__in=company_ids, agency=user.agency)
                user.accessible_companies.set(companies)
            except Company.DoesNotExist:
                raise serializers.ValidationError({'company_ids': 'One or more companies not found'})
        elif access_all_companies:
            # Clear accessible companies if user has access to all
            user.accessible_companies.clear()
        user.save()
        
        return user

class UserUpdateSerializer(serializers.ModelSerializer):
    company = CompanySerializer(required=False)
    agency_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    access_all_companies = serializers.BooleanField(required=False, default=True)
    company_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False,
        default=list
    )
    accessible_company_ids = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'email_verified', 'company', 'agency_id', 'access_all_companies', 'company_ids', 'accessible_company_ids']

    def get_accessible_company_ids(self, obj):
        """Get the IDs of companies the user has access to"""
        if obj.access_all_companies:
            # If user has access to all companies, return all company IDs in their agency
            if obj.agency:
                return list(obj.agency.companies.values_list('id', flat=True))
            return []
        else:
            # Return only the specific companies the user has access to
            return list(obj.accessible_companies.values_list('id', flat=True))

    def update(self, instance, validated_data):
        agency_id = validated_data.pop('agency_id', None)
        access_all_companies = validated_data.pop('access_all_companies', True)
        company_ids = validated_data.pop('company_ids', [])
        
        print(f"DEBUG: Updating user {instance.id}")
        print(f"DEBUG: access_all_companies = {access_all_companies}")
        print(f"DEBUG: company_ids = {company_ids}")
        
        # Update the agency
        if agency_id is not None:
            if agency_id:
                try:
                    agency = Agency.objects.get(id=agency_id)
                    validated_data['agency'] = agency
                except Agency.DoesNotExist:
                    raise serializers.ValidationError({'agency_id': 'Agency not found'})
            else:
                validated_data['agency'] = None
        
        # Handle company data
        company_data = validated_data.pop('company', None)
        if company_data:
            company = instance.company
            for attr, value in company_data.items():
                setattr(company, attr, value)
            company.save()
        
        # Update the user
        user = super().update(instance, validated_data)
        
        # Handle company access
        user.access_all_companies = access_all_companies
        print(f"DEBUG: Setting access_all_companies to {access_all_companies}")
        
        if not access_all_companies and company_ids:
            try:
                companies = Company.objects.filter(id__in=company_ids, agency=user.agency)
                print(f"DEBUG: Found companies: {list(companies.values_list('id', 'name'))}")
                user.accessible_companies.set(companies)
                print(f"DEBUG: Set accessible companies to: {list(user.accessible_companies.values_list('id', 'name'))}")
            except Company.DoesNotExist:
                raise serializers.ValidationError({'company_ids': 'One or more companies not found'})
        elif access_all_companies:
            # Clear accessible companies if user has access to all
            user.accessible_companies.clear()
            print(f"DEBUG: Cleared accessible companies")
        
        user.save()
        print(f"DEBUG: Final accessible companies: {list(user.accessible_companies.values_list('id', 'name'))}")
        
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True) 