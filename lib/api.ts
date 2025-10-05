import { useAuth } from './auth/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(';').shift() || null;
  return null;
}

interface ApiError {
  message: string;
  code: number;
  category: string;
  details?: any;
}

interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

class ApiClient {
  private static instance: ApiClient;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private baseUrl: string;

  private constructor() {
    this.baseUrl = API_BASE_URL;
    
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  public setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  public clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    // Only access localStorage in browser environment
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Token refresh failed');
      }

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      localStorage.setItem('accessToken', data.access_token);
      localStorage.setItem('refreshToken', data.refresh_token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return false;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    });

    // Attach CSRF header when available (browser context)
    const csrfToken = getCookie('csrftoken');
    if (csrfToken && !headers.has('X-CSRFToken')) {
      headers.set('X-CSRFToken', csrfToken);
    }

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    try {
      let response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'same-origin',
      });

      // If unauthorized and we have a refresh token, try to refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshSuccess = await this.refreshAccessToken();
        if (refreshSuccess) {
          // Retry the request with the new token
          headers.set('Authorization', `Bearer ${this.accessToken}`);
          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'same-origin',
          });
        }
      }

      // Safely parse JSON only when present and correct content-type
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      let data: any = null;
      try {
        if (isJson) {
          data = await response.json();
        } else {
          const text = await response.text();
          if (text && text.trim().startsWith('{')) {
            data = JSON.parse(text);
          }
        }
      } catch (_) {
        // Ignore JSON parse errors; will fall back to status-based message
      }

      if (!response.ok) {
        const fallbackMsg = response.status === 405
          ? 'Method not allowed'
          : response.status === 403
            ? 'Forbidden (CSRF or permissions)'
            : response.statusText || 'Request failed';

        return {
          error: {
            message: data?.error?.message || fallbackMsg,
            code: data?.error?.code || response.status,
            category: data?.error?.category || 'http',
            details: data?.error?.details || undefined,
          },
        };
      }

      return { data: (data as T) };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network error',
          code: 0,
          category: 'network',
        },
      };
    }
  }

  public async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  public async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export const api = ApiClient.getInstance();

// Types
interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  phone?: string;
  email_verified?: boolean;
  company?: {
    id: number;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  agency?: {
    id: number;
    name: string;
    email?: string;
    website?: string;
    is_super_agency?: boolean;
  };
}

interface Agency {
  id: number;
  name: string;
  email?: string;
  website?: string;
  is_super_agency: boolean;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  agency?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface Setting {
  id: number;
  key: string;
  value: any;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface RegisterData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role: string;
  phone?: string;
  company?: {
    name: string;
    website?: string;
  };
}

export const auth = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login/', { email, password });
    if (!response.data) {
      throw new Error(response.error?.message || 'Login failed');
    }
    return response.data;
  },
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/register/', data);
    if (!response.data) {
      throw new Error(response.error?.message || 'Registration failed');
    }
    return response.data;
  },
};

export const users = {
  getCurrentUser: async () => {
    const response = await api.get<User>('/users/me/');
    return response.data;
  },
  updateProfile: async (data: Partial<User>) => {
    const response = await api.put<User>(`/users/${data.id}/`, data);
    return response.data;
  },
  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await api.post('/users/change_password/', {
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  },
  deleteAccount: async () => {
    const response = await api.delete('/users/delete_account/');
    return response.data;
  },
  resendVerification: async (email: string) => {
    const response = await api.post('/auth/resend-verification/', { email });
    return response.data;
  }
};

export const settings = {
  getAll: async (): Promise<Setting[]> => {
    const response = await api.get<Setting[]>('/settings/');
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to get settings');
    }
    return response.data;
  },
  getByKey: async (key: string): Promise<Setting> => {
    const response = await api.get<Setting>(`/settings/get_by_key/?key=${key}`);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to get setting');
    }
    return response.data;
  },
};

export const agencies = {
  getAll: async (): Promise<Agency[]> => {
    const response = await api.get<Agency[]>('/agencies/');
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to get agencies');
    }
    return response.data;
  },
  get: async (id: number): Promise<Agency> => {
    const response = await api.get<Agency>(`/agencies/${id}/`);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to get agency');
    }
    return response.data;
  },
  create: async (data: Partial<Agency>): Promise<Agency> => {
    const response = await api.post<Agency>('/agencies/', data);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to create agency');
    }
    return response.data;
  },
  update: async (id: number, data: Partial<Agency>): Promise<Agency> => {
    const response = await api.put<Agency>(`/agencies/${id}/`, data);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to update agency');
    }
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    const response = await api.delete(`/agencies/${id}/`);
    if (response.error) {
      throw new Error(response.error.message || 'Failed to delete agency');
    }
  }
};

export const companies = {
  getAll: async (): Promise<Company[]> => {
    const response = await api.get<Company[]>('/companies/');
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to get companies');
    }
    return response.data;
  },
  get: async (id: number): Promise<Company> => {
    const response = await api.get<Company>(`/companies/${id}/`);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to get company');
    }
    return response.data;
  },
  create: async (data: Partial<Company>): Promise<Company> => {
    const response = await api.post<Company>('/companies/', data);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to create company');
    }
    return response.data;
  },
  update: async (id: number, data: Partial<Company>): Promise<Company> => {
    const response = await api.put<Company>(`/companies/${id}/`, data);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to update company');
    }
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    const response = await api.delete(`/companies/${id}/`);
    if (response.error) {
      throw new Error(response.error.message || 'Failed to delete company');
    }
  }
};

export const adminUsers = {
  getAll: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/users/');
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to get users');
    }
    return response.data;
  },
  get: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}/`);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to get user');
    }
    return response.data;
  },
  create: async (data: Partial<User>): Promise<User> => {
    const response = await api.post<User>('/users/', data);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to create user');
    }
    return response.data;
  },
  update: async (id: number, data: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/users/${id}/`, data);
    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to update user');
    }
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    const response = await api.delete(`/users/${id}/`);
    if (response.error) {
      throw new Error(response.error.message || 'Failed to delete user');
    }
  }
};

export default api; 