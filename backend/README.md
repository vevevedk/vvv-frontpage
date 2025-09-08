# VVV Backend API

This is the Django REST Framework backend for the VVV application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

## API Endpoints

### Authentication
- `POST /api/auth/login/` - Login and get token

### Users
- `GET /api/users/` - List users
- `POST /api/users/` - Create user
- `GET /api/users/{id}/` - Get user details
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user
- `GET /api/users/me/` - Get current user
- `POST /api/users/change_password/` - Change password

### Settings
- `GET /api/settings/` - List settings
- `POST /api/settings/` - Create setting
- `GET /api/settings/{id}/` - Get setting details
- `PUT /api/settings/{id}/` - Update setting
- `DELETE /api/settings/{id}/` - Delete setting
- `GET /api/settings/get_by_key/` - Get setting by key

## Development

### Running Tests
```bash
python manage.py test
```

### Code Style
This project uses Black for code formatting:
```bash
black .
```

### Database Migrations
When making model changes:
```bash
python manage.py makemigrations
python manage.py migrate
``` 