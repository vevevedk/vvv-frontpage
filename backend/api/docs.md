# API Documentation

## Authentication Endpoints

### Register User
`POST /api/auth/register/`

Register a new user account.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "StrongP@ss123",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "phone": "+1234567890",
    "company": {
        "name": "Example Corp",
        "address": "123 Main St",
        "phone": "+1234567890",
        "email": "contact@example.com"
    }
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*(),.?":{}|<>)

**Response (201 Created):**
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "user"
    }
}
```

**Error Responses:**
- 400 Bad Request: Invalid input data
- 429 Too Many Requests: Rate limit exceeded (3 requests/minute)

### Login
`POST /api/auth/login/`

Authenticate a user and receive access tokens.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "StrongP@ss123"
}
```

**Response (200 OK):**
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "user"
    }
}
```

**Error Responses:**
- 400 Bad Request: Invalid input data
- 401 Unauthorized: Invalid credentials
- 429 Too Many Requests: Rate limit exceeded (5 requests/minute)

### Refresh Token
`POST /api/auth/refresh/`

Get a new access token using a refresh token.

**Request Body:**
```json
{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200 OK):**
```json
{
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "user"
    }
}
```

**Error Responses:**
- 400 Bad Request: Missing or invalid refresh token
- 401 Unauthorized: Invalid or expired refresh token
- 429 Too Many Requests: Rate limit exceeded (10 requests/minute)

## Error Response Format

All error responses follow this format:
```json
{
    "error": {
        "message": "Human readable error message",
        "code": 1001,
        "category": "validation",
        "details": {
            // Optional additional error details
        }
    }
}
```

### Error Codes

#### Validation Errors (1000-1999)
- 1001: Invalid input data
- 1002: Invalid email format
- 1003: Password requirements not met
- 1004: Invalid company data

#### Authentication Errors (2000-2999)
- 2001: Invalid credentials
- 2002: Invalid token
- 2003: Token expired
- 2004: Token blacklisted

#### Authorization Errors (3000-3999)
- 3001: Insufficient permissions
- 3002: Role not allowed

#### Not Found Errors (4000-4999)
- 4001: Resource not found
- 4002: User not found

#### Server Errors (5000-5999)
- 5001: Unexpected error
- 5002: Database error

## Rate Limiting

The API implements rate limiting to prevent abuse:

- Login: 5 requests per minute
- Registration: 3 requests per minute
- Token Refresh: 10 requests per minute

When rate limit is exceeded, the API returns a 429 status code with the message "Request was throttled. Expected available in X seconds."

## Security

### CORS
The API allows requests from the following origins:
- http://localhost:3000
- http://127.0.0.1:3000
- http://localhost:8000
- http://127.0.0.1:8000

### Token Security
- Access tokens expire after 1 day
- Refresh tokens expire after 7 days
- Refresh tokens are rotated on each use
- Used refresh tokens are blacklisted
- Token chain is maintained for audit purposes

### Headers
Required headers for authenticated requests:
```
Authorization: Bearer <access_token>
Content-Type: application/json
``` 