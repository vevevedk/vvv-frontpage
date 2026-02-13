import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  CogIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../lib/auth/AuthContext';


interface WooCommerceClient {
  id: number;
  name: string;
  slug: string;
  base_url: string;
  timezone: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export default function ClientManagement() {
  const { user } = useAuth();
  const [clients, setClients] = useState<WooCommerceClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<number | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/woocommerce/configs/', {
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClients(data || []);
    } catch (err) {
      setError('Failed to fetch clients');
      console.error('Error fetching clients:', err);
      setClients([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const toggleClientStatus = async (clientId: number, enabled: boolean) => {
    try {
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/woocommerce/configs/${clientId}`, {
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
      fetchClients(); // Refresh the list
    } catch (err) {
      console.error('Error toggling client status:', err);
    }
  };

  const testConnection = async (clientId: number) => {
    try {
      setTestingConnection(clientId);
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/woocommerce/configs/${clientId}/test_connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.success) {
        alert(`✅ Connection successful! Found ${data.orders_found} orders.`);
      } else {
        alert(`❌ Connection failed: ${data?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Connection test error:', err);
      const errorMessage = err.message || 'Connection test failed';
      alert(`❌ ${errorMessage}`);
    } finally {
      setTestingConnection(null);
    }
  };

  const triggerSync = async (clientId: number) => {
    try {
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      console.log('Access token found:', !!accessToken, 'Token length:', accessToken?.length);
      
      const response = await fetch(`/api/woocommerce/configs/${clientId}/sync_now`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          job_type: 'manual_sync'
        }),
      });
      
      console.log('Sync response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.success) {
        alert(`🔄 Sync started for client. Task ID: ${data.task_id}`);
      } else {
        alert(`❌ Sync failed: ${data?.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Sync error:', err);
      const errorMessage = err.message || 'Failed to start sync';
      alert(`❌ ${errorMessage}`);
    }
  };

  const deleteClient = async (clientId: number) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      // Get the access token from localStorage
      const accessToken = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/woocommerce/configs/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      fetchClients(); // Refresh the list
    } catch (err) {
      alert('❌ Failed to delete client. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={fetchClients}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Clients</dt>
                  <dd className="text-lg font-medium text-gray-900">{clients?.length || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Clients</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients?.filter(c => c.enabled).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PauseIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Inactive Clients</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {clients?.filter(c => !c.enabled).length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CogIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Last Updated</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {clients && clients.length > 0 
                      ? new Date(Math.max(...clients.map(c => new Date(c.updated_at).getTime()))).toLocaleDateString()
                      : 'Never'
                    }
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">WooCommerce Clients</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your connected WooCommerce stores
          </p>
        </div>
        
        {!clients || clients.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first WooCommerce client.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {clients?.map((client) => (
              <li key={client.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`h-3 w-3 rounded-full ${client.enabled ? 'bg-green-400' : 'bg-gray-400'}`} />
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">{client.name}</p>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {client.slug}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <span>{client.base_url}</span>
                        <span className="mx-2">•</span>
                        <span>{client.timezone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => testConnection(client.id)}
                      disabled={testingConnection === client.id}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {testingConnection === client.id ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600 mr-1" />
                      ) : (
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                      )}
                      Test
                    </button>
                    
                    <button
                      onClick={() => triggerSync(client.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <PlayIcon className="h-3 w-3 mr-1" />
                      Sync
                    </button>
                    
                    <button
                      onClick={() => toggleClientStatus(client.id, client.enabled)}
                      className={`inline-flex items-center px-3 py-1 border text-xs font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        client.enabled
                          ? 'border-yellow-300 text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                          : 'border-green-300 text-green-700 bg-green-100 hover:bg-green-200'
                      }`}
                    >
                      {client.enabled ? (
                        <>
                          <PauseIcon className="h-3 w-3 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-3 w-3 mr-1" />
                          Enable
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => deleteClient(client.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-3 w-3 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Import the missing icon
import { ShoppingCartIcon } from '@heroicons/react/24/outline'; 