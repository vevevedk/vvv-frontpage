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
import { Line, Bar } from 'react-chartjs-2';
import {
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/formatCurrency';

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

interface AdvancedAnalyticsData {
  period: number;
  currency?: string;
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
    unique_customers?: number;
  };
  growth?: {
    revenue_growth: number;
    order_growth: number;
  };
  trends: {
    daily: Array<{
      date: string;
      orders: number;
      revenue: number;
    }>;
  };
}

export default function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState<AdvancedAnalyticsData | null>(null);
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
      // Fetch actual client names from orders instead of config names
      const response = await api.get('/woocommerce/orders/client_names/');
      if (response.data && Array.isArray(response.data)) {
        setClients(response.data);
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

      const response = await api.get<AdvancedAnalyticsData>(`/woocommerce/orders/analytics?${params}`);
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

  const currency = analytics?.currency || 'DKK';
  const fmt = (amount: number) => formatCurrency(amount, currency);

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

  // Chart data - daily revenue trend
  const revenueChartData = {
    labels: (analytics.trends?.daily || []).map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'Revenue',
        data: (analytics.trends?.daily || []).map(d => d.revenue),
        borderColor: '#0066CC',
        backgroundColor: 'rgba(0, 102, 204, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const ordersChartData = {
    labels: (analytics.trends?.daily || []).map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'Orders',
        data: (analytics.trends?.daily || []).map(d => d.orders),
        backgroundColor: 'rgba(0, 204, 153, 0.8)',
        borderColor: '#00CC99',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-sm text-gray-500">Deep insights into your WooCommerce performance</p>
        </div>

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

          {clients.length > 1 && (
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
          )}
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(analytics.overview.total_revenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.total_orders.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.completion_rate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">{fmt(analytics.overview.avg_order_value)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <Line data={revenueChartData} options={chartOptions} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Orders Trend</h3>
          <Bar data={ordersChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
