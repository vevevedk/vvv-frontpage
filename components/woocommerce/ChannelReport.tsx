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
  FunnelIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import ChannelClassificationManager from './ChannelClassificationManager';

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

interface ChannelData {
  channelType: string;
  sessions: number;
  orders: number;
  orderTotal: number;
  cvr: number;
  aov: number;
}

interface ChannelReportData {
  currentPeriod: {
    dateStart: string;
    dateEnd: string;
    offset: number;
    lookback: number;
    comparison: string;
    total: ChannelData;
    channels: ChannelData[];
  };
  comparisonPeriod: {
    dateStart: string;
    dateEnd: string;
    period: string;
    total: ChannelData;
    channels: ChannelData[];
  };
  popChange: {
    total: {
      sessions: number;
      orders: number;
      orderTotal: number;
      cvr: number;
      aov: number;
    };
    channels: {
      [key: string]: {
        sessions: number;
        orders: number;
        orderTotal: number;
        cvr: number;
        aov: number;
      };
    };
  };
  unclassifiedData: {
    count: number;
    examples: Array<{
      source: string;
      medium: string;
      sourceMedium: string;
      sessions: number;
    }>;
  };
  currency?: string;
}

interface ChannelClassification {
  source: string;
  medium: string;
  sourceMedium: string;
  channel: string;
  channelType: string;
}

const DEFAULT_CHANNEL_CLASSIFICATIONS: ChannelClassification[] = [
  { source: '(direct)', medium: 'typein', sourceMedium: '(direct)/typein', channel: 'direct / none', channelType: 'Direct' },
  { source: 'google', medium: 'organic', sourceMedium: 'google/organic', channel: 'google / organic', channelType: 'SEO' },
  { source: 'l.instagram.com', medium: 'referral', sourceMedium: 'l.instagram.com/referral', channel: 'Instagram / organic', channelType: 'Organic Social' },
  { source: 'mailpoet', medium: 'utm', sourceMedium: 'mailpoet/utm', channel: 'email / organic', channelType: 'Email' },
  { source: 'Klaviyo', medium: 'utm', sourceMedium: 'Klaviyo/utm', channel: 'email / organic', channelType: 'Email' },
  { source: 'duckduckgo.com', medium: 'referral', sourceMedium: 'duckduckgo.com/referral', channel: 'duckduckgo / organic', channelType: 'SEO' },
  { source: 'app.wonnda.com', medium: 'referral', sourceMedium: 'app.wonnda.com/referral', channel: 'wonnda / referal', channelType: 'Referal' },
  { source: 'chatgpt.com', medium: 'referral', sourceMedium: 'chatgpt.com/referral', channel: 'chatgpt / referal', channelType: 'ChatGpt' },
  { source: 'fb', medium: 'utm', sourceMedium: 'fb/utm', channel: 'facebook / paid', channelType: 'Paid Social' },
  { source: 'ig', medium: 'utm', sourceMedium: 'ig/utm', channel: 'instagram / paid', channelType: 'Paid Social' },
  { source: 'tagassistant.google.com', medium: 'referral', sourceMedium: 'tagassistant.google.com/referral', channel: 'tagmanager /. test', channelType: 'Test' },
  { source: 'chatgpt.com', medium: 'utm', sourceMedium: 'chatgpt.com/utm', channel: 'chatgpt / utm', channelType: 'ChatGpt' },
  { source: 'google', medium: 'utm', sourceMedium: 'google/utm', channel: 'google / utm', channelType: 'Paid Search' },
  { source: 'bing.com', medium: 'referral', sourceMedium: 'bing.com/referral', channel: 'bing / referal', channelType: 'Organic Search' },
  { source: 'crmcredorax.lightning.force.com', medium: 'referral', sourceMedium: 'crmcredorax.lightning.force.com/referral', channel: 'test / test', channelType: 'Test' },
  { source: 'dk.search.yahoo.com', medium: 'referral', sourceMedium: 'dk.search.yahoo.com/referral', channel: 'yahoo / referral', channelType: 'Referral' },
  { source: 'trustpilot', medium: 'utm', sourceMedium: 'trustpilot/utm', channel: 'trustpilot / utm', channelType: 'Referral' },
  { source: 'google,google', medium: 'utm', sourceMedium: 'google,google/utm', channel: 'google,google / utm', channelType: 'ChannelNotFound' }
];

