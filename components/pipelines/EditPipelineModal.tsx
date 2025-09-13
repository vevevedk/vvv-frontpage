import React, { useEffect, useState } from 'react';
import { XMarkIcon, ServerIcon, ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface EditPipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipeline: any; // DataPipeline shape from DataSourceManagement
}

interface Account {
  id: number;
  name: string;
  company: { id: number; name: string };
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

const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Manual Only' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function EditPipelineModal({ isOpen, onClose, pipeline }: EditPipelineModalProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [availableConfigurations, setAvailableConfigurations] = useState<AccountConfiguration[]>([]);
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

  useEffect(() => {
    if (!isOpen) return;
    // Prefill from pipeline
    setFormData({
      name: pipeline?.name || '',
      account_id: pipeline?.account?.id || 0,
      account_configuration_id: pipeline?.account_configuration?.id || 0,
      pipeline_type: pipeline?.pipeline_type || '',
      schedule: pipeline?.schedule || 'manual',
      schedule_config: pipeline?.schedule_config || {},
      config: pipeline?.config || {},
    });
    fetchAccounts();
  }, [isOpen, pipeline]);

  useEffect(() => {
    // Recompute configurations when account/type changes
    if (!formData.account_id || !formData.pipeline_type) return;
    const acc = accounts.find((a) => a.id === formData.account_id);
    if (!acc) return;
    const configs = acc.configurations.filter((c) => c.config_type === formData.pipeline_type);
    setAvailableConfigurations(configs);
    if (configs.length > 0 && !configs.some((c) => c.id === formData.account_configuration_id)) {
      setFormData((prev) => ({ ...prev, account_configuration_id: configs[0].id }));
    }
  }, [accounts, formData.account_id, formData.pipeline_type]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('/api/pipelines/available_accounts', {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof PipelineFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const accessToken = localStorage.getItem('accessToken');
      const res = await fetch(`/api/pipelines/${pipeline.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.message || `Failed to update pipeline (${res.status})`);
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      setError(e.message || 'Failed to update pipeline');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <ServerIcon className="h-6 w-6 text-indigo-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Edit Pipeline</h3>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
          </div>

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-sm text-green-800">Pipeline updated successfully</p>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pipeline Name *</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" value={formData.account_id} onChange={(e) => handleInputChange('account_id', parseInt(e.target.value))}>
                <option value={0}>Select an account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} - {a.company.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pipeline Type *</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" value={formData.pipeline_type} onChange={(e) => handleInputChange('pipeline_type', e.target.value)}>
                <option value="woocommerce">WooCommerce</option>
                <option value="google_search_console">Google Search Console</option>
                <option value="google_ads">Google Ads</option>
                <option value="google_analytics">Google Analytics</option>
                <option value="facebook_ads">Facebook Ads</option>
                <option value="tiktok_ads">TikTok Ads</option>
                <option value="linkedin_ads">LinkedIn Ads</option>
                <option value="shopify">Shopify</option>
              </select>
            </div>

            {availableConfigurations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Configuration *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" value={formData.account_configuration_id} onChange={(e) => handleInputChange('account_configuration_id', parseInt(e.target.value))}>
                  {availableConfigurations.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" value={formData.schedule} onChange={(e) => handleInputChange('schedule', e.target.value)}>
                {SCHEDULE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {formData.schedule !== 'manual' && (
              <div className="p-4 bg-gray-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Schedule Configuration</h4>
                {/* Minimal editable JSON blob */}
                <textarea className="w-full min-h-[90px] px-3 py-2 border border-gray-300 rounded-md text-xs font-mono" value={JSON.stringify(formData.schedule_config || {}, null, 2)} onChange={(e) => {
                  try { handleInputChange('schedule_config', JSON.parse(e.target.value || '{}')); } catch {}
                }} />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pipeline Config (JSON)</label>
              <textarea className="w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md text-xs font-mono" value={JSON.stringify(formData.config || {}, null, 2)} onChange={(e) => {
                try { handleInputChange('config', JSON.parse(e.target.value || '{}')); } catch {}
              }} />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white hover:bg-gray-50" disabled={submitting}>Cancel</button>
              <button type="submit" disabled={submitting || loading} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? (<><ClockIcon className="animate-spin -ml-1 mr-2 h-4 w-4" />Saving…</>) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}




