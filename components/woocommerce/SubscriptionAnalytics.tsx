import React, { useState, useEffect } from 'react';
import {
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';

interface SubscriberData {
  email: string;
  product_name: string;
  total_orders: number;
  total_revenue: number;
  first_order_date: string | null;
  last_order_date: string | null;
  days_since_last_order: number | null;
  avg_interval_days: number;
  status: 'active' | 'at_risk' | 'churned' | 'unknown';
}

interface SubscriptionAnalyticsData {
  period: number;
  currency: string;
  date_range: {
    start: string;
    end: string;
  };
  params: {
    min_purchases: number;
    reorder_window_days: number;
    churn_multiplier: number;
    at_risk_days: number;
  };
  overview: {
    total_subscribers: number;
    active_subscribers: number;
    at_risk_subscribers: number;
    churned_subscribers: number;
    new_subscribers_period: number;
    subscriber_revenue: number;
    subscriber_revenue_percentage: number;
    avg_subscriber_ltv: number;
    avg_subscription_length_months: number;
    churn_rate: number;
    net_subscriber_growth: number;
  };
  health: {
    avg_orders_per_subscriber: number;
    avg_days_between_orders: number;
  };
  at_risk_subscribers: SubscriberData[];
  recently_churned: SubscriberData[];
  new_subscribers: SubscriberData[];
}

export default function SubscriptionAnalytics() {
  const [data, setData] = useState<SubscriptionAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<number>(90);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [minPurchases, setMinPurchases] = useState<number>(2);
  const [reorderWindow, setReorderWindow] = useState<number>(35);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchData();
  }, [period, selectedClient, minPurchases, reorderWindow]);

  const fetchClients = async () => {
    try {
      const response = await api.get<Array<{id: string, name: string}>>('/woocommerce/orders/client_names/');
      if (response.data && Array.isArray(response.data)) {
        setClients(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        period: period.toString(),
        min_purchases: minPurchases.toString(),
        reorder_window_days: reorderWindow.toString(),
      });
      if (selectedClient !== 'all') {
        params.append('client_name', selectedClient);
      }

      const response = await api.get<SubscriptionAnalyticsData>(`/woocommerce/orders/subscription_analytics/?${params}`);
      if (response.data) {
        setData(response.data);
      } else if (response.error) {
        setError(response.error.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Failed to fetch subscription analytics');
      console.error('Subscription analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = data?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error || 'No data available'}</div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Subscription Analytics</h2>
            <p className="text-gray-600 mt-1">
              Track customers with recurring purchases of the same product
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Client Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          {/* Time Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
          </div>

          {/* Min Purchases */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Purchases</label>
            <select
              value={minPurchases}
              onChange={(e) => setMinPurchases(Number(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value={2}>2+ orders</option>
              <option value={3}>3+ orders</option>
              <option value={4}>4+ orders</option>
              <option value={5}>5+ orders</option>
            </select>
          </div>

          {/* Reorder Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expected Reorder</label>
            <select
              value={reorderWindow}
              onChange={(e) => setReorderWindow(Number(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value={14}>~14 days</option>
              <option value={30}>~30 days</option>
              <option value={35}>~35 days</option>
              <option value={45}>~45 days</option>
              <option value={60}>~60 days</option>
              <option value={90}>~90 days</option>
            </select>
          </div>

          {/* Info */}
          <div className="flex items-end">
            <div className="text-xs text-gray-500">
              <ClockIcon className="inline-block w-3 h-3 mr-1" />
              {formatDate(data.date_range.start)} - {formatDate(data.date_range.end)}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
              <p className="text-3xl font-bold text-gray-900">{data.overview.total_subscribers}</p>
              <p className="text-sm text-green-600 mt-1">
                +{data.overview.new_subscribers_period} new this period
              </p>
            </div>
            <UserGroupIcon className="h-10 w-10 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-green-600">{data.overview.active_subscribers}</p>
              <p className="text-sm text-gray-500 mt-1">
                {data.overview.total_subscribers > 0
                  ? ((data.overview.active_subscribers / data.overview.total_subscribers) * 100).toFixed(1)
                  : 0}% of total
              </p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">At Risk</p>
              <p className="text-3xl font-bold text-yellow-600">{data.overview.at_risk_subscribers}</p>
              <p className="text-sm text-gray-500 mt-1">
                {data.overview.total_subscribers > 0
                  ? ((data.overview.at_risk_subscribers / data.overview.total_subscribers) * 100).toFixed(1)
                  : 0}% of total
              </p>
            </div>
            <ExclamationTriangleIcon className="h-10 w-10 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Churned</p>
              <p className="text-3xl font-bold text-red-600">{data.overview.churned_subscribers}</p>
              <p className="text-sm text-gray-500 mt-1">
                {data.overview.churn_rate.toFixed(1)}% churn rate
              </p>
            </div>
            <XCircleIcon className="h-10 w-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Key Metrics - Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Subscriber Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.subscriber_revenue)}</p>
              <p className="text-sm text-indigo-600 mt-1">
                {data.overview.subscriber_revenue_percentage.toFixed(1)}% of total revenue
              </p>
            </div>
            <CurrencyDollarIcon className="h-10 w-10 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div>
            <p className="text-sm font-medium text-gray-600">Avg Subscriber LTV</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.overview.avg_subscriber_ltv)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {data.health.avg_orders_per_subscriber.toFixed(1)} orders avg
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div>
            <p className="text-sm font-medium text-gray-600">Avg Subscription Length</p>
            <p className="text-2xl font-bold text-gray-900">{data.overview.avg_subscription_length_months.toFixed(1)} months</p>
            <p className="text-sm text-gray-500 mt-1">
              ~{data.health.avg_days_between_orders.toFixed(0)} days between orders
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Growth</p>
              <p className={`text-2xl font-bold ${data.overview.net_subscriber_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.overview.net_subscriber_growth >= 0 ? '+' : ''}{data.overview.net_subscriber_growth}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                new - churned
              </p>
            </div>
            {data.overview.net_subscriber_growth >= 0
              ? <ArrowTrendingUpIcon className="h-10 w-10 text-green-500" />
              : <ArrowTrendingDownIcon className="h-10 w-10 text-red-500" />
            }
          </div>
        </div>
      </div>

      {/* At-Risk Subscribers Table */}
      {data.at_risk_subscribers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              At-Risk Subscribers ({data.overview.at_risk_subscribers})
            </h3>
            <span className="text-sm text-yellow-600">
              These subscribers are overdue for their expected reorder
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Ago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Interval</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LTV</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.at_risk_subscribers.map((subscriber, idx) => (
                  <tr key={idx} className="hover:bg-yellow-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscriber.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscriber.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(subscriber.last_order_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">{subscriber.days_since_last_order} days</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscriber.avg_interval_days} days</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscriber.total_orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(subscriber.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recently Churned Table */}
      {data.recently_churned.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Recently Churned ({data.overview.churned_subscribers})
            </h3>
            <span className="text-sm text-red-600">
              These subscribers have exceeded the expected reorder window
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Ago</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">LTV</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.recently_churned.slice(0, 10).map((subscriber, idx) => (
                  <tr key={idx} className="hover:bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscriber.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscriber.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(subscriber.last_order_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">{subscriber.days_since_last_order} days</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscriber.total_orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(subscriber.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Subscribers Table */}
      {data.new_subscribers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              New Subscribers This Period ({data.overview.new_subscribers_period})
            </h3>
            <span className="text-sm text-green-600">
              Customers who became subscribers during this period
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.new_subscribers.slice(0, 10).map((subscriber, idx) => (
                  <tr key={idx} className="hover:bg-green-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscriber.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscriber.product_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(subscriber.first_order_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(subscriber.last_order_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscriber.total_orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{formatCurrency(subscriber.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
