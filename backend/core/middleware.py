import time
import logging
import json
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings

logger = logging.getLogger('django')

class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware for logging all requests and responses.
    """
    def __init__(self, get_response):
        super().__init__(get_response)
        self.logger = logging.getLogger('django')

    def process_request(self, request):
        request.start_time = time.time()
        
        # Log request details
        request_data = {
            'method': request.method,
            'path': request.path,
            'query_params': dict(request.GET.items()),
            'client_ip': self.get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }
        
        # Log request body for non-GET requests
        if request.method in ['POST', 'PUT', 'PATCH']:
            try:
                body = json.loads(request.body)
                # Mask sensitive data
                if 'password' in body:
                    body['password'] = '********'
                request_data['body'] = body
            except json.JSONDecodeError:
                request_data['body'] = 'Invalid JSON'
        
        self.logger.info(f"Request: {json.dumps(request_data)}")

    def process_response(self, request, response):
        # Calculate request duration
        duration = time.time() - request.start_time
        
        # Log response details
        response_data = {
            'status_code': response.status_code,
            'duration': f"{duration:.2f}s",
            'path': request.path,
            'method': request.method,
        }
        
        # Log response body for error responses
        if response.status_code >= 400:
            try:
                response_data['body'] = json.loads(response.content)
            except json.JSONDecodeError:
                response_data['body'] = response.content.decode('utf-8', errors='replace')
        
        self.logger.info(f"Response: {json.dumps(response_data)}")
        return response

    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip 