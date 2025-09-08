import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import StatsCard from '../components/StatsCard';
import DashboardLayout from '../components/layouts/DashboardLayout';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { users, companies } from '../lib/api';

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
}

interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export default function Dashboard() {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'profile', name: 'Profile' },
    { id: 'company', name: 'Company' },
    { id: 'settings', name: 'Settings' },
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = await users.getCurrentUser();
      if (userData) {
        setUser(userData);
        if (userData.company?.id) {
          const companyData = await companies.get(userData.company.id);
          if (companyData) {
            setCompany(companyData);
          }
        } else {
          setCompany(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await users.deleteAccount();
        await logout();
        router.push('/');
      } catch (err) {
        alert('Failed to delete account. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      if (!user?.email) {
        setError('No email address available');
        return;
      }
      
      await users.resendVerification(user.email);
      setSuccess('Verification email sent successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError('Failed to send verification email. Please try again.');
    }
  };

  // Set active tab based on URL query
  useEffect(() => {
    const tab = router.query.tab as string;
    if (tab && ['overview', 'profile', 'company', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [router.query.tab]);

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <ErrorMessage 
            error={error} 
            onRetry={fetchData}
            className="mb-6"
          />

          <SuccessMessage 
            message={success || ''}
            onDismiss={() => setSuccess(null)}
            className="mb-6"
          />

          {activeTab === 'overview' && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-text mb-2">Overview</h2>
                <p className="text-gray-600">Welcome to your dashboard. Here's what's happening with your account.</p>
              </div>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <StatsCard
                  title="Account Status"
                  value={user?.email_verified ? 'Verified' : 'Unverified'}
                  description={user?.email_verified ? 'Email verified' : 'Email not verified'}
                  color={user?.email_verified ? 'green' : 'yellow'}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
                <StatsCard
                  title="Role"
                  value={user?.role || 'N/A'}
                  description="User role"
                  color="purple"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
                <StatsCard
                  title="Company"
                  value={user?.company ? 'Connected' : 'None'}
                  description={user?.company?.name || 'No company linked'}
                  color={user?.company ? 'blue' : 'gray'}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                />
                <StatsCard
                  title="Last Login"
                  value="Today"
                  description="Active session"
                  color="indigo"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-white overflow-hidden shadow rounded-custom">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-text">Welcome back!</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Here's an overview of your account.
                    </p>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-custom">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-text">Profile Status</h3>
                    <div className="mt-2">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {user?.email_verified ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/20 text-secondary">
                              Unverified
                            </span>
                          )}
                        </div>
                        <div className="ml-2 text-sm text-gray-500">
                          {user?.email_verified
                            ? 'Your email is verified'
                            : 'Please verify your email'}
                        </div>
                      </div>
                      {!user?.email_verified && (
                        <button
                          onClick={handleResendVerification}
                          className="mt-2 text-sm text-primary hover:text-primary-dark"
                        >
                          Resend verification email
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-custom">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-text">Company Information</h3>
                    {user?.company ? (
                      <dl className="mt-2">
                        <dt className="text-sm font-medium text-gray-500">Company name</dt>
                        <dd className="mt-1 text-sm text-text">{user.company.name}</dd>
                      </dl>
                    ) : (
                      <p className="mt-1 text-sm text-gray-600">
                        No company information available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white shadow rounded-custom">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-text">Profile Information</h3>
                  <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">
                        First name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={user?.first_name || ''}
                          disabled
                          className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Last name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          value={user?.last_name || ''}
                          disabled
                          className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Email address
                      </label>
                      <div className="mt-1">
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Phone number
                      </label>
                      <div className="mt-1">
                        <input
                          type="tel"
                          value={user?.phone || ''}
                          disabled
                          className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link
                      href="/profile"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Edit Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white shadow rounded-custom">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-text">Company Information</h3>
                  {user?.company ? (
                    <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Company name
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={user.company.name}
                            disabled
                            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Company address
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            value={user.company.address || ''}
                            disabled
                            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Company phone
                        </label>
                        <div className="mt-1">
                          <input
                            type="tel"
                            value={user.company.phone || ''}
                            disabled
                            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Company email
                        </label>
                        <div className="mt-1">
                          <input
                            type="email"
                            value={user.company.email || ''}
                            disabled
                            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-600">
                      No company information available
                    </p>
                  )}
                  <div className="mt-6">
                    <Link
                      href="/profile"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Edit Company Information
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="px-4 py-6 sm:px-0">
              <div className="bg-white shadow rounded-custom">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-text">Account Settings</h3>
                  <div className="mt-6 space-y-6">
                    <div>
                      <Link
                        href="/change-password"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                      >
                        Change Password
                      </Link>
                    </div>
                    <div>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Deleting...
                          </>
                        ) : (
                          'Delete Account'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
} 