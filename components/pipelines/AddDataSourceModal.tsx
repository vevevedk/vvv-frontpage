import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  XMarkIcon, 
  ServerIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AddDataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Account {
  id: number;
  name: string;
  company: {
    id: number;
    name: string;
  };
  configurations: AccountConfiguration[];
}

interface AccountConfiguration {
  id: number;
  name: string;
  config_type: string;
  config_data: Record<string, any>;
}

interface PipelineFormData {
  name: string;
  account_id: number;
  account_configuration_id: number;
  pipeline_type: string;
  schedule: string;
  schedule_config: Record<string, any>;
  config: Record<string, any>;
}

const PIPELINE_TYPES = [
  { value: 'woocommerce', label: 'WooCommerce', description: 'E-commerce platform data sync' },
  { value: 'google_search_console', label: 'Google Search Console', description: 'Search performance data' },
  { value: 'google_ads', label: 'Google Ads', description: 'Advertising campaign data' },
  { value: 'google_analytics', label: 'Google Analytics', description: 'Website analytics data' },
  { value: 'facebook_ads', label: 'Facebook Ads', description: 'Social media advertising data' },
  { value: 'tiktok_ads', label: 'TikTok Ads', description: 'TikTok advertising data' },
  { value: 'linkedin_ads', label: 'LinkedIn Ads', description: 'LinkedIn advertising data' },
  { value: 'shopify', label: 'Shopify', description: 'E-commerce platform data sync' },
];

const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Manual Only', description: 'Run only when manually triggered' },
  { value: 'hourly', label: 'Hourly', description: 'Run every hour' },
  { value: 'daily', label: 'Daily', description: 'Run once per day' },
  { value: 'weekly', label: 'Weekly', description: 'Run once per week' },
  { value: 'monthly', label: 'Monthly', description: 'Run once per month' },
];

export default function AddDataSourceModal({ isOpen, onClose }: AddDataSourceModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<PipelineFormData>({
    name: '',
    account_id: 0,
    account_configuration_id: 0,
    pipeline_type: '',
    schedule: 'manual',
    schedule_config: {},
    config: {},
  });

  const [availableConfigurations, setAvailableConfigurations] = useState<AccountConfiguration[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
      setFormData({
        name: '',
        account_id: 0,
        account_configuration_id: 0,
        pipeline_type: '',
        schedule: 'manual',
        schedule_config: {},
        config: {},
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.account_id && formData.pipeline_type) {
      const account = accounts.find(acc => acc.id === formData.account_id);
      if (account) {
        const configs = account.configurations.filter(
          config => config.config_type === formData.pipeline_type
        );
        setAvailableConfigurations(configs);
        if (configs.length > 0) {
          setFormData(prev => ({ ...prev, account_configuration_id: configs[0].id }));
        } else {
          setFormData(prev => ({ ...prev, account_configuration_id: 0 }));
        }
      }
    }
  }, [formData.account_id, formData.pipeline_type, accounts]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/pipelines/available_accounts/', {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      setError('Failed to fetch accounts');
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.account_id || !formData.account_configuration_id || !formData.pipeline_type) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/pipelines/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create pipeline');
      }
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Optionally refresh the parent component
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pipeline');
      console.error('Error creating pipeline:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof PipelineFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <ServerIcon className="h-6 w-6 text-indigo-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Add New Data Source</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-sm text-green-800">
                  Pipeline created successfully! Redirecting...
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Pipeline Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Pipeline Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Porsa Orders Sync"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Account Selection */}
            <div>
              <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-2">
                Account *
              </label>
              <select
                id="account"
                value={formData.account_id}
                onChange={(e) => handleInputChange('account_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value={0}>Select an account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pipeline Type */}
            <div>
              <label htmlFor="pipeline_type" className="block text-sm font-medium text-gray-700 mb-2">
                Pipeline Type *
              </label>
              <select
                id="pipeline_type"
                value={formData.pipeline_type}
                onChange={(e) => handleInputChange('pipeline_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              >
                <option value="">Select pipeline type</option>
                {PIPELINE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Configuration */}
            <div>
              <label htmlFor="configuration" className="block text-sm font-medium text-gray-700 mb-2">
                Connection / Configuration *
              </label>
              {availableConfigurations.length > 0 ? (
                <select
                  id="configuration"
                  value={formData.account_configuration_id}
                  onChange={(e) => handleInputChange('account_configuration_id', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${touched.account_configuration_id && !formData.account_configuration_id ? 'border-red-300' : 'border-gray-300'}`}
                  required
                >
                  <option value={0}>Select configuration</option>
                  {availableConfigurations.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-md text-sm text-yellow-900">
                  No connection found for this account and type.
                  <div className="mt-2">
                    <Link href={`/admin?tab=accounts`} className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
                      Create connection
                    </Link>
                    <p className="mt-2 text-xs text-yellow-800">After creating a connection, return here and select it.</p>
                  </div>
                </div>
              )}
              {touched.account_configuration_id && !formData.account_configuration_id && availableConfigurations.length > 0 && (
                <p className="mt-1 text-xs text-red-600">Please select a connection/configuration</p>
              )}
            </div>

            {/* Schedule */}
            <div>
              <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-2">
                Schedule
              </label>
              <select
                id="schedule"
                value={formData.schedule}
                onChange={(e) => handleInputChange('schedule', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {SCHEDULE_OPTIONS.map((schedule) => (
                  <option key={schedule.value} value={schedule.value}>
                    {schedule.label} - {schedule.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Schedule Configuration (conditional) */}
            {formData.schedule !== 'manual' && (
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Schedule Configuration</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.schedule === 'daily' && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Time</label>
                      <input
                        type="time"
                        value={formData.schedule_config.time || '09:00'}
                        onChange={(e) => handleInputChange('schedule_config', { ...formData.schedule_config, time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  )}
                  {formData.schedule === 'weekly' && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Day of Week</label>
                        <select
                          value={formData.schedule_config.dayOfWeek || 'monday'}
                          onChange={(e) => handleInputChange('schedule_config', { ...formData.schedule_config, dayOfWeek: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="monday">Monday</option>
                          <option value="tuesday">Tuesday</option>
                          <option value="wednesday">Wednesday</option>
                          <option value="thursday">Thursday</option>
                          <option value="friday">Friday</option>
                          <option value="saturday">Saturday</option>
                          <option value="sunday">Sunday</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Time</label>
                        <input
                          type="time"
                          value={formData.schedule_config.time || '09:00'}
                          onChange={(e) => handleInputChange('schedule_config', { ...formData.schedule_config, time: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </>
                  )}
                  {formData.schedule === 'monthly' && (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Day of Month</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={formData.schedule_config.dayOfMonth || '1'}
                          onChange={(e) => handleInputChange('schedule_config', { ...formData.schedule_config, dayOfMonth: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Time</label>
                        <input
                          type="time"
                          value={formData.schedule_config.time || '09:00'}
                          onChange={(e) => handleInputChange('schedule_config', { ...formData.schedule_config, time: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || loading || !formData.name || !formData.account_id || !formData.pipeline_type || !formData.account_configuration_id}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <ClockIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Creating...
                  </>
                ) : (
                  'Create Pipeline'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 