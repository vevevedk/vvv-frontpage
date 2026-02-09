import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../lib/auth/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../components/ui/Toast';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  phone: string;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: {
      name: '',
      address: '',
      phone: '',
      email: '',
    },
  });
  const [error, setError] = useState<string | null>(null);
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('company.')) {
      const companyField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        company: {
          ...prev.company,
          [companyField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      showWarning('Validation Error', errorMsg);
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      const errorMsg = 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character';
      setError(errorMsg);
      showWarning('Password Requirements', errorMsg);
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      // If invited, default role to company_user
      const inviteToken = (router.query.invite_token || router.query.invite) as string | undefined;
      const role = inviteToken ? 'company_user' : 'user';
      await register({
        ...registerData,
        role,
        ...(router.query.invite_token ? { invite_token: router.query.invite_token as string } : {}),
      });
      showSuccess('Account Created!', 'Your account has been successfully created. Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during registration';
      setError(errorMessage);
      showError('Registration Failed', errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              sign in to your existing account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <ErrorMessage
              error={error}
              onRetry={() => setError(null)}
            />
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.first_name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.last_name}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="company.name" className="block text-sm font-medium text-gray-700">
                    Company Name
                  </label>
                  <input
                    id="company.name"
                    name="company.name"
                    type="text"
                    required
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.company.name}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="company.address" className="block text-sm font-medium text-gray-700">
                    Company Address
                  </label>
                  <input
                    id="company.address"
                    name="company.address"
                    type="text"
                    required
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.company.address}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="company.phone" className="block text-sm font-medium text-gray-700">
                    Company Phone
                  </label>
                  <input
                    id="company.phone"
                    name="company.phone"
                    type="tel"
                    required
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.company.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label htmlFor="company.email" className="block text-sm font-medium text-gray-700">
                    Company Email
                  </label>
                  <input
                    id="company.email"
                    name="company.email"
                    type="email"
                    required
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.company.email}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 