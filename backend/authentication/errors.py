from rest_framework.response import Response
from rest_framework import status

# Error Categories
class ErrorCategory:
    VALIDATION = 'validation'
    AUTHENTICATION = 'authentication'
    AUTHORIZATION = 'authorization'
    NOT_FOUND = 'not_found'
    SERVER = 'server'

# Error Codes
class ErrorCode:
    # Validation Errors (1000-1999)
    INVALID_EMAIL = 1001
    INVALID_PASSWORD = 1002
    INVALID_TOKEN = 1003
    MISSING_REQUIRED_FIELD = 1004
    INVALID_COMPANY_DATA = 1005
    
    # Authentication Errors (2000-2999)
    INVALID_CREDENTIALS = 2001
    TOKEN_EXPIRED = 2002
    TOKEN_INVALID = 2003
    
    # Authorization Errors (3000-3999)
    INSUFFICIENT_PERMISSIONS = 3001
    
    # Not Found Errors (4000-4999)
    USER_NOT_FOUND = 4001
    COMPANY_NOT_FOUND = 4002
    
    # Server Errors (5000-5999)
    DATABASE_ERROR = 5001
    UNEXPECTED_ERROR = 5002

def error_response(message, code, category, status_code=status.HTTP_400_BAD_REQUEST, details=None):
    """
    Create a standardized error response.
    
    Args:
        message (str): Human-readable error message
        code (int): Error code from ErrorCode class
        category (str): Error category from ErrorCategory class
        status_code (int): HTTP status code
        details (dict, optional): Additional error details
    
    Returns:
        Response: DRF Response object with standardized error format
    """
    response_data = {
        'error': {
            'message': message,
            'code': code,
            'category': category
        }
    }
    
    if details:
        response_data['error']['details'] = details
    
    return Response(response_data, status=status_code)

def validation_error(message, code, details=None):
    """Helper for validation errors"""
    return error_response(
        message=message,
        code=code,
        category=ErrorCategory.VALIDATION,
        status_code=status.HTTP_400_BAD_REQUEST,
        details=details
    )

def authentication_error(message, code, details=None):
    """Helper for authentication errors"""
    return error_response(
        message=message,
        code=code,
        category=ErrorCategory.AUTHENTICATION,
        status_code=status.HTTP_401_UNAUTHORIZED,
        details=details
    )

def authorization_error(message, code, details=None):
    """Helper for authorization errors"""
    return error_response(
        message=message,
        code=code,
        category=ErrorCategory.AUTHORIZATION,
        status_code=status.HTTP_403_FORBIDDEN,
        details=details
    )

def not_found_error(message, code, details=None):
    """Helper for not found errors"""
    return error_response(
        message=message,
        code=code,
        category=ErrorCategory.NOT_FOUND,
        status_code=status.HTTP_404_NOT_FOUND,
        details=details
    )

def server_error(message, code, details=None):
    """Helper for server errors"""
    return error_response(
        message=message,
        code=code,
        category=ErrorCategory.SERVER,
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        details=details
    ) 