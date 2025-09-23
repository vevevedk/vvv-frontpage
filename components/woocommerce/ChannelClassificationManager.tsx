import React, { useState, useEffect, useRef } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { api } from '../../lib/api';

interface ChannelClassification {
  id?: string;
  source: string;
  medium: string;
  source_medium: string;
  channel: string;
  channel_type: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface DiscoveredTrafficSource {
  source: string;
  medium: string;
  source_medium: string;
  order_count: number;
  total_revenue: number;
  clients: string[];
  examples: Array<{
    order_id: string;
    client: string;
    total: string;
    date: string | null;
  }>;
}

interface ChannelClassificationManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onClassificationsUpdated: () => void;
}

const DEFAULT_CHANNEL_TYPES = [
  'Direct',
  'SEO',
  'Organic Social',
  'Email',
  'Referal',
  'ChatGpt',
  'Paid Social',
  'Paid Search',
  'Organic Search',
  'Test'
];

export default function ChannelClassificationManager({ 
  isOpen, 
  onClose, 
  onClassificationsUpdated 
}: ChannelClassificationManagerProps) {
  const [classifications, setClassifications] = useState<ChannelClassification[]>([]);
  const [discoveredSources, setDiscoveredSources] = useState<DiscoveredTrafficSource[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'discovery'>('discovery');
  const [loading, setLoading] = useState(true);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ChannelClassification>({
    source: '',
    medium: '',
    source_medium: '',
    channel: '',
    channel_type: '',
    is_active: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannelType, setFilterChannelType] = useState<string>('all');
  // Track inline channel type selections for quick classify per discovered row
  const [inlineTypes, setInlineTypes] = useState<Record<string, string>>({});
  // Horizontal scroll sync (top scrollbar <-> table) for Discovery and Rules
  const discoveryTopScrollRef = useRef<HTMLDivElement | null>(null);
  const discoveryBottomScrollRef = useRef<HTMLDivElement | null>(null);
  const discoveryInnerWidthRef = useRef<HTMLDivElement | null>(null);
  const rulesTopScrollRef = useRef<HTMLDivElement | null>(null);
  const rulesBottomScrollRef = useRef<HTMLDivElement | null>(null);
  const rulesInnerWidthRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchClassifications();
      fetchDiscoveredTrafficSources();
    }
  }, [isOpen]);

  // Sync handlers
  useEffect(() => {
    const pair = (
      top: HTMLDivElement | null,
      bottom: HTMLDivElement | null
    ) => {
      if (!top || !bottom) return () => {};
      let syncing = false;
      const onTop = () => {
        if (syncing) return; syncing = true; bottom.scrollLeft = top.scrollLeft; syncing = false;
      };
      const onBottom = () => {
        if (syncing) return; syncing = true; top.scrollLeft = bottom.scrollLeft; syncing = false;
      };
      top.addEventListener('scroll', onTop);
      bottom.addEventListener('scroll', onBottom);
      return () => {
        top.removeEventListener('scroll', onTop);
        bottom.removeEventListener('scroll', onBottom);
      };
    };

    const cleanup1 = pair(discoveryTopScrollRef.current, discoveryBottomScrollRef.current);
    const cleanup2 = pair(rulesTopScrollRef.current, rulesBottomScrollRef.current);
    return () => { cleanup1 && cleanup1(); cleanup2 && cleanup2(); };
  }, [discoveredSources, filteredClassifications.length]);

  const fetchClassifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/woocommerce/channels/classifications/');
      if (response.data && Array.isArray(response.data)) {
        setClassifications(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch classifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscoveredTrafficSources = async (onlyUnclassified: boolean = true) => {
    try {
      setDiscoveryLoading(true);
      const response = await api.get(`/woocommerce/orders/traffic_sources_discovery/?only_unclassified=${onlyUnclassified}`);
      const data = response.data as any;
      if (data?.traffic_sources) {
        setDiscoveredSources(data.traffic_sources);
      }
    } catch (err) {
      console.error('Failed to fetch discovered traffic sources:', err);
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (editingId) {
        // Update existing
        await api.put(`/woocommerce/channels/classifications/${editingId}/`, formData);
      } else {
        // Create new
        await api.post('/woocommerce/channels/classifications/', formData);
      }
      
      // Reset form and refresh
      setFormData({
        source: '',
        medium: '',
        source_medium: '',
        channel: '',
        channel_type: '',
        is_active: true
      });
      setEditingId(null);
      await fetchClassifications();
      onClassificationsUpdated();
    } catch (err) {
      console.error('Failed to save classification:', err);
    } finally {
      setSaving(false);
    }
  };

  const quickCreateFromDiscovery = (discoveredSource: DiscoveredTrafficSource) => {
    setFormData({
      source: discoveredSource.source,
      medium: discoveredSource.medium,
      source_medium: discoveredSource.source_medium,
      channel: `${discoveredSource.source} / ${discoveredSource.medium}`,
      channel_type: '',
      is_active: true
    });
    setActiveTab('rules');
  };

  const classifyInline = async (discoveredSource: DiscoveredTrafficSource) => {
    const key = discoveredSource.source_medium;
    const selected = inlineTypes[key];
    if (!selected) return;
    try {
      await api.post('/woocommerce/channels/classifications/', {
        source: discoveredSource.source,
        medium: discoveredSource.medium,
        source_medium: discoveredSource.source_medium,
        channel: `${discoveredSource.source} / ${discoveredSource.medium}`,
        channel_type: selected,
        is_active: true,
      });
      // Refresh lists
      await fetchClassifications();
      await fetchDiscoveredTrafficSources();
      // Clear selection
      setInlineTypes(prev => ({ ...prev, [key]: '' }));
      onClassificationsUpdated();
    } catch (err) {
      console.error('Inline classification failed:', err);
    }
  };

  // Filter classifications based on search and channel type
  const filteredClassifications = classifications.filter(classification => {
    const matchesSearch = searchTerm === '' || 
      classification.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classification.medium.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classification.channel_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChannelType = filterChannelType === 'all' || 
      classification.channel_type === filterChannelType;
    
    return matchesSearch && matchesChannelType;
  });

  const handleEdit = (classification: ChannelClassification) => {
    setFormData(classification);
    setEditingId(classification.id || null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classification?')) {
      return;
    }
    
    try {
      await api.delete(`/woocommerce/channels/classifications/${id}/`);
      fetchClassifications();
      onClassificationsUpdated();
    } catch (err) {
      console.error('Failed to delete classification:', err);
    }
  };

  const handleCancel = () => {
    setFormData({
      source: '',
      medium: '',
      source_medium: '',
      channel: '',
      channel_type: '',
      is_active: true
    });
    setEditingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Channel Classification Manager</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage rules for classifying traffic sources into marketing channels
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Form */}
          <div className="w-1/3 p-6 border-r border-gray-200 overflow-y-auto sticky top-0 self-start max-h-[calc(90vh-64px)]">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingId ? 'Edit Classification' : 'Add New Classification'}
            </h3>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source *
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., google, (direct), fb"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medium *
                </label>
                <input
                  type="text"
                  value={formData.medium}
                  onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., organic, utm, referral"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source Medium *
                </label>
                <input
                  type="text"
                  value={formData.source_medium}
                  onChange={(e) => setFormData({ ...formData, source_medium: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., google/organic, fb/utm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel *
                </label>
                <input
                  type="text"
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., google / organic, facebook / paid"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel Type *
                </label>
                <select
                  value={formData.channel_type}
                  onChange={(e) => setFormData({ ...formData, channel_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select channel type</option>
                  {DEFAULT_CHANNEL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-2" />
                      {editingId ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
                
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Panel - Tabs */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('discovery')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'discovery'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Traffic Source Discovery
                </button>
                <button
                  onClick={() => setActiveTab('rules')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'rules'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Classification Rules
                </button>
              </nav>
            </div>

            {/* Discovery Tab */}
            {activeTab === 'discovery' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Discovered Traffic Sources</h3>
                  <div className="flex items-center space-x-3">
                    <label className="inline-flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                        defaultChecked
                        onChange={(e) => fetchDiscoveredTrafficSources(e.target.checked)}
                      />
                      Only unclassified
                    </label>
                    <button
                      onClick={() => fetchDiscoveredTrafficSources(true)}
                      disabled={discoveryLoading}
                      className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100"
                    >
                      {discoveryLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                </div>

                {discoveryLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : discoveredSources.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No traffic sources discovered yet.</p>
                    <p className="text-sm text-gray-400 mt-1">Sync some WooCommerce data to see traffic sources.</p>
                  </div>
                ) : (
                  <div>
                    {/* Top horizontal scrollbar */}
                    <div ref={discoveryTopScrollRef} className="overflow-x-auto mb-2">
                      <div ref={discoveryInnerWidthRef} className="min-w-[900px]"></div>
                    </div>
                    <div ref={discoveryBottomScrollRef} className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                            Source/Medium
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Orders
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Revenue
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clients
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {discoveredSources.map((source, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {source.source_medium}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {source.source} / {source.medium}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {source.order_count.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${source.total_revenue.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {source.clients.join(', ')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-3">
                                <select
                                  value={inlineTypes[source.source_medium] || ''}
                                  onChange={(e) => setInlineTypes(prev => ({ ...prev, [source.source_medium]: e.target.value }))}
                                  className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                >
                                  <option value="">Select channel type</option>
                                  {DEFAULT_CHANNEL_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => classifyInline(source)}
                                  disabled={!inlineTypes[source.source_medium]}
                                  className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  Classify
                                </button>
                                <button
                                  onClick={() => quickCreateFromDiscovery(source)}
                                  className="text-indigo-600 hover:text-indigo-900 text-sm"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Rules Tab */}
            {activeTab === 'rules' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Classification Rules</h3>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Search classifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={filterChannelType}
                      onChange={(e) => setFilterChannelType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Channel Types</option>
                      {DEFAULT_CHANNEL_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div>
                    {/* Top horizontal scrollbar */}
                    <div ref={rulesTopScrollRef} className="overflow-x-auto mb-2">
                      <div ref={rulesInnerWidthRef} className="min-w-[900px]"></div>
                    </div>
                    <div ref={rulesBottomScrollRef} className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Medium
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Channel Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClassifications.map((classification) => (
                          <tr key={classification.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                              {classification.source}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {classification.medium}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {classification.channel_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                classification.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {classification.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEdit(classification)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => classification.id && handleDelete(classification.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                    
                    {filteredClassifications.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No classifications found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

