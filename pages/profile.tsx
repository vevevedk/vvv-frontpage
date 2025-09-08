import { useState } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';
import SuccessMessage from '../components/SuccessMessage';

interface ProfileFormData {
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

interface PasswordFormData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function Profile() {
  const { user, isLoading: authLoading, updateProfile, changePassword, deleteAccount } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    company: {
      name: user?.company?.name || '',
      address: user?.company?.address || '',
      phone: user?.company?.phone || '',
      email: user?.company?.email || '',
    },
  });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('company.')) {
      const companyField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        company: {
          ...prev.company,
          [companyField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await changePassword(passwordData);
      setSuccess('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while changing password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      setError('Please type DELETE to confirm account deletion');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await deleteAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while deleting account');
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Profile Information
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>Update your account's profile information.</p>
                </div>

                <form className="mt-5 space-y-6" onSubmit={handleSubmit}>
                  {error && (
                    <ErrorMessage
                      error={error}
                      onRetry={() => setError(null)}
                    />
                  )}

                  {success && (
                    <SuccessMessage
                      message={success}
                      onDismiss={() => setSuccess(null)}
                    />
                  )}

                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                        First name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        id="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                        Last name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        id="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Company Information
                    </h3>
                    <div className="mt-2 max-w-xl text-sm text-gray-500">
                      <p>Update your company's information.</p>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-6">
                        <label htmlFor="company.name" className="block text-sm font-medium text-gray-700">
                          Company name
                        </label>
                        <input
                          type="text"
                          name="company.name"
                          id="company.name"
                          value={formData.company.name}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="company.address" className="block text-sm font-medium text-gray-700">
                          Company address
                        </label>
                        <input
                          type="text"
                          name="company.address"
                          id="company.address"
                          value={formData.company.address}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="company.phone" className="block text-sm font-medium text-gray-700">
                          Company phone
                        </label>
                        <input
                          type="tel"
                          name="company.phone"
                          id="company.phone"
                          value={formData.company.phone}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="company.email" className="block text-sm font-medium text-gray-700">
                          Company email
                        </label>
                        <input
                          type="email"
                          name="company.email"
                          id="company.email"
                          value={formData.company.email}
                          onChange={handleChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-5">
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          'Save changes'
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                <div className="mt-10 pt-6 border-t border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Change Password
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Update your password.</p>
                  </div>

                  <form className="mt-5 space-y-6" onSubmit={handlePasswordSubmit}>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                        <label htmlFor="current_password" className="block text-sm font-medium text-gray-700">
                          Current password
                        </label>
                        <input
                          type="password"
                          name="current_password"
                          id="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">
                          New password
                        </label>
                        <input
                          type="password"
                          name="new_password"
                          id="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                          Confirm new password
                        </label>
                        <input
                          type="password"
                          name="confirm_password"
                          id="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-5">
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Change password'
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Delete Account
                  </h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Once you delete your account, there is no going back. Please be certain.</p>
                  </div>

                  {!showDeleteConfirmation ? (
                    <div className="mt-5">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirmation(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Delete account
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-4">
                      <div>
                        <label htmlFor="delete-confirmation" className="block text-sm font-medium text-gray-700">
                          Type DELETE to confirm
                        </label>
                        <input
                          type="text"
                          id="delete-confirmation"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                          placeholder="DELETE"
                          disabled={isLoading}
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={handleDeleteAccount}
                          disabled={isLoading || deleteConfirmation !== 'DELETE'}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Confirm deletion'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteConfirmation(false);
                            setDeleteConfirmation('');
                          }}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 