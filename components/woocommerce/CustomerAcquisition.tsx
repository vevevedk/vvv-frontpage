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
  UserPlusIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
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

interface CustomerAcquisitionData {
  period: number;
  new_customer_window: number;
  currency?: string;
  date_range: {
    start: string;
    end: string;
  };
  overview: {
    new_customers: number;
    returning_customers: number;
    total_unique_customers: number;
    new_customer_percentage: number;
    new_customer_revenue: number;
    returning_customer_revenue: number;
    total_revenue: number;
    new_customer_revenue_percentage: number;
    avg_new_customer_order_value: number;
    avg_returning_customer_order_value: number;
    total_new_customer_orders: number;
    total_returning_customer_orders: number;
  };
  cac_metrics: {
    total_marketing_spend: number;
    customer_acquisition_cost: number;
    revenue_per_new_customer: number;
    cac_payback_ratio: number;
    note: string;
  };
  growth: {
    new_customer_growth: number;
    previous_period: {
      new_customers: number;
    };
  };
  trends: {
    daily: Array<{
      date: string;
      new_customers: number;
      revenue: number;
      orders: number;
    }>;
  };
  top_new_customers: Array<{
    email: string;
    total_spent: number;
    orders: number;
    first_order_date: string;
  }>;
}

export default function CustomerAcquisition() {
  const [data, setData] = useState<CustomerAcquisitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<number>(30);
  const [newCustomerWindow, setNewCustomerWindow] = useState<number>(365);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchData();
  }, [period, selectedClient, newCustomerWindow]);

  const fetchClients = async () => {
    try {
      // Fetch actual client names from orders instead of config names
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        period: period.toString(),
        new_customer_window: newCustomerWindow.toString()
      });
      if (selectedClient !== 'all') {
        params.append('client_name', selectedClient);
      }

      const response = await api.get<CustomerAcquisitionData>(`/woocommerce/orders/customer_acquisition/?${params}`);
      if (response.error) {
        setError(response.error.message || 'Failed to fetch customer acquisition data');
        console.error('Customer acquisition error:', response.error);
        return;
      }
      setData(response.data || null);
    } catch (err) {
      setError('Failed to fetch customer acquisition data');
      console.error('Customer acquisition error:', err);
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

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️ {error || 'No data available'}</div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Chart data preparation
  const dailyNewCustomersChartData = {
    labels: data.trends.daily.map(d => formatDate(d.date)),
    datasets: [
      {
        label: 'New Customers',
        data: data.trends.daily.map(d => d.new_customers),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Revenue from New Customers',
        data: data.trends.daily.map(d => d.revenue),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const customerTypeChartData = {
    labels: ['New Customers', 'Returning Customers'],
    datasets: [
      {
        data: [data.overview.new_customers, data.overview.returning_customers],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // green
          'rgba(59, 130, 246, 0.8)',   // blue
        ],
        borderWidth: 1,
      },
    ],
  };

  const revenueTypeChartData = {
    labels: ['New Customer Revenue', 'Returning Customer Revenue'],
    datasets: [
      {
        data: [data.overview.new_customer_revenue, data.overview.returning_customer_revenue],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Customers'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Revenue ($)'
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Acquisition Analytics</h2>
            <p className="text-gray-600 mt-1">
              Track new customer growth and acquisition costs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Client Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Time Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
          </div>

          {/* New Customer Window */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Customer Window
            </label>
            <select
              value={newCustomerWindow}
              onChange={(e) => setNewCustomerWindow(Number(e.target.value))}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>12 months</option>
              <option value={730}>24 months</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <ClockIcon className="inline-block w-4 h-4 mr-1" />
          Analyzing period: {formatDate(data.date_range.start)} - {formatDate(data.date_range.end)}
          <span className="ml-4">
            Customer is considered "new" if no purchase in last {newCustomerWindow} days
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="New Customers"
          value={data.overview.new_customers.toString()}
          icon={<UserPlusIcon className="h-6 w-6" />}
          trend={{
            value: Math.abs(data.growth.new_customer_growth),
            isPositive: data.growth.new_customer_growth > 0
          }}
        />
        
        <StatsCard
          title="New Customer Revenue"
          value={formatCurrency(data.overview.new_customer_revenue)}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          description={`${data.overview.new_customer_revenue_percentage.toFixed(1)}% of total`}
        />

        <StatsCard
          title="Avg New Customer Value"
          value={formatCurrency(data.overview.avg_new_customer_order_value)}
          icon={<ChartBarIcon className="h-6 w-6" />}
          description={`${data.overview.total_new_customer_orders} orders`}
        />

        <StatsCard
          title="New vs Returning"
          value={`${data.overview.new_customer_percentage.toFixed(1)}%`}
          icon={<UsersIcon className="h-6 w-6" />}
          description={`${data.overview.new_customers} new / ${data.overview.returning_customers} returning`}
        />
      </div>

      {/* CAC Metrics (Placeholder for future integration) */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
        <div className="flex items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Customer Acquisition Cost (CAC)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {data.cac_metrics.note}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-md">
                <div className="text-sm text-gray-600">Marketing Spend</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data.cac_metrics.total_marketing_spend)}
                </div>
                <div className="text-xs text-gray-500 mt-1">To be integrated</div>
              </div>
              <div className="bg-white p-4 rounded-md">
                <div className="text-sm text-gray-600">CAC</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data.cac_metrics.customer_acquisition_cost)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Per new customer</div>
              </div>
              <div className="bg-white p-4 rounded-md">
                <div className="text-sm text-gray-600">Revenue per New Customer</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(data.cac_metrics.revenue_per_new_customer)}
                </div>
                <div className="text-xs text-gray-500 mt-1">Average in period</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily New Customers Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Daily New Customer Acquisition
          </h3>
          <div style={{ height: '300px' }}>
            <Line data={dailyNewCustomersChartData} options={chartOptions} />
          </div>
        </div>

        {/* Customer Type Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Customer Type Distribution
          </h3>
          <div style={{ height: '300px' }}>
            <Doughnut data={customerTypeChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Revenue by Customer Type
          </h3>
          <div style={{ height: '300px' }}>
            <Doughnut data={revenueTypeChartData} options={doughnutOptions} />
          </div>
        </div>

        {/* Comparison Metrics */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            New vs Returning Comparison
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">New Customers</div>
                <div className="text-2xl font-bold text-gray-900">{data.overview.new_customers}</div>
                <div className="text-sm text-gray-500">{data.overview.total_new_customer_orders} orders</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Avg Order Value</div>
                <div className="text-xl font-semibold text-green-600">
                  {formatCurrency(data.overview.avg_new_customer_order_value)}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <div>
                <div className="text-sm text-gray-600">Returning Customers</div>
                <div className="text-2xl font-bold text-gray-900">{data.overview.returning_customers}</div>
                <div className="text-sm text-gray-500">{data.overview.total_returning_customer_orders} orders</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Avg Order Value</div>
                <div className="text-xl font-semibold text-blue-600">
                  {formatCurrency(data.overview.avg_returning_customer_order_value)}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Unique Customers</span>
                <span className="text-lg font-semibold text-gray-900">{data.overview.total_unique_customers}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">Total Revenue</span>
                <span className="text-lg font-semibold text-gray-900">{formatCurrency(data.overview.total_revenue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top New Customers */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Top New Customers by Spend
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.top_new_customers.map((customer, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(customer.first_order_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(customer.total_spent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Growth Comparison */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Period Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Previous Period</div>
            <div className="text-3xl font-bold text-gray-900">
              {data.growth.previous_period.new_customers}
            </div>
            <div className="text-xs text-gray-500 mt-1">new customers</div>
          </div>
          
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Current Period</div>
            <div className="text-3xl font-bold text-indigo-600">
              {data.overview.new_customers}
            </div>
            <div className="text-xs text-gray-500 mt-1">new customers</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Growth Rate</div>
            <div className={`text-3xl font-bold ${data.growth.new_customer_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.growth.new_customer_growth >= 0 ? '+' : ''}{data.growth.new_customer_growth.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.growth.new_customer_growth >= 0 ? (
                <span className="flex items-center justify-center">
                  <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                  Growing
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                  Declining
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



