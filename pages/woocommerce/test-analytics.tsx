import React from 'react';
import WooCommerceDashboard from '../../components/woocommerce/WooCommerceDashboard';

export default function TestWooCommerceAnalytics() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">WooCommerce Analytics Test</h1>
          <p className="text-gray-600 mt-2">
            Test page for WooCommerce analytics components
          </p>
        </div>
        
        <WooCommerceDashboard />
      </div>
    </div>
  );
}
















