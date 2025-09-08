export interface ValidationError {
  field: string;
  message: string;
}

export const validateEmail = (email: string): string | undefined => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) return 'Password is required';
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*)';
  }
  
  return undefined;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') return `${fieldName} is required`;
  return null;
};

export const validateName = (name: string, fieldName: string): string | undefined => {
  if (!name) return `${fieldName} is required`;
  
  if (name.length < 2) {
    return `${fieldName} must be at least 2 characters long`;
  }
  
  if (!/^[a-zA-Z\s-']+$/.test(name)) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }
  
  return undefined;
};

export const validateCompanyName = (name: string): string | undefined => {
  if (!name) return 'Company name is required';
  
  if (name.length < 2) {
    return 'Company name must be at least 2 characters long';
  }
  
  if (name.length > 100) {
    return 'Company name must be less than 100 characters';
  }
  
  return undefined;
};

export const validatePhone = (phone: string): string | undefined => {
  if (!phone) return undefined; // Phone is optional
  
  // Remove all non-digit characters for validation
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length < 10) {
    return 'Please enter a valid phone number';
  }
  
  if (digitsOnly.length > 15) {
    return 'Phone number is too long';
  }
  
  return undefined;
}; 