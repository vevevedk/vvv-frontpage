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
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
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
  ArcElement,
  RadialLinearScale
);

interface AdvancedAnalyticsData {
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
    total_customers: number;
    repeat_customer_rate: number;
  };
  trends: {
    daily: Array<{
      date: string;
      orders: number;
      revenue: number;
      customers: number;
    }>;
    hourly: Array<{
      hour: number;
      orders: number;
      revenue: number;
    }>;
  };
  customer_insights: {
    new_customers: number;
    returning_customers: number;
    customer_lifetime_value: number;
    top_customer_segments: Array<{
      segment: string;
      count: number;
      revenue: number;
    }>;
  };
  performance_metrics: {
    conversion_rate: number;
    cart_abandonment_rate: number;
    avg_session_duration: number;
    bounce_rate: number;
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
      
      // For now, we'll use the existing analytics endpoint and enhance the data
      const response = await api.get(`/woocommerce/orders/analytics?${params}`);
      if (response.data && typeof response.data === 'object') {
        const data = response.data as any;
        // Enhance the data with additional metrics
        const enhancedData: AdvancedAnalyticsData = {
          period: data.period || period,
          date_range: data.date_range || { start: new Date().toISOString(), end: new Date().toISOString() },
          overview: data.overview || { total_orders: 0, total_revenue: 0, avg_order_value: 0, completion_rate: 0, avg_completion_hours: 0, total_customers: 0, repeat_customer_rate: 0 },
          trends: data.trends || { daily: [], hourly: [] },
          customer_insights: {
            new_customers: Math.floor((data.overview?.total_orders || 0) * 0.3), // Placeholder
            returning_customers: Math.floor((data.overview?.total_orders || 0) * 0.7), // Placeholder
            customer_lifetime_value: (data.overview?.avg_order_value || 0) * 2.5, // Placeholder
            top_customer_segments: [
              { segment: 'High Value', count: Math.floor((data.overview?.total_orders || 0) * 0.1), revenue: (data.overview?.total_revenue || 0) * 0.4 },
              { segment: 'Medium Value', count: Math.floor((data.overview?.total_orders || 0) * 0.3), revenue: (data.overview?.total_revenue || 0) * 0.4 },
              { segment: 'Low Value', count: Math.floor((data.overview?.total_orders || 0) * 0.6), revenue: (data.overview?.total_revenue || 0) * 0.2 }
            ]
          },
          performance_metrics: {
            conversion_rate: 2.5, // Placeholder
            cart_abandonment_rate: 68.8, // Placeholder
            avg_session_duration: 185, // seconds
            bounce_rate: 45.2 // Placeholder
          }
        };
        setAnalytics(enhancedData);
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
  const customerSegmentsData = {
    labels: analytics.customer_insights.top_customer_segments.map(s => s.segment),
    datasets: [
      {
        data: analytics.customer_insights.top_customer_segments.map(s => s.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // High Value - green
          'rgba(59, 130, 246, 0.8)',   // Medium Value - blue
          'rgba(245, 158, 11, 0.8)',   // Low Value - amber
        ],
        borderWidth: 1,
      },
    ],
  };

  const performanceRadarData = {
    labels: ['Conversion Rate', 'Completion Rate', 'Customer Retention', 'Revenue Growth', 'Order Growth'],
    datasets: [
      {
        label: 'Performance Score',
        data: [
          analytics.performance_metrics.conversion_rate * 10,
          analytics.overview.completion_rate,
          analytics.customer_insights.returning_customers / analytics.overview.total_orders * 100,
          Math.abs(analytics.overview.total_revenue > 0 ? 100 : 0),
          Math.abs(analytics.overview.total_orders > 0 ? 100 : 0)
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)'
      }
    ]
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

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
      },
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

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.performance_metrics.conversion_rate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Customer LTV</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.customer_insights.customer_lifetime_value)}</p>
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
              <p className="text-sm font-medium text-gray-500">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(analytics.performance_metrics.avg_session_duration / 60)}m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Segments */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Segments</h3>
          <div className="flex items-center justify-center h-64">
            <Doughnut data={customerSegmentsData} options={chartOptions} />
          </div>
          <div className="mt-4 space-y-2">
            {analytics.customer_insights.top_customer_segments.map((segment) => (
              <div key={segment.segment} className="flex justify-between text-sm">
                <span className="capitalize">{segment.segment}</span>
                <span>{segment.count} customers</span>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Radar */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h3>
          <div className="flex items-center justify-center h-64">
            <Radar data={performanceRadarData} options={radarOptions} />
          </div>
        </div>
      </div>

      {/* Customer Insights */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Customer Insights</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{analytics.customer_insights.new_customers}</div>
              <div className="text-sm text-gray-500">New Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{analytics.customer_insights.returning_customers}</div>
              <div className="text-sm text-gray-500">Returning Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Math.round(analytics.customer_insights.returning_customers / analytics.overview.total_orders * 100)}%
              </div>
              <div className="text-sm text-gray-500">Retention Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Conversion & Engagement</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="text-sm font-medium">{analytics.performance_metrics.conversion_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Cart Abandonment</span>
                  <span className="text-sm font-medium">{analytics.performance_metrics.cart_abandonment_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Bounce Rate</span>
                  <span className="text-sm font-medium">{analytics.performance_metrics.bounce_rate}%</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Customer Behavior</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Avg Session Duration</span>
                  <span className="text-sm font-medium">{Math.floor(analytics.performance_metrics.avg_session_duration / 60)}m {analytics.performance_metrics.avg_session_duration % 60}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Customer LTV</span>
                  <span className="text-sm font-medium">{formatCurrency(analytics.customer_insights.customer_lifetime_value)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Repeat Purchase Rate</span>
                  <span className="text-sm font-medium">
                    {Math.round(analytics.customer_insights.returning_customers / analytics.overview.total_orders * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
