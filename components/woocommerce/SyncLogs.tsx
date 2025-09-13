import React, { useState, useEffect } from 'react';
import { 
  CogIcon, 
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../lib/auth/AuthContext';
import { api } from '../../lib/api';

interface SyncLog {
  id: number;
  client: number | null;
  client_name: string | null;
  job: number | null;
  level: string;
  level_display: string;
  message: string;
  details: any;
  created_at: string;
}

export default function SyncLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [selectedLevel, selectedClient]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = '/woocommerce/logs/';
      const params = new URLSearchParams();
      
      if (selectedLevel !== 'all') {
        params.append('level', selectedLevel);
      }
      if (selectedClient !== 'all') {
        params.append('client_id', selectedClient);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await api.get(url);
      setLogs(response.data as SyncLog[]);
    } catch (err) {
      setError('Failed to fetch sync logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'INFO':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
      case 'WARNING':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'ERROR':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'DEBUG':
        return <CogIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO':
        return 'bg-blue-100 text-blue-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      case 'DEBUG':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDetails = (details: any) => {
    if (!details || Object.keys(details).length === 0) {
      return null;
    }
    
    return (
      <details className="mt-2">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
          View Details
        </summary>
        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
          {JSON.stringify(details, null, 2)}
        </pre>
      </details>
    );
  };

  if (loading && logs.length === 0) {
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
          onClick={fetchLogs}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Sync Logs</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Monitor synchronization activities and troubleshoot issues
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="level-filter" className="block text-sm font-medium text-gray-700">
                Log Level
              </label>
              <select
                id="level-filter"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">All Levels</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
                <option value="DEBUG">Debug</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="client-filter" className="block text-sm font-medium text-gray-700">
                Client
              </label>
              <select
                id="client-filter"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="all">All Clients</option>
                {/* This would be populated with actual clients */}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchLogs}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <CogIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Logs will appear here once you start syncing your WooCommerce clients.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {logs.map((log) => (
              <li key={log.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getLevelIcon(log.level)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelColor(log.level)}`}>
                          {log.level_display}
                        </span>
                        {log.client_name && (
                          <span className="text-sm text-gray-500">
                            {log.client_name}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-900">{log.message}</p>
                      {formatDetails(log.details)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Log Level Legend */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Log Level Legend</h3>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <InformationCircleIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-700">Info - General information</span>
            </div>
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-gray-700">Warning - Potential issues</span>
            </div>
            <div className="flex items-center space-x-2">
              <XCircleIcon className="h-4 w-4 text-red-500" />
              <span className="text-sm text-gray-700">Error - Failed operations</span>
            </div>
            <div className="flex items-center space-x-2">
              <CogIcon className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Debug - Technical details</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 