# Frontend Authentication Integration Plan

## Directory Structure
```
frontend/
├── pages/
│   ├── login.tsx
│   ├── signup.tsx
│   └── app/
│       └── dashboard.tsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   └── shared/
│       └── ProtectedRoute.tsx
└── lib/
    ├── auth.ts
    └── api.ts
```

## Implementation Steps

### 1. Authentication Components

#### LoginForm Component
```typescript
// components/auth/LoginForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/app/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### 2. Authentication Context

```typescript
// lib/auth.ts
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from './api';

interface AuthContextType {
  user: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/users/me/').then((response) => {
        setUser(response.data);
        setIsAuthenticated(true);
      });
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login/', { email, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 3. Protected Route Component

```typescript
// components/shared/ProtectedRoute.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

## API Integration

### API Client
```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Token ${token}` } : {};
  }

  async get(endpoint: string) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    });
    return response.json();
  }

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

export const api = new ApiClient();
```

## Testing Plan

### 1. Unit Tests
- Test login form validation
- Test authentication context
- Test protected route component
- Test API client

### 2. Integration Tests
- Test complete login flow
- Test protected route redirection
- Test token management
- Test API error handling

## Security Considerations

### 1. Token Management
- Secure token storage
- Token refresh mechanism
- Token expiration handling
- CSRF protection

### 2. Form Security
- Input validation
- XSS prevention
- Rate limiting
- Error handling

## Next Steps
1. Implement signup flow
2. Add password reset functionality
3. Implement remember me feature
4. Add social authentication 