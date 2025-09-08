import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SuccessMessage from '../components/SuccessMessage';
import AdminLayout from '../components/layouts/AdminLayout';
import { api } from '../lib/api';
import { CheckCircleIcon, PencilIcon, TrashIcon, PlusIcon, XCircleIcon, BuildingOfficeIcon, UsersIcon, UserGroupIcon, ServerIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import AccountManagement from '../components/accounts/AccountManagement';
import PipelineDashboard from '../components/pipelines/PipelineDashboard';

interface Agency {
  id: number;
  name: string;
  email?: string;
  website?: string;
  is_super_agency: boolean;
  created_at: string;
  updated_at: string;
}

interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency_code?: string;
  agency?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

// Company form interface to allow agency_id
interface CompanyForm extends Partial<Company> {
  agency_id?: number | string;
}

interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  phone?: string;
  email_verified?: boolean;
  company?: {
    id: number;
    name: string;
  };
  agency?: {
    id: number;
    name: string;
  };
  access_all_companies?: boolean;
  accessible_company_ids?: number[];
}

// Update User interface for form to allow company_id
interface UserForm extends Partial<User> {
  agency_id?: number | string;
  access_all_companies?: boolean;
  company_ids?: number[];
}

function Modal({ open, onClose, children, title }: { open: boolean, onClose: () => void, children: React.ReactNode, title: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XCircleIcon className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-bold mb-6 text-gray-900">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user: authUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('agencies');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Data states
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [agencyForm, setAgencyForm] = useState<Partial<Agency>>({});
  const [companyForm, setCompanyForm] = useState<CompanyForm>({});
  const [userForm, setUserForm] = useState<UserForm>({ access_all_companies: true });
  const [modalType, setModalType] = useState<null | 'agency' | 'company' | 'user'>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCompany, setInviteCompany] = useState('');

  // Set active tab based on URL query
  useEffect(() => {
    const tab = router.query.tab as string;
    if (tab && ['agencies', 'companies', 'users', 'accounts', 'pipelines'].includes(tab)) {
      setActiveTab(tab);
    } else {
      // Default to agencies if no tab parameter or invalid tab
      setActiveTab('agencies');
    }
  }, [router.query.tab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all data at once
      const [agenciesResponse, companiesResponse, usersResponse] = await Promise.all([
        api.get<Agency[]>('/agencies/'),
        api.get<Company[]>('/companies/'),
        api.get<User[]>('/users/')
      ]);

      if (agenciesResponse.data) {
        console.log('Loaded agencies:', agenciesResponse.data);
        setAgencies(agenciesResponse.data);
      }
      if (companiesResponse.data) {
        setCompanies(companiesResponse.data);
      }
      if (usersResponse.data) {
        setUsers(usersResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (data: any) => {
    try {
      let response;
      switch (activeTab) {
        case 'agencies':
          response = await api.post<Agency>('/agencies/', data);
          break;
        case 'companies':
          response = await api.post<Company>('/companies/', data);
          break;
        case 'users':
          response = await api.post<User>('/users/', data);
          break;
      }
      
      if (response?.data) {
        setSuccess(`${activeTab.slice(0, -1)} created successfully!`);
        setShowCreateForm(false);
        fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    }
  };

  const handleUpdate = async (id: number, data: any) => {
    try {
      let response;
      switch (activeTab) {
        case 'agencies':
          response = await api.put<Agency>(`/agencies/${id}/`, data);
          break;
        case 'companies':
          response = await api.put<Company>(`/companies/${id}/`, data);
          break;
        case 'users':
          response = await api.put<User>(`/users/${id}/`, data);
          break;
      }
      
      if (response?.data) {
        setSuccess(`${activeTab.slice(0, -1)} updated successfully!`);
        setEditingItem(null);
        fetchData();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) {
      return;
    }

    try {
      let response;
      switch (activeTab) {
        case 'agencies':
          response = await api.delete(`/agencies/${id}/`);
          break;
        case 'companies':
          response = await api.delete(`/companies/${id}/`);
          break;
        case 'users':
          response = await api.delete(`/users/${id}/`);
          break;
      }
      
      // For delete operations, success means no error was returned
      if (!response?.error) {
        setSuccess(`${activeTab.slice(0, -1)} deleted successfully!`);
        // Refresh the data to show updated list
        await fetchData();
      } else {
        setError(response.error.message || 'Failed to delete item');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setAgencyForm({});
    setModalType('agency');
  };
  const openEditModal = (agency: Agency) => {
    setAgencyForm(agency);
    setEditingItem(agency);
    setModalType('agency');
  };
  const closeModal = () => {
    setModalType(null);
    setShowCreateForm(false);
    setEditingItem(null);
    setAgencyForm({});
    setCompanyForm({});
    setUserForm({});
  };

  // Agency form submit
  const handleAgencySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      await handleUpdate(editingItem.id, agencyForm);
    } else {
      await handleCreate(agencyForm);
    }
    closeModal();
  };

  // Modal handlers for company
  const openCreateCompanyModal = () => {
    setCompanyForm({});
    setModalType('company');
  };
  const openEditCompanyModal = (company: Company) => {
    setCompanyForm({
      ...company,
      agency_id: company.agency?.id || ''
    });
    setEditingItem({ type: 'company', item: company });
    setModalType('company');
  };

  // Company form submit
  const handleCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSend = { ...companyForm };
    if (companyForm.agency_id) {
      dataToSend.agency_id = Number(companyForm.agency_id);
    } else {
      delete dataToSend.agency_id;
    }
    delete dataToSend.agency; // Remove the nested agency object
    
    if (editingItem && editingItem.type === 'company') {
      await handleUpdate(editingItem.item.id, dataToSend);
    } else {
      await handleCreate(dataToSend);
    }
    closeModal();
  };

  // Modal handlers for user
  const openCreateUserModal = () => {
    setUserForm({ agency_id: '', access_all_companies: true, company_ids: [] });
    setModalType('user');
  };
  const openEditUserModal = (user: User) => {
    console.log('Editing user:', user);
    console.log('User agency:', user.agency);
    console.log('User agency id:', user.agency?.id);
    
    const agencyId = user.agency?.id ? String(user.agency.id) : '';
    console.log('Setting agency_id to:', agencyId);
    
    setUserForm({
      ...user,
      agency_id: agencyId,
      access_all_companies: user.access_all_companies !== undefined ? user.access_all_companies : true,
      company_ids: user.accessible_company_ids || [],
    });
    
    setEditingItem({ type: 'user', item: user });
    setModalType('user');
  };

  // Filter companies by selected agency
  const filteredCompanies = companies.filter(c => c.agency?.id === Number(userForm.agency_id));

  // User form submit
  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting user form with data:', userForm);
    console.log('Agency ID being sent:', userForm.agency_id);
    
    const dataToSend = { ...userForm };
    if (userForm.agency_id) {
      dataToSend.agency_id = Number(userForm.agency_id);
    } else {
      delete dataToSend.agency_id;
    }
    if (userForm.access_all_companies) {
      dataToSend.access_all_companies = true;
      delete dataToSend.company_ids;
    } else {
      dataToSend.access_all_companies = false;
      dataToSend.company_ids = userForm.company_ids || [];
    }
    delete dataToSend.agency;
    delete dataToSend.company;
    
    console.log('Final data being sent to API:', dataToSend);
    
    if (editingItem && editingItem.type === 'user') {
      await handleUpdate(editingItem.item.id, dataToSend);
    } else {
      await handleCreate(dataToSend);
    }
    closeModal();
  };

  if (authUser?.role !== 'super_admin') {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="bg-white rounded-custom shadow-lg p-8 max-w-md">
              <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-text mb-4">Access Denied</h1>
              <p className="text-gray-600">You don't have permission to access this page.</p>
              <p className="text-sm text-gray-500 mt-2">Required role: super_admin</p>
              <p className="text-sm text-gray-500">Your role: {authUser?.role || 'none'}</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="p-6">
          {/* Invite Client Modal */}
          {inviteOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
                <button onClick={() => setInviteOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <XCircleIcon className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-bold mb-6 text-gray-900">Invite Client User</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const resp = await fetch('/api/auth/invite-client', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: inviteEmail, companyName: inviteCompany })
                      });
                      if (!resp.ok) throw new Error('Failed to send invite');
                      setSuccess('Invitation sent');
                      setInviteOpen(false);
                      setInviteEmail('');
                      setInviteCompany('');
                    } catch (err: any) {
                      setError(err.message || 'Failed to send invite');
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Client Email</label>
                    <input
                      type="email"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company (optional)</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={inviteCompany}
                      onChange={(e) => setInviteCompany(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button type="button" onClick={() => setInviteOpen(false)} className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
                      Cancel
                    </button>
                    <button type="submit" className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark">
                      Send Invite
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <ErrorMessage error={error} onRetry={fetchData} className="mb-6" />
          <SuccessMessage message={success || ''} onDismiss={() => setSuccess(null)} className="mb-6" />

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Loading data...</p>
              </div>
            </div>
          ) : (
            <div>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white rounded-custom shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BuildingOfficeIcon className="h-8 w-8 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Agencies</p>
                      <p className="text-2xl font-bold text-text">{agencies.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-custom shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BuildingOfficeIcon className="h-8 w-8 text-secondary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Companies</p>
                      <p className="text-2xl font-bold text-text">{companies.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-custom shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UsersIcon className="h-8 w-8 text-primary-dark" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Users</p>
                      <p className="text-2xl font-bold text-text">{users.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-custom shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ServerIcon className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Accounts</p>
                      <p className="text-2xl font-bold text-text">-</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content based on active tab */}
              {activeTab === 'agencies' && (
                <div className="bg-white shadow-sm rounded-custom border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-text">Agencies</h3>
                      <button
                        onClick={openCreateModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" /> Create Agency
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {agencies.map((agency) => (
                          <tr key={agency.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-text">{agency.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{agency.email || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {agency.website ? (
                                  <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-dark">
                                    {agency.website}
                                  </a>
                                ) : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {agency.is_super_agency ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" /> Super Agency
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Client Agency
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => openEditModal(agency)}
                                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-primary hover:bg-primary/10 transition-colors duration-150"
                              >
                                <PencilIcon className="h-4 w-4 mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(agency.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-red-600 hover:bg-red-100 transition-colors duration-150"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Companies Tab */}
              {activeTab === 'companies' && (
                <div className="bg-white shadow-sm rounded-custom border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-text">Companies</h3>
                      <button
                        onClick={openCreateCompanyModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" /> Create Company
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agency</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {companies.map((company) => (
                          <tr key={company.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-text">{company.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{company.email || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{company.phone || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{company.currency_code || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{company.agency?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => openEditCompanyModal(company)}
                                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-primary hover:bg-primary/10 transition-colors duration-150"
                              >
                                <PencilIcon className="h-4 w-4 mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(company.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-red-600 hover:bg-red-100 transition-colors duration-150"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="bg-white shadow-sm rounded-custom border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-text">Users</h3>
                      <button
                        onClick={openCreateUserModal}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" /> Create User
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-text">
                                {user.first_name} {user.last_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                user.role === 'agency_admin' ? 'bg-blue-100 text-blue-800' :
                                user.role === 'company_admin' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.company?.name || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.email_verified ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  <CheckCircleIcon className="h-4 w-4 mr-1" /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Unverified
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => openEditUserModal(user)}
                                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-primary hover:bg-primary/10 transition-colors duration-150"
                              >
                                <PencilIcon className="h-4 w-4 mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md text-red-600 hover:bg-red-100 transition-colors duration-150"
                              >
                                <TrashIcon className="h-4 w-4 mr-1" /> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pipelines Tab */}
              {activeTab === 'pipelines' && (
                <div className="bg-white shadow-sm rounded-custom border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-text">Data Pipelines</h3>
                    <p className="text-sm text-gray-600">Manage data pipelines for your connected sources</p>
                  </div>
                  <div className="p-6">
                    <PipelineDashboard />
                  </div>
                </div>
              )}

              {/* Accounts Tab */}
              {activeTab === 'accounts' && (
                <AccountManagement />
              )}

              {/* Modals */}
              <Modal open={modalType === 'agency'} onClose={closeModal} title={editingItem ? 'Edit Agency' : 'Create Agency'}>
                <form onSubmit={handleAgencySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={agencyForm.name || ''}
                      onChange={e => setAgencyForm({ ...agencyForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={agencyForm.email || ''}
                      onChange={e => setAgencyForm({ ...agencyForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      type="url"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={agencyForm.website || ''}
                      onChange={e => setAgencyForm({ ...agencyForm, website: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="is_super_agency"
                      type="checkbox"
                      checked={!!agencyForm.is_super_agency}
                      onChange={e => setAgencyForm({ ...agencyForm, is_super_agency: e.target.checked })}
                      className="h-4 w-4 text-primary border-gray-300 rounded"
                    />
                    <label htmlFor="is_super_agency" className="ml-2 block text-sm text-gray-700">
                      Super Agency
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors duration-150"
                    >
                      {editingItem ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </Modal>

              <Modal open={modalType === 'company'} onClose={closeModal} title={editingItem && editingItem.type === 'company' ? 'Edit Company' : 'Create Company'}>
                <form onSubmit={handleCompanySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={companyForm.name || ''}
                      onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={companyForm.currency_code || 'USD'}
                      onChange={e => setCompanyForm({ ...companyForm, currency_code: e.target.value })}
                    >
                      {['USD','EUR','DKK','GBP','SEK','NOK'].map(code => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={companyForm.email || ''}
                      onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={companyForm.phone || ''}
                      onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Agency</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={companyForm.agency_id || ''}
                      onChange={e => setCompanyForm({ ...companyForm, agency_id: e.target.value })}
                    >
                      <option value="">Select an agency</option>
                      {agencies.map(agency => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors duration-150"
                    >
                      {editingItem && editingItem.type === 'company' ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </Modal>

              <Modal open={modalType === 'user'} onClose={closeModal} title={editingItem && editingItem.type === 'user' ? 'Edit User' : 'Create User'}>
                <form onSubmit={handleUserSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Agency</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={userForm.agency_id || ''}
                      onChange={e => {
                        console.log('Agency dropdown changed to:', e.target.value);
                        console.log('Previous userForm.agency_id:', userForm.agency_id);
                        setUserForm({ ...userForm, agency_id: e.target.value, company_ids: [] });
                        console.log('New userForm.agency_id will be:', e.target.value);
                      }}
                      required
                    >
                      <option value="">Select an agency</option>
                      {agencies.map(agency => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="access_all_companies"
                      type="checkbox"
                      checked={userForm.access_all_companies}
                      onChange={e => setUserForm({ ...userForm, access_all_companies: e.target.checked })}
                    />
                    <label htmlFor="access_all_companies" className="block text-sm text-gray-700">Access all companies in agency</label>
                  </div>
                  {!userForm.access_all_companies && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Companies</label>
                      <select
                        multiple
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                        value={userForm.company_ids?.map(String) || []}
                        onChange={e => {
                          const options = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
                          setUserForm({ ...userForm, company_ids: options });
                        }}
                      >
                        {filteredCompanies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                        value={userForm.first_name || ''}
                        onChange={e => setUserForm({ ...userForm, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                        value={userForm.last_name || ''}
                        onChange={e => setUserForm({ ...userForm, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={userForm.email || ''}
                      onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm px-3 py-2"
                      value={userForm.role || ''}
                      onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                      required
                    >
                      <option value="">Select a role</option>
                      <option value="super_admin">Super Administrator</option>
                      <option value="agency_admin">Agency Administrator</option>
                      <option value="agency_user">Agency User</option>
                      <option value="company_admin">Company Administrator</option>
                      <option value="company_user">Company User</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors duration-150"
                    >
                      {editingItem && editingItem.type === 'user' ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </Modal>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
} 