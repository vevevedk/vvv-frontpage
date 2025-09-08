# Backend Foundation Development Plan

## Directory Structure
```
backend/
├── api/                    # Main Django project
│   ├── settings/
│   │   ├── base.py        # Base settings
│   │   ├── dev.py         # Development settings
│   │   └── prod.py        # Production settings
│   ├── urls.py
│   └── wsgi.py
├── apps/                   # Django applications
│   ├── users/             # User management
│   ├── authentication/    # Auth system
│   └── core/              # Core functionality
├── requirements/
│   ├── base.txt           # Base requirements
│   ├── dev.txt            # Development requirements
│   └── prod.txt           # Production requirements
└── manage.py
```

## Implementation Steps

### 1. Initial Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install base requirements
pip install django djangorestframework django-cors-headers python-decouple psycopg2-binary

# Create Django project
django-admin startproject api
```

### 2. Settings Configuration

#### base.py
```python
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('DJANGO_SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'apps.users',
    'apps.authentication',
    'apps.core',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'api.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST'),
        'PORT': config('DB_PORT'),
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

### 3. Basic Apps Structure

#### Create Apps
```bash
python manage.py startapp users apps/users
python manage.py startapp authentication apps/authentication
python manage.py startapp core apps/core
```

#### Configure URLs
```python
# api/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/core/', include('apps.core.urls')),
]
```

## Testing Plan

### 1. Unit Tests
- Test database configuration
- Test CORS settings
- Test basic URL routing

### 2. Integration Tests
- Test app initialization
- Test middleware stack
- Test static file serving

## Deployment Checklist

### 1. Development
- [ ] Set up virtual environment
- [ ] Install dependencies
- [ ] Configure development settings
- [ ] Set up database
- [ ] Run initial migrations

### 2. Production
- [ ] Configure production settings
- [ ] Set up environment variables
- [ ] Configure static files
- [ ] Set up logging
- [ ] Configure security settings

## Next Steps
1. Implement authentication system
2. Set up user management
3. Create core API endpoints 