export default function ChannelReport() {
  const [reportData, setReportData] = useState<ChannelReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<number>(55);
  const [comparisonType, setComparisonType] = useState<'MoM' | 'QoQ' | 'YoY'>('MoM');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [showUnclassifiedModal, setShowUnclassifiedModal] = useState(false);
  const [showClassificationManager, setShowClassificationManager] = useState(false);
  const [showAllChannels, setShowAllChannels] = useState<boolean>(true);
  type SortKey = 'channelType' | 'sessions' | 'orders' | 'orderTotal' | 'cvr' | 'aov';
  const [sortKey, setSortKey] = useState<SortKey>('orders');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    fetchChannelReport();
  }, [period, comparisonType, selectedClient]);

  const fetchClients = async () => {
    try {
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');

      // Fetch actual client names from orders instead of config names
      const response = await fetch('/api/woocommerce/orders/client_names/', {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data)) {
        setClients(data);
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  const fetchChannelReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ 
        period: period.toString(),
        comparison_type: comparisonType,
        client_name: selectedClient !== 'all' ? selectedClient : ''
      });
      
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/woocommerce/orders/channels_report/?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('ChannelReport API response:', data);
      console.log('Channels count:', data?.currentPeriod?.channels?.length);
      if (data) {
        setReportData(data);
      }
    } catch (err) {
      setError('Failed to fetch channel report data');
      console.error('Channel report error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = reportData?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    if (value === 0) return '0.0%';
    if (value > 0) return `+${value.toFixed(1)}%`;
    return `${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />;
    return null;
  };

  const exportToCSV = async () => {
    if (!reportData) return;

    try {
      // Fetch detailed order data from the API
      const accessToken = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ 
        period: period.toString(),
        client_name: selectedClient !== 'all' ? selectedClient : '',
        export: 'true' // Flag to get detailed order data
      });
      
      const response = await fetch(`/api/woocommerce/orders/channels_report/?${params}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const detailedData = await response.json();
      
      // Prepare CSV data with order details
      const csvData = [
        // Header row
        [
          'Order ID',
          'Order Date',
          'Order Total (DKK)',
          'UTM Source (meta:_wc_order_attribution_utm_source)',
          'Source Type (meta:_wc_order_attribution_source_type)',
          'Classified Channel Type',
          'Customer Email',
          'Order Status',
          'Currency',
          'Client Name'
        ],
        // Order rows
        ...(detailedData.orders || []).map((order: any) => [
          order.order_id || '',
          order.order_date || '',
          order.order_total ? parseFloat(order.order_total).toFixed(2) : '0.00',
          order.attribution_utm_source || '',
          order.attribution_source_type || '',
          order.channel_type || 'Unclassified',
          order.billing_email || '',
          order.status || '',
          order.currency || '',
          order.client_name || ''
        ])
      ];

      // Convert to CSV string
      const csvContent = csvData.map(row => 
        row.map((field: any) => `"${field}"`).join(',')
      ).join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `channel_orders_detailed_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">⚠️ {error || 'No data available'}</div>
        <button
          onClick={fetchChannelReport}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Build merged channel list when toggled
  const knownChannelTypes = [
    'SEO',
    'Paid Search',
    'Direct',
    'Organic Social',
    'Paid Social',
    'Email',
    'ChatGpt',
    'Referal',
    'Organic Search',
    'Test'
  ];

  const backendChannels = reportData.currentPeriod.channels;
  const backendMap = new Map(backendChannels.map(c => [c.channelType, c]));
  const mergedChannels = showAllChannels
    ? knownChannelTypes.map((ct) =>
        backendMap.get(ct) || {
          channelType: ct,
          sessions: 0,
          orders: 0,
          orderTotal: 0,
          cvr: 0,
          aov: 0,
        }
      )
    : backendChannels;

  console.log('backendChannels:', backendChannels);
  console.log('mergedChannels:', mergedChannels);

  const sortedChannels = [...mergedChannels].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    // @ts-ignore index access by key
    const va = a[sortKey];
    // @ts-ignore index access by key
    const vb = b[sortKey];
    if (typeof va === 'string' && typeof vb === 'string') {
      return va.localeCompare(vb) * dir;
    }
    return ((va as number) - (vb as number)) * dir;
  });

  // Chart data for channel performance
  const channelChartData = {
    labels: sortedChannels.map(c => c.channelType),
    datasets: [
      {
        label: 'Sessions',
        data: sortedChannels.map(c => c.sessions),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Orders',
        data: sortedChannels.map(c => c.orders),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
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

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Channel Performance Report</h2>
          <p className="text-sm text-gray-500">Marketing attribution and channel performance analysis</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={55}>Last 55 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          
          <select
            value={comparisonType}
            onChange={(e) => setComparisonType(e.target.value as 'MoM' | 'QoQ' | 'YoY')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="MoM">Month over Month</option>
            <option value="QoQ">Quarter over Quarter</option>
            <option value="YoY">Year over Year</option>
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

          <label className="inline-flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={showAllChannels}
              onChange={(e) => setShowAllChannels(e.target.checked)}
            />
            <span>Show all channels</span>
          </label>

          <button
            type="button"
            onClick={exportToCSV}
            disabled={!reportData}
            className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Export to CSV"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>

          <button
            type="button"
            onClick={fetchChannelReport}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 bg-white text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Refresh report"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
            ) : (
              <ArrowPathIcon className="h-4 w-4 mr-2" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Unclassified Data Alert */}
      {reportData.unclassifiedData.count > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  {reportData.unclassifiedData.count} unclassified traffic sources detected
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Some traffic sources don't match your channel classification rules
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowUnclassifiedModal(true)}
              className="px-3 py-2 text-sm font-medium text-yellow-800 bg-yellow-100 rounded-md hover:bg-yellow-200"
            >
              Review & Classify
            </button>
          </div>
        </div>
      )}

      {/* Channel Performance Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Channel Performance Overview</h3>
        <div className="h-80">
          <Bar data={channelChartData} options={chartOptions} />
        </div>
      </div>

      {/* Channel Report Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Channel Performance Report</h3>
          <p className="text-sm text-gray-500 mt-1">
            {reportData.currentPeriod.dateStart} to {reportData.currentPeriod.dateEnd} 
            ({comparisonType} comparison)
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => handleSort('channelType')} className="flex items-center gap-1">
                    Channel Type {sortKey === 'channelType' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => handleSort('sessions')} className="flex items-center justify-center gap-1 w-full">
                    Sessions {sortKey === 'sessions' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => handleSort('orders')} className="flex items-center justify-center gap-1 w-full">
                    Orders {sortKey === 'orders' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => handleSort('orderTotal')} className="flex items-center justify-center gap-1 w-full">
                    Order Total {sortKey === 'orderTotal' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => handleSort('cvr')} className="flex items-center justify-center gap-1 w-full">
                    CVR {sortKey === 'cvr' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => handleSort('aov')} className="flex items-center justify-center gap-1 w-full">
                    AOV {sortKey === 'aov' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                  </button>
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PoP%
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Total Row */}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {reportData.currentPeriod.total.sessions.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {reportData.currentPeriod.total.orders.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {formatCurrency(reportData.currentPeriod.total.orderTotal)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {reportData.currentPeriod.total.cvr.toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                  {formatCurrency(reportData.currentPeriod.total.aov)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <div className="flex items-center justify-center space-x-1">
                    {getChangeIcon(reportData.popChange.total.sessions)}
                    <span className={getChangeColor(reportData.popChange.total.sessions)}>
                      {formatPercentage(reportData.popChange.total.sessions)}
                    </span>
                  </div>
                </td>
              </tr>
              
              {/* Channel Rows */}
              {sortedChannels.map((channel, index) => {
                const popChange = reportData.popChange.channels[channel.channelType];
                return (
                  <tr key={channel.channelType} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {channel.channelType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {channel.sessions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {channel.orders.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {formatCurrency(channel.orderTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {channel.cvr.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {formatCurrency(channel.aov)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {popChange && (channel.sessions > 0 || channel.orders > 0) && (
                        <div className="flex items-center justify-center space-x-1">
                          {getChangeIcon(popChange.sessions)}
                          <span className={getChangeColor(popChange.sessions)}>
                            {formatPercentage(popChange.sessions)}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unclassified Data Modal */}
      {showUnclassifiedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Unclassified Traffic Sources</h3>
              <button
                onClick={() => setShowUnclassifiedModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <EyeIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                The following traffic sources don't match your current channel classification rules. 
                You can add new rules to automatically classify these sources.
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medium
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source Medium
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sessions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.unclassifiedData.examples.map((example, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {example.source}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {example.medium}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {example.sourceMedium}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {example.sessions.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowUnclassifiedModal(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => setShowClassificationManager(true)}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Manage Classifications
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel Classification Manager */}
      <ChannelClassificationManager
        isOpen={showClassificationManager}
        onClose={() => setShowClassificationManager(false)}
        onClassificationsUpdated={() => {
          fetchChannelReport();
          setShowClassificationManager(false);
        }}
      />
    </div>
  );
}
