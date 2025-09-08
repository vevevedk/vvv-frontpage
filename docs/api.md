# VVV API Documentation

## Authentication

### Register
```http
POST /api/auth/register/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "admin",
  "phone": "+1234567890",
  "company": {
    "name": "Example Corp",
    "website": "https://example.com"
  }
}
```

Response:
```json
{
  "token": "your_auth_token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin"
  }
}
```

### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "token": "your_auth_token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "admin"
  }
}
```

## Users

### Get Current User
```http
GET /api/users/me/
Authorization: Token your_auth_token
```

### Update User
```http
PATCH /api/users/me/
Authorization: Token your_auth_token
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

### Change Password
```http
POST /api/users/change_password/
Authorization: Token your_auth_token
Content-Type: application/json

{
  "old_password": "current_password",
  "new_password": "new_password"
}
```

## Settings

### List All Settings
```http
GET /api/settings/
Authorization: Token your_auth_token
```

### Get Setting by Key
```http
GET /api/settings/get_by_key/?key=setting_key
Authorization: Token your_auth_token
```

## Frontend Integration

### API Client Setup
```typescript
import { auth, users, settings } from '@/lib/api';

// Login
const login = async (email: string, password: string) => {
  try {
    const response = await auth.login(email, password);
    localStorage.setItem('token', response.token);
    return response.user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Get current user
const getCurrentUser = async () => {
  try {
    return await users.getCurrentUser();
  } catch (error) {
    console.error('Failed to get user:', error);
    throw error;
  }
};

// Get settings
const getSettings = async () => {
  try {
    return await settings.getAll();
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw error;
  }
};
```

## Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

Error responses follow this format:
```json
{
  "error": "Error message description"
}
```

## Development Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Run migrations:
```bash
python manage.py migrate
```

4. Create superuser:
```bash
python manage.py createsuperuser
```

5. Run development server:
```bash
python manage.py runserver
```

# Authentication API Documentation

## Profile Update
Update user profile information and company details.

**Endpoint:** `PUT /api/auth/profile`

**Authentication:** Required

**Request Body:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "phone": "string",
  "company": {
    "name": "string",
    "address": "string",
    "phone": "string",
    "email": "string"
  }
}
```

**Response:**
```json
{
  "user": {
    "id": "number",
    "email": "string",
    "first_name": "string",
    "last_name": "string",
    "phone": "string",
    "company": {
      "name": "string",
      "address": "string",
      "phone": "string",
      "email": "string"
    }
  }
}
```

## Password Change
Change user password.

**Endpoint:** `POST /api/auth/change-password`

**Authentication:** Required

**Request Body:**
```json
{
  "current_password": "string",
  "new_password": "string",
  "confirm_password": "string"
}
```

**Response:**
```json
{
  "message": "Password updated successfully"
}
```

## Email Verification
Verify user email address.

**Endpoint:** `POST /api/auth/verify-email`

**Authentication:** Not required

**Request Body:**
```json
{
  "token": "string"
}
```

**Response:**
```json
{
  "user": {
    "id": "number",
    "email": "string",
    "email_verified": "boolean"
  }
}
```

## Resend Verification Email
Request a new verification email.

**Endpoint:** `POST /api/auth/resend-verification`

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "message": "Verification email sent successfully"
}
```

## Account Deletion
Delete user account and associated data.

**Endpoint:** `DELETE /api/auth/delete-account`

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "message": "Account deleted successfully"
}
```

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**400 Bad Request**
```json
{
  "error": "Error message"
}
```

**429 Too Many Requests**
```json
{
  "error": "Too many requests"
}
```

**500 Internal Server Error**
```json
{
  "error": "Error message"
}
``` 