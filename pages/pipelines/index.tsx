import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import PipelineDashboard from '../../components/pipelines/PipelineDashboard';
import { useAuth } from '../../lib/auth/AuthContext';

export default function PipelinesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!(user.role === 'super_admin' || user.role === 'agency_admin')) {
        // Non-admins should not access pipelines page; redirect to analytics
        router.replace('/woocommerce');
      } else {
        // Redirect admins to the admin pipelines tab for consistency
        router.replace('/admin?tab=pipelines');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Data Pipeline Management</h1>
            <p className="mt-2 text-gray-600">
              Manage and monitor data pipelines across all your sources including WooCommerce, Google APIs, and more
            </p>
          </div>
          
          <PipelineDashboard />
        </div>
      </div>
    </Layout>
  );
} 