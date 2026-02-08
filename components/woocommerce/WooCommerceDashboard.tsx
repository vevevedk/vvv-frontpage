import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import {
  ShoppingCartIcon,
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  ListBulletIcon,
  UserPlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import ClientManagement from './ClientManagement';
import JobMonitoring from './JobMonitoring';
import OrderAnalytics from './OrderAnalytics';
import AnalyticsDashboard from './AnalyticsDashboard';
import AdvancedAnalytics from './AdvancedAnalytics';
import EnhancedAnalytics from './EnhancedAnalytics';
import CustomerAcquisition from './CustomerAcquisition';
import SubscriptionAnalytics from './SubscriptionAnalytics';
import ChannelReport from './ChannelReport';
import SyncLogs from './SyncLogs';
import AddClientModal from './AddClientModal';
import ChannelClassificationManager from './ChannelClassificationManager';
import StatsCard from '../StatsCard';


function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function WooCommerceDashboard() {
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isChannelClassificationOpen, setIsChannelClassificationOpen] = useState(false);
  const [stats, setStats] = useState({
    totalPipelines: 0,
    enabled: 0,
    disabled: 0,
    activeJobs: 0
  });
  const [loading, setLoading] = useState(true);

  const tabs = [
    // Admin-only tabs (clients, jobs, logs)
    {
      name: 'Clients',
      icon: ShoppingCartIcon,
      component: ClientManagement,
      description: 'Manage WooCommerce store configurations',
      adminOnly: true,
    },
    {
      name: 'Jobs',
      icon: ClockIcon,
      component: JobMonitoring,
      description: 'Monitor sync jobs and schedules',
      adminOnly: true,
    },
    {
      name: 'Analytics',
      icon: ChartBarIcon,
      component: AnalyticsDashboard,
      description: 'Basic performance analytics and insights'
    },
    {
      name: 'Advanced',
      icon: ChartBarIcon,
      component: AdvancedAnalytics,
      description: 'Deep analytics with customer insights and performance metrics'
    },
    {
      name: 'Enhanced',
      icon: ChartBarIcon,
      component: EnhancedAnalytics,
      description: 'Comprehensive analytics with customer segmentation and real-time insights'
    },
    {
      name: 'New Customers',
      icon: UserPlusIcon,
      component: CustomerAcquisition,
      description: 'Customer acquisition analytics with CAC tracking'
    },
    {
      name: 'Subscriptions',
      icon: ArrowPathIcon,
      component: SubscriptionAnalytics,
      description: 'Recurring purchase and subscription analytics'
    },
    {
      name: 'Orders',
      icon: ListBulletIcon,
      component: OrderAnalytics,
      description: 'View order data and basic statistics'
    },
    {
      name: 'Channels',
      icon: ChartBarIcon,
      component: ChannelReport,
      description: 'Marketing channel performance and attribution'
    },
    {
      name: 'Logs',
      icon: CogIcon,
      component: SyncLogs,
      description: 'Review sync logs and errors',
      adminOnly: true,
    }
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
              // Get the access token from localStorage
        const accessToken = localStorage.getItem('accessToken');
        
        const [configsResponse, jobsResponse] = await Promise.all([
          fetch('/api/woocommerce/configs', {
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
            },
          }).then(res => res.ok ? res.json() : []),
          fetch('/api/woocommerce/jobs', {
            headers: {
              'Content-Type': 'application/json',
              ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
            },
          }).then(res => res.ok ? res.json() : [])
        ]);

      const configs = Array.isArray(configsResponse) ? configsResponse : [];
      const jobs = Array.isArray(jobsResponse) ? jobsResponse : [];

      setStats({
        totalPipelines: configs.length,
        enabled: configs.filter((c: any) => c.enabled).length,
        disabled: configs.filter((c: any) => !c.enabled).length,
        activeJobs: jobs.filter((j: any) => j.status === 'running').length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Determine user role from localStorage (quick client-side guard)
  const role = (typeof window !== 'undefined' ? localStorage.getItem('role') : '') || '';
  const isAdmin = ['super_admin', 'agency_admin'].includes(role);

  return (
    <div className="space-y-6">
      {/* Header with Add Client Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Marketing analytics overview</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" />

      {/* Tab Navigation */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs
            .filter(t => !t.adminOnly) // remove admin-only tabs from WC dashboard
            .map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                  selected
                    ? 'bg-white shadow text-blue-700'
                    : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                )
              }
            >
              <div className="flex items-center justify-center space-x-2">
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </div>
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-6">
          {tabs
            .filter(t => !t.adminOnly)
            .map((tab) => (
            <Tab.Panel
              key={tab.name}
              className={classNames(
                'rounded-xl bg-white p-6',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
              )}
            >
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">{tab.name}</h3>
                <p className="text-sm text-gray-500">{tab.description}</p>
              </div>
              <tab.component />
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
      />

      {/* Channel Classification Manager Modal */}
      <ChannelClassificationManager
        isOpen={isChannelClassificationOpen}
        onClose={() => setIsChannelClassificationOpen(false)}
        onClassificationsUpdated={() => {
          // Refresh the channel report when classifications are updated
          console.log('Channel classifications updated');
        }}
      />
    </div>
  );
} 