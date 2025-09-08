import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ShoppingBagIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../lib/auth/AuthContext';
import { api } from '../../lib/api';
import StatsCard from '../StatsCard';

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  recent_orders: number;
  status_breakdown: Array<{
    status: string;
    count: number;
  }>;
}

export default function OrderAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchOrderStats();
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/woocommerce/configs');
      if (response.data && Array.isArray(response.data)) {
        setClients(response.data.map((config: any) => ({
          id: config.account?.name || config.name,
          name: config.account?.name || config.name
        })));
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchOrderStats = async () => {
    try {
      setLoading(true);
      const url = selectedClient === 'all' 
        ? '/woocommerce/orders/stats/'
        : `/woocommerce/orders/stats/?client_id=${selectedClient}`;
      const response = await api.get(url);
      
      // Debug: Check for duplicate status values
      if (response.data?.status_breakdown) {
        const statusCounts = {};
        response.data.status_breakdown.forEach(status => {
          statusCounts[status.status] = (statusCounts[status.status] || 0) + 1;
        });
        
        const duplicates = Object.entries(statusCounts).filter(([status, count]) => count > 1);
        if (duplicates.length > 0) {
          console.warn('Duplicate status values found:', duplicates);
          console.log('Full status breakdown data:', response.data.status_breakdown);
        }
      }
      
      // Process the data to handle duplicate status values
      if (response.data?.status_breakdown) {
        const processedBreakdown = [];
        const statusMap = new Map();
        
        response.data.status_breakdown.forEach(status => {
          if (statusMap.has(status.status)) {
            // Combine duplicate statuses
            const existing = statusMap.get(status.status);
            existing.count += status.count;
          } else {
            // Add new status
            statusMap.set(status.status, { ...status });
            processedBreakdown.push(statusMap.get(status.status));
          }
        });
        
        // Update the response data with processed breakdown
        response.data.status_breakdown = processedBreakdown;
      }
      
      setStats(response.data);
    } catch (err) {
      setError('Failed to fetch order statistics');
      console.error('Error fetching order stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={fetchOrderStats}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Order statistics will appear here once you sync WooCommerce data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Selector */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Client Selection</h3>
            <p className="text-sm text-gray-500">Choose a specific client or view all data</p>
          </div>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Orders"
          value={stats.total_orders.toLocaleString()}
          icon={<ShoppingBagIcon className="h-6 w-6" />}
          color="blue"
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.total_revenue)}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          color="green"
        />
        <StatsCard
          title="Recent Orders"
          value={stats.recent_orders.toLocaleString()}
          icon={<CalendarIcon className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="Avg Order Value"
          value={stats.total_orders > 0 
            ? formatCurrency(stats.total_revenue / stats.total_orders)
            : '$0.00'
          }
          icon={<UserIcon className="h-6 w-6" />}
          color="yellow"
        />
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Order Status Breakdown</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Distribution of orders by their current status
          </p>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
            {stats.status_breakdown.map((status, index) => (
              <div
                key={`${status.status}-${index}`}
                className={`px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 ${
                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <dt className="text-sm font-medium text-gray-500 capitalize">
                  {status.status.replace('_', ' ')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex items-center">
                    <span className="font-medium">{status.count.toLocaleString()}</span>
                    <span className="ml-2 text-gray-500">
                      ({((status.count / stats.total_orders) * 100).toFixed(1)}%)
                    </span>
                    <div className="ml-4 flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full"
                        style={{ width: `${(status.count / stats.total_orders) * 100}%` }}
                      />
                    </div>
                  </div>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Common actions for managing your WooCommerce data
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => window.open('/woocommerce/orders/', '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ShoppingBagIcon className="h-4 w-4 mr-2" />
              View All Orders
            </button>
            
            <button
                              onClick={() => window.open('/woocommerce/jobs/', '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              View Sync Jobs
            </button>
            
            <button
                              onClick={() => window.open('/woocommerce/logs/', '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              View Sync Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 