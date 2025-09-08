import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/auth/AuthContext';

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const { user, updateUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) return;

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Failed to verify email');
        }

        const updatedUser = await response.json();
        updateUser(updatedUser);
        setSuccess('Email verified successfully!');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, router, updateUser]);

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Email Verification</h3>
              
              {isLoading && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Verifying your email...</p>
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                  <div className="mt-2">
                    <button
                      onClick={() => router.push('/dashboard')}
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              )}

              {success && (
                <div className="mt-4 rounded-md bg-green-50 p-4">
                  <div className="text-sm text-green-700">{success}</div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Redirecting to dashboard...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 