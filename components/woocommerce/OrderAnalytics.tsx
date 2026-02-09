import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import StatsCard from '../StatsCard';
import { formatCurrency } from '../../lib/formatCurrency';
import { statusColor } from '../../lib/constants/chartColors';
import { useDashboardFilter } from './DashboardFilterContext';

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  recent_orders: number;
  currency?: string;
  status_breakdown: Array<{
    status: string;
    count: number;
  }>;
}

export default function OrderAnalytics() {
  const { period, selectedClient, isAdmin } = useDashboardFilter();
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrderStats();
  }, [period, selectedClient]);

  const fetchOrderStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period: period.toString() });
      if (selectedClient !== 'all') params.append('client_id', selectedClient);

      const response = await api.get(`/woocommerce/orders/stats/?${params}`);

      const data = response.data as any;
      // Process duplicate status values
      if (data?.status_breakdown) {
        const processedBreakdown: any[] = [];
        const statusMap = new Map<string, any>();

        data.status_breakdown.forEach((status: any) => {
          if (statusMap.has(status.status)) {
            const existing = statusMap.get(status.status);
            existing.count += status.count;
          } else {
            statusMap.set(status.status, { ...status });
            processedBreakdown.push(statusMap.get(status.status));
          }
        });

        data.status_breakdown = processedBreakdown;
      }

      setStats(data);
    } catch (err) {
      setError('Failed to fetch order statistics');
      console.error('Error fetching order stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const currency = stats?.currency || 'DKK';
  const fmt = (amount: number) => formatCurrency(amount, currency);

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
          value={fmt(stats.total_revenue)}
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
            ? fmt(stats.total_revenue / stats.total_orders)
            : fmt(0)
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
                        className="h-2 rounded-full"
                        style={{ width: `${(status.count / stats.total_orders) * 100}%`, backgroundColor: statusColor(status.status) }}
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

            {isAdmin && (
              <button
                onClick={() => window.open('/woocommerce/jobs/', '_blank')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                View Sync Jobs
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => window.open('/woocommerce/logs/', '_blank')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                View Sync Logs
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
