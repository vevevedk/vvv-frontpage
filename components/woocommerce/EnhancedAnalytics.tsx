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
  ChartBarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShoppingBagIcon,
  ClockIcon,
  GlobeAltIcon,
  CreditCardIcon,
  ExclamationTriangleIcon
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

interface EnhancedAnalyticsData {
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
    unique_customers: number;
    repeat_customer_rate: number;
    estimated_conversion_rate: number;
  };
  customer_insights: {
    repeat_customers: number;
    new_customers: number;
    customer_lifetime_value: number;
  };
  geographic: {
    top_countries: Array<{
      country: string;
      orders: number;
      revenue: number;
    }>;
  };
  product_performance: {
    top_products: Array<{
      name: string;
      quantity: number;
      revenue: number;
    }>;
  };
  payment_analysis: {
    methods: Array<{
      method: string;
      orders: number;
      revenue: number;
      avg_value: number;
    }>;
  };
  time_analysis: {
    hourly_distribution: Array<{
      hour: number;
      orders: number;
      revenue: number;
    }>;
  };
  status_breakdown: Array<{
    status: string;
    count: number;
    revenue: number;
    avg_value: number;
  }>;
}

interface CustomerSegmentationData {
  period: number;
  date_range: {
    start: string;
    end: string;
  };
  overview: {
    total_customers: number;
    total_orders: number;
    total_revenue: number;
  };
  segment_metrics: {
    [key: string]: {
      count: number;
      percentage: number;
      total_revenue: number;
      avg_order_value: number;
    };
  };
  segments: {
    new_customers: Array<any>;
    returning_customers: Array<any>;
    high_value_customers: Array<any>;
    lapsed_customers: Array<any>;
  };
  customer_lifetime_value: {
    top_customers: Array<any>;
    average_lifetime_days: number;
  };
}

export default function EnhancedAnalytics() {
  const [analytics, setAnalytics] = useState<EnhancedAnalyticsData | null>(null);
  const [segmentation, setSegmentation] = useState<CustomerSegmentationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState(30);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchEnhancedAnalytics();
    fetchCustomerSegmentation();
  }, [period, selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await api.get<Array<{id: string, name: string}>>('/woocommerce/orders/client_names/');
      if (response.error) {
        console.error('Failed to fetch clients:', response.error);
        return;
      }
      if (response.data && Array.isArray(response.data)) {
        setClients(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchEnhancedAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        period: period.toString(),
      });
      if (selectedClient !== 'all') {
        params.append('client_name', selectedClient);
      }

      const response = await api.get<EnhancedAnalyticsData>(`/woocommerce/orders/enhanced_analytics/?${params}`);
      if (response.error) {
        setError(response.error.message || 'Failed to fetch enhanced analytics');
        console.error('Error fetching enhanced analytics:', response.error);
        return;
      }
      setAnalytics(response.data || null);
    } catch (err) {
      setError('Failed to fetch enhanced analytics');
      console.error('Error fetching enhanced analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerSegmentation = async () => {
    try {
      const params = new URLSearchParams({
        period: period.toString(),
      });
      if (selectedClient !== 'all') {
        params.append('client_name', selectedClient);
      }

      const response = await api.get<CustomerSegmentationData>(`/woocommerce/orders/customer_segmentation/?${params}`);
      if (response.error) {
        console.error('Error fetching customer segmentation:', response.error);
        return;
      }
      setSegmentation(response.data || null);
    } catch (err) {
      console.error('Error fetching customer segmentation:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return <div>No analytics data available</div>;
  }

  const formatCurrency = (amount: number) => {
    const currency = analytics?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Prepare chart data
  const hourlyChartData = {
    labels: analytics.time_analysis.hourly_distribution.map(item => `${item.hour}:00`),
    datasets: [
      {
        label: 'Orders',
        data: analytics.time_analysis.hourly_distribution.map(item => item.orders),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1
      },
      {
        label: 'Revenue',
        data: analytics.time_analysis.hourly_distribution.map(item => item.revenue),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };

  const statusChartData = {
    labels: analytics.status_breakdown.map(item => item.status),
    datasets: [
      {
        data: analytics.status_breakdown.map(item => item.count),
        backgroundColor: [
          '#3B82F6',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#F97316'
        ]
      }
    ]
  };

  const paymentChartData = {
    labels: analytics.payment_analysis.methods.map(item => item.method),
    datasets: [
      {
        label: 'Revenue',
        data: analytics.payment_analysis.methods.map(item => item.revenue),
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive insights into your WooCommerce performance
          </p>
        </div>
        
        {/* Controls */}
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Clients</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Orders"
          value={analytics.overview.total_orders}
          icon={<ShoppingBagIcon className="h-6 w-6" />}
        />
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(analytics.overview.total_revenue)}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
        />
        <StatsCard
          title="Avg Order Value"
          value={formatCurrency(analytics.overview.avg_order_value)}
          icon={<ChartBarIcon className="h-6 w-6" />}
        />
        <StatsCard
          title="Unique Customers"
          value={analytics.overview.unique_customers}
          icon={<UserGroupIcon className="h-6 w-6" />}
        />
      </div>

      {/* Customer Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Insights</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Repeat Customers</span>
              <span className="font-medium">{analytics.customer_insights.repeat_customers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">New Customers</span>
              <span className="font-medium">{analytics.customer_insights.new_customers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Repeat Rate</span>
              <span className="font-medium">{analytics.overview.repeat_customer_rate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">CLV</span>
              <span className="font-medium">{formatCurrency(analytics.customer_insights.customer_lifetime_value)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Geographic Performance</h3>
          <div className="space-y-3">
            {analytics.geographic.top_countries.slice(0, 5).map((country, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-600">{country.country}</span>
                <span className="font-medium">{formatCurrency(country.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {analytics.product_performance.top_products.slice(0, 5).map((product, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-600 truncate">{product.name}</span>
                <span className="font-medium">{formatCurrency(product.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Hourly Order Distribution</h3>
          <Line 
            data={hourlyChartData}
            options={{
              responsive: true,
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              },
            }}
          />
        </div>

        {/* Status Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status Breakdown</h3>
          <Doughnut data={statusChartData} />
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Method Performance</h3>
        <Bar 
          data={paymentChartData}
          options={{
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }}
        />
      </div>

      {/* Customer Segmentation */}
      {segmentation && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Segmentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(segmentation.segment_metrics).map(([segment, metrics]) => (
              <div key={segment} className="text-center p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 capitalize">
                  {segment.replace('_', ' ')}
                </h4>
                <div className="text-2xl font-bold text-blue-600 mt-2">
                  {metrics.count}
                </div>
                <div className="text-sm text-gray-500">
                  {metrics.percentage}% of total
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {formatCurrency(metrics.total_revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}






