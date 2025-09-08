import React, { useState, useEffect } from 'react';
import { 
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import StatsCard from '../StatsCard';
import { api } from '../../lib/api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsData {
  period: number;
  date_range: {
    start: string;
    end: string;
  };
  overview: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    completion_rate: number;
    avg_completion_hours: number;
  };
  growth: {
    revenue_growth: number;
    order_growth: number;
    previous_period: {
      orders: number;
      revenue: number;
    };
  };
  trends: {
    daily: Array<{
      date: string;
      orders: number;
      revenue: number;
    }>;
    monthly: Array<{
      month: string;
      orders: number;
      revenue: number;
    }>;
  };
  breakdowns: {
    status: Array<{
      status: string;
      count: number;
      revenue: number;
      percentage: number;
    }>;
    payment_methods: Array<{
      method: string;
      count: number;
      revenue: number;
      percentage: number;
    }>;
  };
  customers: {
    top_customers: Array<{
      email: string;
      name: string;
      orders: number;
      total_spent: number;
    }>;
  };
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<number>(30);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [period, selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/woocommerce/configs');
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

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ period: period.toString() });
      if (selectedClient !== 'all') {
        params.append('client_name', selectedClient);
      }
      
      const response = await api.get<AnalyticsData>(`/woocommerce/orders/analytics?${params}`);
      if (response.data) {
        setAnalytics(response.data);
      }
    } catch (err) {
      setError('Failed to fetch analytics data');
      console.error('Analytics error:', err);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️ {error || 'No data available'}</div>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Chart data preparation
  const revenueChartData = {
    labels: analytics.trends.daily.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'Revenue',
        data: analytics.trends.daily.map(d => d.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const ordersChartData = {
    labels: analytics.trends.daily.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'Orders',
        data: analytics.trends.daily.map(d => d.orders),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const statusChartData = {
    labels: analytics.breakdowns.status.map(s => s.status),
    datasets: [
      {
        data: analytics.breakdowns.status.map(s => s.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // processing - green
          'rgba(59, 130, 246, 0.8)',   // pending - blue
          'rgba(245, 158, 11, 0.8)',   // on-hold - amber
          'rgba(239, 68, 68, 0.8)',    // cancelled - red
          'rgba(139, 92, 246, 0.8)',   // completed - purple
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          
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
        
        <div className="text-sm text-gray-500">
          Data from {formatDate(analytics.date_range.start)} to {formatDate(analytics.date_range.end)}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(analytics.overview.total_revenue)}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          color="green"
          trend={{
            value: Math.abs(analytics.growth.revenue_growth),
            isPositive: analytics.growth.revenue_growth >= 0
          }}
        />
        <StatsCard
          title="Total Orders"
          value={analytics.overview.total_orders.toLocaleString()}
          icon={<ShoppingBagIcon className="h-6 w-6" />}
          color="blue"
          trend={{
            value: Math.abs(analytics.growth.order_growth),
            isPositive: analytics.growth.order_growth >= 0
          }}
        />
        <StatsCard
          title="Avg Order Value"
          value={formatCurrency(analytics.overview.avg_order_value)}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          color="purple"
        />
        <StatsCard
          title="Completion Rate"
          value={`${analytics.overview.completion_rate}%`}
          icon={<ClockIcon className="h-6 w-6" />}
          color="yellow"
        />
        <StatsCard
          title="Avg Completion"
          value={`${analytics.overview.avg_completion_hours.toFixed(1)}h`}
          icon={<ClockIcon className="h-6 w-6" />}
          color="gray"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <Line data={revenueChartData} options={chartOptions} />
        </div>

        {/* Orders Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Orders Trend</h3>
          <Bar data={ordersChartData} options={chartOptions} />
        </div>
      </div>

      {/* Status Breakdown and Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Breakdown</h3>
          <div className="flex items-center justify-center h-64">
            <Doughnut data={statusChartData} />
          </div>
          <div className="mt-4 space-y-2">
            {analytics.breakdowns.status.map((status, index) => (
              <div key={status.status} className="flex justify-between text-sm">
                <span className="capitalize">{status.status}</span>
                <span>{status.count} ({status.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {analytics.breakdowns.payment_methods.map((method) => (
              <div key={method.method} className="flex justify-between items-center">
                <div>
                  <div className="font-medium capitalize">{method.method}</div>
                  <div className="text-sm text-gray-500">{method.count} orders</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatCurrency(method.revenue)}</div>
                  <div className="text-sm text-gray-500">{method.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Customers</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Order
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.customers.top_customers.map((customer, index) => (
                  <tr key={customer.email} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.name || 'Anonymous'}
                        </div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.orders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.total_spent)}
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(customer.total_spent / customer.orders)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue Growth</span>
              <span className={`text-sm font-medium ${
                analytics.growth.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analytics.growth.revenue_growth >= 0 ? '+' : ''}{analytics.growth.revenue_growth}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Order Growth</span>
              <span className={`text-sm font-medium ${
                analytics.growth.order_growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {analytics.growth.order_growth >= 0 ? '+' : ''}{analytics.growth.order_growth}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="text-sm font-medium text-blue-600">
                {analytics.overview.completion_rate}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => window.open('/woocommerce/orders/', '_blank')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              📊 View Detailed Orders
            </button>
            <button
              onClick={() => window.open('/woocommerce/jobs/', '_blank')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              ⚡ Monitor Sync Jobs
            </button>
            <button
              onClick={() => window.open('/woocommerce/logs/', '_blank')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              📝 Review Sync Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}