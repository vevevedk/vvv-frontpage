import React, { useState, useEffect } from 'react';
import { 
  ServerIcon, 
  PlayIcon, 
  StopIcon, 
  TrashIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../lib/auth/AuthContext';
import EditPipelineModal from './EditPipelineModal';


interface DataPipeline {
  id: number;
  name: string;
  pipeline_type: string;
  pipeline_type_display: string;
  schedule: string;
  schedule_display: string;
  enabled: boolean;
  account: {
    id: number;
    name: string;
    company: {
      id: number;
      name: string;
    };
  };
  account_configuration: {
    id: number;
    name: string;
    config_type: string;
  };
  next_run: string | null;
  created_by: {
    id: number;
    email: string;
  };
  created_at: string;
  updated_at: string;
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

export default function DataSourceManagement() {
  const { user } = useAuth();
  const [pipelines, setPipelines] = useState<DataPipeline[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const [syncing, setSyncing] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pipelineToEdit, setPipelineToEdit] = useState<DataPipeline | null>(null);

  useEffect(() => {
    fetchPipelines();
    fetchAccounts();
  }, []);

  const fetchPipelines = async () => {
    try {
      setLoading(true);
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/pipelines/', {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data) {
        setPipelines(data);
      }
    } catch (err) {
      setError('Failed to fetch pipelines');
      console.error('Error fetching pipelines:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      // Get the access token from localStorage
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
      if (data) {
        setAccounts(data);
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const togglePipelineStatus = async (pipelineId: number, enabled: boolean) => {
    try {
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/pipelines/${pipelineId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          enabled: !enabled
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      fetchPipelines(); // Refresh the list
    } catch (err) {
      alert('Failed to update pipeline status');
    }
  };

  const testConnection = async (pipelineId: number) => {
    try {
      setTestingConnection(pipelineId);
      
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/pipelines/${pipelineId}/test_connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.success) {
        alert('✅ Connection successful!');
      } else {
        alert('❌ Connection failed: ' + (data?.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert(`❌ Connection test failed: ${err.message || 'Unknown error'}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const triggerSync = async (pipelineId: number, retryCount = 0) => {
    try {
      setSyncing(pipelineId);
      
      // First test the connection to avoid unnecessary sync attempts
      if (retryCount === 0) {
        console.log('🔗 Testing connection before sync...');
        try {
          const testResponse = await fetch(`/api/pipelines/${pipelineId}/test_connection/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(localStorage.getItem('accessToken') && { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }),
            },
            body: JSON.stringify({}),
          });
          
          if (!testResponse.ok) {
            throw new Error('Connection test failed');
          }
          
          const testData = await testResponse.json();
          if (!testData.success) {
            throw new Error(testData.message || 'Connection test failed');
          }
          
          console.log('✅ Connection test successful, proceeding with sync...');
        } catch (testError) {
          console.warn('⚠️ Connection test failed, but proceeding with sync attempt...', testError);
        }
      }
      
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/pipelines/${pipelineId}/sync_now/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({}),
      });
      
      console.log('Sync response status:', response.status); // Debug log
      console.log('Sync response headers:', Object.fromEntries(response.headers.entries())); // Debug log
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      // Get the raw response text first for debugging
      const responseText = await response.text();
      console.log('Raw response text:', responseText); // Debug log
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }
      console.log('Sync response data:', data); // Debug log
      console.log('Response data type:', typeof data); // Debug log
      console.log('Response data keys:', Object.keys(data || {})); // Debug log
      
      if (data && data.success === true) {
        const jobId = data.job_id;
        const ordersProcessed = data.orders_processed;
        
        if (ordersProcessed !== undefined) {
          // Sync completed immediately
          alert(`✅ Sync completed successfully! ${ordersProcessed} orders processed. Job ID: ${jobId}`);
        } else {
          // Sync job created (asynchronous)
          alert(`🔄 Sync started for pipeline. Job ID: ${jobId || 'No ID returned'}`);
        }
      } else {
        console.error('Sync response validation failed:', {
          data,
          hasData: !!data,
          successValue: data?.success,
          successType: typeof data?.success
        });
        
        // Check if this is a connection error that might be retryable
        const isConnectionError = data?.message?.includes('Connection refused') || 
                                data?.message?.includes('Connection error') ||
                                data?.message?.includes('Connection timeout');
        
        if (isConnectionError && retryCount < 2) {
          console.log(`🔄 Connection error detected, retrying... (attempt ${retryCount + 1}/3)`);
          setTimeout(() => {
            triggerSync(pipelineId, retryCount + 1);
          }, 2000); // Wait 2 seconds before retry
          return;
        }
        
        if (data?.message?.includes('Connection refused')) {
          alert(`❌ Connection to WooCommerce failed. This might be a temporary network issue. Please try again in a few moments.`);
        } else {
          alert(`❌ Sync failed: ${data?.message || 'Unknown error'}`);
        }
      }
    } catch (err: any) {
      console.error('Sync error:', err); // Debug log
      
      // Check if this is a connection error that might be retryable
      const isConnectionError = err.message?.includes('Connection refused') || 
                              err.message?.includes('Connection error') ||
                              err.message?.includes('Connection timeout');
      
      if (isConnectionError && retryCount < 2) {
        console.log(`🔄 Connection error detected, retrying... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          triggerSync(pipelineId, retryCount + 1);
        }, 2000); // Wait 2 seconds before retry
        return;
      }
      
      alert(`❌ Failed to start sync: ${err.message || 'Unknown error'}`);
    } finally {
      setSyncing(null);
    }
  };

  const deletePipeline = async (pipelineId: number) => {
    if (!confirm('Are you sure you want to delete this pipeline? This action cannot be undone.')) {
      return;
    }

    try {
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/pipelines/${pipelineId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      fetchPipelines(); // Refresh the list
    } catch (err) {
      alert('Failed to delete pipeline');
    }
  };

  const openEdit = (p: DataPipeline) => {
    setPipelineToEdit(p);
    setEditOpen(true);
  };

  const getPipelineTypeIcon = (pipelineType: string) => {
    const icons: Record<string, string> = {
      'woocommerce': '🛒',
      'google_ads': '📊',
      'google_analytics': '📈',
      'google_search_console': '🔍',
      'facebook_ads': '📱',
      'linkedin_ads': '💼',
      'tiktok_ads': '🎵',
      'shopify': '🛍️',
    };
    return icons[pipelineType] || '⚙️';
  };

  const getScheduleIcon = (schedule: string) => {
    const icons: Record<string, any> = {
      'manual': WrenchScrewdriverIcon,
      'hourly': ClockIcon,
      'daily': CalendarIcon,
      'weekly': CalendarIcon,
      'monthly': CalendarIcon,
    };
    return icons[schedule] || WrenchScrewdriverIcon;
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pipelines...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <ServerIcon className="h-8 w-8 text-gray-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Pipelines</p>
              <p className="text-2xl font-bold text-gray-900">{pipelines.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enabled</p>
              <p className="text-2xl font-bold text-gray-900">
                {pipelines.filter(p => p.enabled).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Disabled</p>
              <p className="text-2xl font-bold text-gray-900">
                {pipelines.filter(p => !p.enabled).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <PlayIcon className="h-8 w-8 text-blue-400" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pipelines List */}
      {pipelines.length === 0 ? (
        <div className="text-center py-12">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pipelines found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first data pipeline.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {pipelines.map((pipeline) => (
              <li key={pipeline.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">{getPipelineTypeIcon(pipeline.pipeline_type)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium text-gray-900">{pipeline.name}</h3>
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pipeline.enabled)}`}>
                          {pipeline.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <p>{pipeline.account.name} - {pipeline.account.company.name}</p>
                        <p>{pipeline.account_configuration.name} ({pipeline.pipeline_type_display})</p>
                        <div className="flex items-center mt-1">
                          {React.createElement(getScheduleIcon(pipeline.schedule), { className: "h-4 w-4 mr-1" })}
                          <span>{pipeline.schedule_display}</span>
                          {pipeline.next_run && (
                            <span className="ml-2 text-xs text-gray-400">
                              Next: {new Date(pipeline.next_run).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => testConnection(pipeline.id)}
                      disabled={testingConnection === pipeline.id}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {testingConnection === pipeline.id ? 'Testing...' : 'Test'}
                    </button>
                    
                    <button
                      onClick={() => triggerSync(pipeline.id)}
                      disabled={syncing === pipeline.id}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {syncing === pipeline.id ? 'Syncing...' : 'Sync'}
                    </button>
                    
                    <button
                      onClick={() => togglePipelineStatus(pipeline.id, pipeline.enabled)}
                      className={`inline-flex items-center px-3 py-1 border text-sm leading-4 font-medium rounded-md ${
                        pipeline.enabled
                          ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                          : 'border-green-300 text-green-700 bg-white hover:bg-green-50'
                      }`}
                    >
                      {pipeline.enabled ? 'Disable' : 'Enable'}
                    </button>
                    
                    <button
                      onClick={() => deletePipeline(pipeline.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(pipeline)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {editOpen && pipelineToEdit && (
        <EditPipelineModal isOpen={editOpen} onClose={() => setEditOpen(false)} pipeline={pipelineToEdit} />
      )}
    </div>
  );
} 