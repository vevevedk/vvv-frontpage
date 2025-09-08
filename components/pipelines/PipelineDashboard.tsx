import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  ServerIcon, 
  ClockIcon, 
  ChartBarIcon, 
  CogIcon,
  PlusIcon,
  ShieldCheckIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';
import DataSourceManagement from './DataSourceManagement';
import JobMonitoring from './JobMonitoring';
import PipelineAnalytics from './PipelineAnalytics';
import DataQuality from './DataQuality';
import PipelineLogs from './PipelineLogs';
import SyncLogs from '../woocommerce/SyncLogs';
import AddDataSourceModal from './AddDataSourceModal';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PipelineDashboard() {
  const [isAddDataSourceModalOpen, setIsAddDataSourceModalOpen] = useState(false);

  const tabs = [
    {
      name: 'Data Sources',
      icon: ServerIcon,
      component: DataSourceManagement,
      description: 'Manage data source configurations'
    },
    {
      name: 'Jobs',
      icon: ClockIcon,
      component: JobMonitoring,
      description: 'Monitor pipeline jobs and schedules'
    },
    {
      name: 'Analytics',
      icon: ChartBarIcon,
      component: PipelineAnalytics,
      description: 'View pipeline performance and insights'
    },
    {
      name: 'Data Quality',
      icon: ShieldCheckIcon,
      component: DataQuality,
      description: 'Monitor data quality and validation'
    },
    {
      name: 'Logs',
      icon: CogIcon,
      component: PipelineLogs,
      description: 'Review pipeline logs and errors'
    },
    {
      name: 'WooCommerce Logs',
      icon: CogIcon,
      component: SyncLogs,
      description: 'WooCommerce-specific sync logs'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Add Data Source Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Data Pipeline Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor your data pipelines across all sources
          </p>
        </div>
        <button
          onClick={() => setIsAddDataSourceModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Data Source
        </button>
      </div>

      {/* Tab Navigation */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          {tabs.map((tab) => (
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
          {tabs.map((tab) => (
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

      {/* Add Data Source Modal */}
      <AddDataSourceModal
        isOpen={isAddDataSourceModalOpen}
        onClose={() => setIsAddDataSourceModalOpen(false)}
      />
    </div>
  );
} 