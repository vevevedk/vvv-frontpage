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
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ClockIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import StatsCard from '../StatsCard';
import { api } from '../../lib/api';
import { formatCurrency } from '../../lib/formatCurrency';
import { maskEmail } from '../../lib/emailMask';
import { CHART_COLORS, CHART_SERIES, statusColor } from '../../lib/constants/chartColors';
import { useDashboardFilter } from './DashboardFilterContext';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, ArcElement
);

interface AnalyticsData {
  period: number;
  currency?: string;
  date_range: { start: string; end: string };
  overview: {
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
    completion_rate: number;
    avg_completion_hours: number;
    unique_customers?: number;
  };
  growth: {
    revenue_growth: number;
    order_growth: number;
    previous_period: { orders: number; revenue: number };
  };
  trends: {
    daily: Array<{ date: string; orders: number; revenue: number }>;
  };
  breakdowns: {
    status: Array<{ status: string; count: number; revenue: number; percentage: number }>;
    payment_methods: Array<{ method: string; count: number; revenue: number; percentage: number }>;
  };
  customers: {
    top_customers: Array<{ email: string; name: string; orders: number; total_spent: number }>;
  };
}

interface EnhancedData {
  currency?: string;
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
    top_countries: Array<{ country: string; orders: number; revenue: number }>;
  };
  product_performance: {
    top_products: Array<{ name: string; quantity: number; revenue: number }>;
  };
  time_analysis: {
    hourly_distribution: Array<{ hour: number; orders: number; revenue: number }>;
  };
  status_breakdown: Array<{ status: string; count: number; revenue: number; avg_value: number }>;
}

