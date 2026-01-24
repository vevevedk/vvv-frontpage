import React, { useState, useEffect } from 'react';
import { 
  ServerIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  EyeSlashIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../lib/auth/AuthContext';
import { api } from '../../lib/api';
import { useToast } from '../ui/Toast';

interface Account {
  id: number;
  name: string;
  description?: string;
  company: {
    id: number;
    name: string;
  };
  is_active: boolean;
  configurations: AccountConfiguration[];
  created_at: string;
  updated_at: string;
}

interface AccountConfiguration {
  id: number;
  config_type: string;
  name: string;
  config_data: Record<string, any>;
  is_active: boolean;
  account: number;
}

interface Company {
  id: number;
  name: string;
}

const CONFIG_TYPES = [
  { value: 'woocommerce', label: 'WooCommerce', icon: '🛒' },
  { value: 'google_ads', label: 'Google Ads', icon: '📊' },
  { value: 'google_analytics', label: 'Google Analytics', icon: '📈' },
  { value: 'google_search_console', label: 'Google Search Console', icon: '🔍' },
  { value: 'facebook_ads', label: 'Facebook Ads', icon: '📱' },
  { value: 'linkedin_ads', label: 'LinkedIn Ads', icon: '💼' },
  { value: 'tiktok_ads', label: 'TikTok Ads', icon: '🎵' },
  { value: 'shopify', label: 'Shopify', icon: '🛍️' },
  { value: 'other', label: 'Other', icon: '⚙️' },
];

const CONFIG_FIELDS = {
  woocommerce: [
    { key: 'store_url', label: 'Store URL', type: 'url', required: true, default: '' },
    { key: 'consumer_key', label: 'Consumer Key', type: 'password', required: true, default: '' },
    { key: 'consumer_secret', label: 'Consumer Secret', type: 'password', required: true, default: '' },
    { key: 'timezone', label: 'Timezone', type: 'text', required: false, default: 'UTC' },
  ],
  google_ads: [
    { key: 'customer_id', label: 'Customer ID', type: 'text', required: true, default: '' },
    { key: 'developer_token', label: 'Developer Token', type: 'password', required: true, default: '' },
    { key: 'client_id', label: 'Client ID', type: 'text', required: true, default: '' },
    { key: 'client_secret', label: 'Client Secret', type: 'password', required: true, default: '' },
    { key: 'refresh_token', label: 'Refresh Token', type: 'password', required: true, default: '' },
  ],
  google_analytics: [
    { key: 'property_id', label: 'Property ID', type: 'text', required: true, default: '' },
    { key: 'view_id', label: 'View ID', type: 'text', required: true, default: '' },
    { key: 'client_id', label: 'Client ID', type: 'text', required: true, default: '' },
    { key: 'client_secret', label: 'Client Secret', type: 'password', required: true, default: '' },
    { key: 'refresh_token', label: 'Refresh Token', type: 'password', required: true, default: '' },
  ],
  google_search_console: [
    { key: 'site_url', label: 'Site URL', type: 'url', required: true, default: '' },
    { key: 'client_id', label: 'Client ID', type: 'text', required: true, default: '' },
    { key: 'client_secret', label: 'Client Secret', type: 'password', required: true, default: '' },
    { key: 'refresh_token', label: 'Refresh Token', type: 'password', required: true, default: '' },
  ],
};

export default function AccountManagement() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showCreateConfigModal, setShowCreateConfigModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingConfig, setEditingConfig] = useState<AccountConfiguration | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  
  const [accountForm, setAccountForm] = useState({
    name: '',
    description: '',
    company_id: '',
    is_active: true,
  });

  const [configForm, setConfigForm] = useState({
    config_type: '',
    name: '',
    account_id: '',
    is_active: true,
    config_data: {} as Record<string, any>,
  });

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAccounts();
    fetchCompanies();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts/');
      const data = response.data;
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies/');
      setCompanies(response.data as Company[]);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/accounts/', accountForm);
      setShowCreateAccountModal(false);
      setAccountForm({
        name: '',
        description: '',
        company_id: '',
        is_active: true,
      });
      showSuccess('Account Created', `Account "${accountForm.name}" created successfully!`);
      fetchAccounts();
    } catch (err) {
      const errorMessage = 'Failed to create account';
      showError('Create Failed', errorMessage);
      setError(errorMessage);
    }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    
    try {
      await api.patch(`/accounts/${editingAccount.id}/`, accountForm);
      setEditingAccount(null);
      setAccountForm({
        name: '',
        description: '',
        company_id: '',
        is_active: true,
      });
      showSuccess('Account Updated', 'Account updated successfully!');
      fetchAccounts();
    } catch (err) {
      const errorMessage = 'Failed to update account';
      showError('Update Failed', errorMessage);
      setError(errorMessage);
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    
    try {
      await api.delete(`/accounts/${accountId}/`);
      showSuccess('Account Deleted', 'Account deleted successfully!');
      fetchAccounts();
    } catch (err) {
      const errorMessage = 'Failed to delete account';
      showError('Delete Failed', errorMessage);
      setError(errorMessage);
    }
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/account-configurations/', configForm);
      setShowCreateConfigModal(false);
      setConfigForm({
        config_type: '',
        name: '',
        account_id: '',
        is_active: true,
        config_data: {},
      });
      showSuccess('Configuration Created', 'Configuration created successfully!');
      fetchAccounts();
    } catch (err) {
      const errorMessage = 'Failed to create configuration';
      showError('Create Failed', errorMessage);
      setError(errorMessage);
    }
  };

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;
    
    try {
      setError(null); // Clear any previous errors
      const response = await api.put(`/account-configurations/${editingConfig.id}/`, configForm);
      setEditingConfig(null);
      setConfigForm({
        config_type: '',
        name: '',
        account_id: '',
        is_active: true,
        config_data: {},
      });
      showSuccess('Configuration Updated', 'Configuration updated successfully!');
      fetchAccounts();
    } catch (err: any) {
      console.error('Update config error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.detail || err.message || 'Failed to update configuration';
      showError('Update Failed', errorMessage);
      setError(errorMessage);
    }
  };

  const handleDeleteConfig = async (configId: number) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      await api.delete(`/account-configurations/${configId}/`);
      showSuccess('Configuration Deleted', 'Configuration deleted successfully!');
      fetchAccounts();
    } catch (err) {
      const errorMessage = 'Failed to delete configuration';
      showError('Delete Failed', errorMessage);
      setError(errorMessage);
    }
  };

  const handleTestConnection = async (configId: number) => {
    try {
      const response = await api.post(`/account-configurations/${configId}/test_connection/`, {});
      alert((response.data as { message: string }).message);
    } catch (err) {
      alert('Connection test failed');
    }
  };

  const openCreateAccountModal = () => {
    setAccountForm({
      name: '',
      description: '',
      company_id: '',
      is_active: true,
    });
    setShowCreateAccountModal(true);
  };

  const openEditAccountModal = (account: Account) => {
    setEditingAccount(account);
    setAccountForm({
      name: account.name,
      description: account.description || '',
      company_id: account.company.id.toString(),
      is_active: account.is_active,
    });
  };

  const openCreateConfigModal = (account: Account) => {
    setSelectedAccount(account);
    setConfigForm({
      config_type: '',
      name: '',
      account_id: account.id.toString(),
      is_active: true,
      config_data: {},
    });
    setShowCreateConfigModal(true);
  };

  const openEditConfigModal = (config: AccountConfiguration) => {
    setEditingConfig(config);
    setConfigForm({
      config_type: config.config_type,
      name: config.name,
      account_id: config.account.toString(),
      is_active: config.is_active,
      config_data: config.config_data,
    });
  };

  const closeAccountModal = () => {
    setShowCreateAccountModal(false);
    setEditingAccount(null);
    setAccountForm({
      name: '',
      description: '',
      company_id: '',
      is_active: true,
    });
  };

  const closeConfigModal = () => {
    setShowCreateConfigModal(false);
    setEditingConfig(null);
    setSelectedAccount(null);
    setConfigForm({
      config_type: '',
      name: '',
      account_id: '',
      is_active: true,
      config_data: {},
    });
  };

  const updateConfigData = (key: string, value: string) => {
    // Auto-prepend https:// to URLs if they don't have a protocol
    let processedValue = value;
    if (key === 'store_url' || key === 'site_url') {
      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        processedValue = `https://${value}`;
      }
    }
    
    setConfigForm(prev => ({
      ...prev,
      config_data: {
        ...prev.config_data,
        [key]: processedValue,
      },
    }));
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getConfigTypeIcon = (type: string) => {
    const configType = CONFIG_TYPES.find(t => t.value === type);
    return configType?.icon || '⚙️';
  };

  const getConfigTypeLabel = (type: string) => {
    const configType = CONFIG_TYPES.find(t => t.value === type);
    return configType?.label || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Management</h2>
          <p className="text-gray-600">Manage business accounts and their platform configurations</p>
        </div>
        <button
          onClick={openCreateAccountModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Account
        </button>
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

      {/* Accounts List */}
      {!accounts || accounts.length === 0 ? (
        <div className="text-center py-12">
          <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first account.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white shadow-sm rounded-lg border border-gray-200">
              {/* Account Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500">{account.company.name}</p>
                    {account.description && (
                      <p className="text-sm text-gray-600 mt-1">{account.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {account.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        Inactive
                      </span>
                    )}
                    <button
                      onClick={() => openEditAccountModal(account)}
                      className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-primary hover:bg-primary/10 transition-colors duration-150"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-red-600 hover:bg-red-100 transition-colors duration-150"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Configurations */}
              <div className="px-6 py-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-md font-medium text-gray-900">Platform Configurations</h4>
                  <button
                    onClick={() => openCreateConfigModal(account)}
                    className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors duration-150"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Configuration
                  </button>
                </div>

                {account.configurations.length === 0 ? (
                  <div className="text-center py-6">
                    <CogIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500 mt-2">No configurations yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {account.configurations.map((config) => (
                      <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <span className="text-2xl mr-2">{getConfigTypeIcon(config.config_type)}</span>
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">{config.name}</h5>
                              <p className="text-xs text-gray-500">{getConfigTypeLabel(config.config_type)}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {config.is_active ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                          <button
                            onClick={() => handleTestConnection(config.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent rounded text-xs text-blue-600 hover:bg-blue-100 transition-colors duration-150"
                          >
                            <WrenchScrewdriverIcon className="h-3 w-3 mr-1" />
                            Test
                          </button>
                          <button
                            onClick={() => openEditConfigModal(config)}
                            className="inline-flex items-center px-2 py-1 border border-transparent rounded text-xs text-primary hover:bg-primary/10 transition-colors duration-150"
                          >
                            <PencilIcon className="h-3 w-3 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteConfig(config.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent rounded text-xs text-red-600 hover:bg-red-100 transition-colors duration-150"
                          >
                            <TrashIcon className="h-3 w-3 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Account Modal */}
      {(showCreateAccountModal || editingAccount) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={closeAccountModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h2>
            
            <form onSubmit={editingAccount ? handleUpdateAccount : handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                  value={accountForm.description}
                  onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <select
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                  value={accountForm.company_id}
                  onChange={(e) => setAccountForm({ ...accountForm, company_id: e.target.value })}
                  required
                >
                  <option value="">Select a company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={accountForm.is_active}
                  onChange={(e) => setAccountForm({ ...accountForm, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active Account
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeAccountModal}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors duration-150"
                >
                  {editingAccount ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create/Edit Configuration Modal */}
      {(showCreateConfigModal || editingConfig) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={closeConfigModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <XCircleIcon className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-gray-900">
              {editingConfig ? 'Edit Configuration' : 'Add New Configuration'}
            </h2>
            
            <form onSubmit={editingConfig ? handleUpdateConfig : handleCreateConfig} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Configuration Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                    value={configForm.name}
                    onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Platform Type</label>
                  <select
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                    value={configForm.config_type}
                    onChange={(e) => setConfigForm({ ...configForm, config_type: e.target.value, config_data: {} })}
                    required
                  >
                    <option value="">Select platform type</option>
                    {CONFIG_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="config_is_active"
                  type="checkbox"
                  checked={configForm.is_active}
                  onChange={(e) => setConfigForm({ ...configForm, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary border-gray-300 rounded"
                />
                <label htmlFor="config_is_active" className="ml-2 block text-sm text-gray-700">
                  Active Configuration
                </label>
              </div>

              {/* Configuration Fields */}
              {configForm.config_type && CONFIG_FIELDS[configForm.config_type as keyof typeof CONFIG_FIELDS] && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration</h3>
                  <div className="space-y-4">
                    {CONFIG_FIELDS[configForm.config_type as keyof typeof CONFIG_FIELDS].map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {(field.key === 'store_url' || field.key === 'site_url') && (
                          <p className="text-xs text-gray-500 mt-1">
                            You can enter just the domain (e.g., "porsa.dk") - HTTPS will be added automatically
                          </p>
                        )}
                        <div className="mt-1 relative">
                          <input
                            type={field.type === 'password' && showPasswords[field.key] ? 'text' : field.type}
                            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2 pr-10"
                            value={configForm.config_data[field.key] || field.default || ''}
                            onChange={(e) => updateConfigData(field.key, e.target.value)}
                            required={field.required}
                          />
                          {field.type === 'password' && (
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(field.key)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPasswords[field.key] ? (
                                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                              ) : (
                                <EyeIcon className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeConfigModal}
                  className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors duration-150"
                >
                  {editingConfig ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 