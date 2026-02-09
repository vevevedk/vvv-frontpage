import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import {
  ShoppingCartIcon,
  ClockIcon,
  ChartBarIcon,
  CogIcon,
  ListBulletIcon,
  UserPlusIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import ClientManagement from './ClientManagement';
import JobMonitoring from './JobMonitoring';
import OrderAnalytics from './OrderAnalytics';
import OverviewTab from './OverviewTab';
import CustomersTab from './CustomersTab';
import SubscriptionAnalytics from './SubscriptionAnalytics';
import ChannelReport from './ChannelReport';
import SyncLogs from './SyncLogs';
import AddClientModal from './AddClientModal';
import ChannelClassificationManager from './ChannelClassificationManager';
import { DashboardFilterProvider, useDashboardFilter } from './DashboardFilterContext';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function DashboardInner() {
  const {
    period,
    setPeriod,
    selectedClient,
    setSelectedClient,
    clients,
    isAdmin,
    showEmails,
    setShowEmails,
    hideClientSelector,
  } = useDashboardFilter();

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isChannelClassificationOpen, setIsChannelClassificationOpen] = useState(false);

  const tabs = [
    // Admin-only tabs
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
    // User-facing tabs (7 → 5)
    {
      name: 'Overview',
      icon: ChartBarIcon,
      component: OverviewTab,
      description: 'Revenue, orders, trends, and product performance',
    },
    {
      name: 'Customers',
      icon: UserPlusIcon,
      component: CustomersTab,
      description: 'Customer acquisition, segmentation, and growth',
    },
    {
      name: 'Subscriptions',
      icon: ArrowPathIcon,
      component: SubscriptionAnalytics,
      description: 'Recurring purchase and subscription analytics',
    },
    {
      name: 'Orders',
      icon: ListBulletIcon,
      component: OrderAnalytics,
      description: 'View order data and basic statistics',
    },
    {
      name: 'Channels',
      icon: ChartBarIcon,
      component: ChannelReport,
      description: 'Marketing channel performance and attribution',
    },
    {
      name: 'Logs',
      icon: CogIcon,
      component: SyncLogs,
      description: 'Review sync logs and errors',
      adminOnly: true,
    },
  ];

  const visibleTabs = tabs.filter(t => !t.adminOnly);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
          <p className="text-sm text-gray-500 mt-1">Marketing analytics overview</p>
        </div>
      </div>

      {/* Global filter bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-lg shadow">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Period</label>
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={55}>Last 55 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 6 months</option>
            <option value={365}>Last year</option>
          </select>
        </div>

        {/* Client selector (hidden when ≤1 client) */}
        {!hideClientSelector && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Email toggle */}
        <button
          onClick={() => setShowEmails(!showEmails)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
          title={showEmails ? 'Hide emails' : 'Show emails'}
        >
          {showEmails ? (
            <><EyeSlashIcon className="h-4 w-4" /> Hide emails</>
          ) : (
            <><EyeIcon className="h-4 w-4" /> Show emails</>
          )}
        </button>
      </div>

      {/* Tab Navigation */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {visibleTabs.map((tab) => (
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
          {visibleTabs.map((tab) => (
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
          console.log('Channel classifications updated');
        }}
      />
    </div>
  );
}

export default function WooCommerceDashboard() {
  return (
    <DashboardFilterProvider>
      <DashboardInner />
    </DashboardFilterProvider>
  );
}