export default function OverviewTab() {
  const { period, selectedClient, showEmails } = useDashboardFilter();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [enhanced, setEnhanced] = useState<EnhancedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [period, selectedClient]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ period: period.toString() });
      if (selectedClient !== 'all') params.append('client_name', selectedClient);

      const [analyticsRes, enhancedRes] = await Promise.all([
        api.get<AnalyticsData>(`/woocommerce/orders/analytics?${params}`),
        api.get<EnhancedData>(`/woocommerce/orders/enhanced_analytics/?${params}`),
      ]);

      if (analyticsRes.data) setAnalytics(analyticsRes.data);
      if (enhancedRes.data) setEnhanced(enhancedRes.data);
    } catch (err) {
      setError('Failed to fetch overview data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error || 'No data available'}</div>
        <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Retry</button>
      </div>
    );
  }

  const currency = analytics.currency || enhanced?.currency || 'DKK';
  const fmt = (amount: number) => formatCurrency(amount, currency);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Revenue trend chart
  const revenueChartData = {
    labels: analytics.trends.daily.map(d => formatDate(d.date)),
    datasets: [{
      label: 'Revenue',
      data: analytics.trends.daily.map(d => d.revenue),
      borderColor: CHART_COLORS.primary,
      backgroundColor: 'rgba(0, 102, 204, 0.1)',
      tension: 0.4,
    }],
  };

  // Orders trend chart
  const ordersChartData = {
    labels: analytics.trends.daily.map(d => formatDate(d.date)),
    datasets: [{
      label: 'Orders',
      data: analytics.trends.daily.map(d => d.orders),
      backgroundColor: `${CHART_COLORS.secondary}cc`,
      borderColor: CHART_COLORS.secondary,
      borderWidth: 1,
    }],
  };

  // Status doughnut (color-coded)
  const statusLabels = analytics.breakdowns.status.map(s => s.status);
  const statusChartData = {
    labels: statusLabels,
    datasets: [{
      data: analytics.breakdowns.status.map(s => s.count),
      backgroundColor: statusLabels.map(s => statusColor(s)),
      borderWidth: 1,
    }],
  };

  const chartOpts = {
    responsive: true,
    plugins: { legend: { position: 'top' as const } },
    scales: { y: { beginAtZero: true } },
  };

  // Hourly charts (split into two)
  const hourlyData = enhanced?.time_analysis?.hourly_distribution || [];
  const hourlyOrdersData = {
    labels: hourlyData.map(h => `${h.hour}:00`),
    datasets: [{
      label: 'Orders',
      data: hourlyData.map(h => h.orders),
      borderColor: CHART_COLORS.primary,
      backgroundColor: 'rgba(0, 102, 204, 0.1)',
      tension: 0.1,
    }],
  };
  const hourlyRevenueData = {
    labels: hourlyData.map(h => `${h.hour}:00`),
    datasets: [{
      label: 'Revenue',
      data: hourlyData.map(h => h.revenue),
      borderColor: CHART_COLORS.secondary,
      backgroundColor: 'rgba(0, 204, 153, 0.1)',
      tension: 0.1,
    }],
  };

  return (
    <div className="space-y-6">
      {/* Date range label */}
      <div className="text-sm text-gray-500">
        Data from {formatDate(analytics.date_range.start)} to {formatDate(analytics.date_range.end)}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatsCard
          title="Total Revenue"
          value={fmt(analytics.overview.total_revenue)}
          icon={<CurrencyDollarIcon className="h-6 w-6" />}
          color="green"
          trend={{ value: Math.abs(analytics.growth.revenue_growth), isPositive: analytics.growth.revenue_growth >= 0 }}
        />
        <StatsCard
          title="Total Orders"
          value={analytics.overview.total_orders.toLocaleString()}
          icon={<ShoppingBagIcon className="h-6 w-6" />}
          color="blue"
          trend={{ value: Math.abs(analytics.growth.order_growth), isPositive: analytics.growth.order_growth >= 0 }}
        />
        <StatsCard
          title="Avg Order Value"
          value={fmt(analytics.overview.avg_order_value)}
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
          title="Unique Customers"
          value={(enhanced?.overview?.unique_customers ?? analytics.overview.unique_customers ?? 0).toLocaleString()}
          icon={<UserGroupIcon className="h-6 w-6" />}
          color="indigo"
        />
      </div>

      {/* Revenue + Orders trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
          <Line data={revenueChartData} options={chartOpts} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Orders Trend</h3>
          <Bar data={ordersChartData} options={{ ...chartOpts, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } } }} />
        </div>
      </div>

      {/* Customer Insights + Geographic + Top Products (from Enhanced) */}
      {enhanced && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Insights</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Repeat Customers</span>
                <span className="font-medium">{enhanced.customer_insights.repeat_customers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">New Customers</span>
                <span className="font-medium">{enhanced.customer_insights.new_customers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Repeat Rate</span>
                <span className="font-medium">{enhanced.overview.repeat_customer_rate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CLV</span>
                <span className="font-medium">{fmt(enhanced.customer_insights.customer_lifetime_value)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Geographic Performance</h3>
            <div className="space-y-3">
              {enhanced.geographic.top_countries.slice(0, 5).map((c, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-600">{c.country}</span>
                  <span className="font-medium">{fmt(c.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Top Products</h3>
            <div className="space-y-3">
              {enhanced.product_performance.top_products.slice(0, 5).map((p, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-gray-600 truncate">{p.name}</span>
                  <span className="font-medium">{fmt(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Breakdown + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status</h3>
          <div className="flex items-center justify-center h-64">
            <Doughnut data={statusChartData} />
          </div>
          <div className="mt-4 space-y-2">
            {analytics.breakdowns.status.map(s => (
              <div key={s.status} className="flex justify-between text-sm">
                <span className="capitalize">{s.status}</span>
                <span>{s.count} ({s.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {analytics.breakdowns.payment_methods.map(m => (
              <div key={m.method} className="flex justify-between items-center">
                <div>
                  <div className="font-medium capitalize">{m.method}</div>
                  <div className="text-sm text-gray-500">{m.count} orders</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{fmt(m.revenue)}</div>
                  <div className="text-sm text-gray-500">{m.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Distribution (split charts) */}
      {hourlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hourly Orders</h3>
            <Line data={hourlyOrdersData} options={{ ...chartOpts, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } } } }} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hourly Revenue</h3>
            <Line data={hourlyRevenueData} options={chartOpts} />
          </div>
        </div>
      )}

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Top Customers</h3>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Order</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.customers.top_customers.map((c, i) => (
                <tr key={c.email} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{c.name || 'Anonymous'}</div>
                    <div className="text-sm text-gray-500">{showEmails ? c.email : maskEmail(c.email)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{c.orders}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmt(c.total_spent)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmt(c.total_spent / c.orders)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
