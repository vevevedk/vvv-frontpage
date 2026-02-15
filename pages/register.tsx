import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../lib/auth/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useToast } from '../components/ui/Toast';
import { api } from '../lib/api';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface InviteInfo {
  email: string;
  company_name: string | null;
  role: string;
}

export default function Register() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToast();

  const inviteToken = (router.query.invite_token || router.query.invite) as string | undefined;
  const hasInvite = !!inviteToken;

  // Validate invite token and pre-fill email
  useEffect(() => {
    if (!inviteToken) return;
    setInviteLoading(true);
    api.get<InviteInfo>(`/auth/invite-validate/?token=${encodeURIComponent(inviteToken)}`)
      .then((resp) => {
        if (resp.data) {
          setInviteInfo(resp.data);
          setFormData((prev) => ({ ...prev, email: resp.data!.email }));
        } else {
          setError('This invite link is invalid or has expired.');
        }
      })
      .catch(() => {
        setError('This invite link is invalid or has expired.');
      })
      .finally(() => setInviteLoading(false));
  }, [inviteToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
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

    // Validate password strength — require 8+ chars with uppercase, lowercase, and digit
    if (formData.password.length < 8 || !/[a-z]/.test(formData.password) || !/[A-Z]/.test(formData.password) || !/\d/.test(formData.password)) {
      const errorMsg = 'Password must be at least 8 characters long and contain uppercase, lowercase, and a number';
      setError(errorMsg);
      showWarning('Password Requirements', errorMsg);
      return;
    }

    try {
      const { confirmPassword, ...userData } = formData;

      await register({
        ...userData,
        role: 'company_user',
        invite_token: inviteToken,
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

  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hasInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Invitation Required
          </h2>
          <p className="text-gray-600">
            Registration is by invitation only. If you&apos;ve received an invite, please use the link in your email.
          </p>
          <Link
            href="/login"
            className="inline-block font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in to your existing account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          {inviteInfo?.company_name && (
            <p className="mt-2 text-center text-sm text-gray-600">
              You&apos;ve been invited to join <span className="font-semibold">{inviteInfo.company_name}</span>
            </p>
          )}
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
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading || !!inviteInfo}
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
