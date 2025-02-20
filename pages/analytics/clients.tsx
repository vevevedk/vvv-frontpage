import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Analytics.module.css';
import { Client, ClientAccount, AccountType } from '../../types/clients';
// Make sure to import as default
import AnalyticsLayout from '../../components/layouts/AnalyticsLayout';

interface Location {
    id: number;
    country_name: string;
}

interface ClientWithAccounts extends Client {
    accounts: ClientAccount[];
}

const ClientsManagement: React.FC = () => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
    const [clients, setClients] = useState<ClientWithAccounts[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newClientName, setNewClientName] = useState('');
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [editingAccount, setEditingAccount] = useState<ClientAccount | null>(null);
    const [showAccountForm, setShowAccountForm] = useState<number | null>(null);
    const [newAccount, setNewAccount] = useState({
        account_name: '',
        account_type: AccountType.GoogleAds,
        account_id: '',
        locations: [] as number[]
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const router = useRouter();

    useEffect(() => {
        fetchClients();
    }, []);

    // useEffect to get loctions
    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch('/api/locations');
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to fetch locations');
                }
                const data = await res.json();
                setLocations(data);
            } catch (err) {
                console.error('Error fetching locations:', err);
                setError(err instanceof Error ? err.message : 'An error occurred');
            }
        };

        fetchLocations();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/clients');
            if (!res.ok) throw new Error('Failed to fetch clients');
            const data = await res.json();
            setClients(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newClientName })
            });
            if (!res.ok) throw new Error('Failed to create client');
            
            await fetchClients();
            setNewClientName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingClient) return;

        try {
            const res = await fetch(`/api/clients/${editingClient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingClient.name })
            });
            if (!res.ok) throw new Error('Failed to update client');
            
            await fetchClients();
            setEditingClient(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleDeleteClient = async (clientId: number) => {
        if (!confirm('Are you sure you want to delete this client?')) return;

        try {
            const res = await fetch(`/api/clients/${clientId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete client');
            
            await fetchClients();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    const handleAddAccount = async (clientId: number) => {
        try {
            const accountData = {
                ...newAccount,
                client_id: clientId,
                // Ensure locations array is included
                locations: newAccount.locations
            };
    
            const res = await fetch(`/api/clients/${clientId}/accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Send accountData instead of newAccount
                body: JSON.stringify(accountData)
            });
            
    
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to add account');
            }
            
            await fetchClients();
            setShowAccountForm(null);
            setNewAccount({
                account_name: '',
                account_type: AccountType.GoogleAds,
                account_id: '',
                locations: [] as number[]
            });
        } catch (err) {
            console.error('Error adding account:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    // Update handleUpdateAccount function
    const handleUpdateAccount = async (clientId: number, accountId: number) => {
        if (!editingAccount) return;

        try {
            const res = await fetch(`/api/clients/${clientId}/accounts/${accountId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_name: editingAccount.account_name,
                    account_type: editingAccount.account_type,
                    account_id: editingAccount.account_id,
                    locations: editingAccount.locations // Add this line
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update account');
            }
            
            await fetchClients();
            setEditingAccount(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    // Update handleDeleteAccount function
    const handleDeleteAccount = async (clientId: number, accountId: number) => {
        if (!confirm('Are you sure you want to delete this account?')) return;

        try {
            const res = await fetch(`/api/clients/${clientId}/accounts/${accountId}`, {
                method: 'DELETE'
            });
            
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete account');
            }
            
            await fetchClients();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    if (loading) {
        return (
            <AnalyticsLayout>
                <div className={styles.loading}>Loading...</div>
            </AnalyticsLayout>
        );
    }

    if (error) {
        return (
            <AnalyticsLayout>
                <div className={styles.error}>Error: {error}</div>
            </AnalyticsLayout>
        );
    }

    return (
        <AnalyticsLayout>
            <h1>Client Management</h1>

            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={() => setError(null)} className={styles.dismissButton}>
                        Dismiss
                    </button>
                </div>
            )}

            <form onSubmit={handleCreateClient} className={styles.createForm}>
                <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="New Client Name"
                    required
                    className={styles.input}
                />
                <button type="submit" className={styles.button}>Create Client</button>
            </form>

            <div className={styles.clientsList}>
                {clients.map(client => (
                    <div key={client.id} className={styles.clientCard}>
                        {editingClient?.id === client.id ? (
                            <form onSubmit={handleUpdateClient} className={styles.editForm}>
                                <input
                                    type="text"
                                    value={editingClient.name}
                                    onChange={(e) => setEditingClient({
                                        ...editingClient,
                                        name: e.target.value
                                    })}
                                    required
                                    className={styles.input}
                                />
                                <div className={styles.buttonGroup}>
                                    <button type="submit" className={styles.saveButton}>Save</button>
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingClient(null)}
                                        className={styles.cancelButton}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <h2 className={styles.clientName}>{client.name}</h2>
                                <div className={styles.clientActions}>
                                    <button 
                                        onClick={() => setEditingClient(client)}
                                        className={styles.editButton}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteClient(client.id)}
                                        className={styles.deleteButton}
                                    >
                                        Delete
                                    </button>
                                </div>

                                <div className={styles.accountsSection}>
                                    <h3>Accounts</h3>
                                    {client.accounts && Array.isArray(client.accounts) && client.accounts.length > 0 ? (
                                        <ul className={styles.accountsList}>
                                            {client.accounts.filter(account => account !== null).map((account) => (
                                                <li key={account.id} className={styles.accountItem}>
                                                    {editingAccount?.id === account.id ? (
                                                        <div className={styles.accountForm}>
                                                            <input
                                                                type="text"
                                                                value={editingAccount.account_name}
                                                                onChange={(e) => setEditingAccount({
                                                                    ...editingAccount,
                                                                    account_name: e.target.value
                                                                })}
                                                                className={styles.input}
                                                            />
                                                            <select
                                                                value={editingAccount.account_type}
                                                                onChange={(e) => setEditingAccount({
                                                                    ...editingAccount,
                                                                    account_type: e.target.value as AccountType
                                                                })}
                                                                className={styles.select}
                                                            >
                                                                <option value={AccountType.GoogleAds}>{AccountType.GoogleAds}</option>
                                                                <option value={AccountType.GoogleAnalytics}>{AccountType.GoogleAnalytics}</option>
                                                            </select>
                                                            <input
                                                                type="text"
                                                                value={editingAccount.account_id}
                                                                onChange={(e) => setEditingAccount({
                                                                    ...editingAccount,
                                                                    account_id: e.target.value
                                                                })}
                                                                className={styles.input}
                                                            />
                                                            <div className={styles.locationSelect}>
                                                                <label>Locations:</label>
                                                                <select
                                                                    multiple
                                                                    value={editingAccount.locations || []}
                                                                    onChange={(e) => {
                                                                        const selectedOptions = Array.from(e.target.selectedOptions);
                                                                        const selectedLocations = selectedOptions.map(option => 
                                                                            parseInt(option.value)
                                                                        );
                                                                        setEditingAccount({
                                                                            ...editingAccount,
                                                                            locations: selectedLocations
                                                                        });
                                                                    }}
                                                                    className={styles.multiSelect}
                                                                >
                                                                    {locations.map(location => (
                                                                        <option key={location.id} value={location.id}>
                                                                            {location.country_name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className={styles.buttonGroup}>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => handleUpdateAccount(client.id, account.id)}
                                                                    className={styles.saveButton}
                                                                >
                                                                    Save
                                                                </button>
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setEditingAccount(null)}
                                                                    className={styles.cancelButton}
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className={styles.accountInfo}>
                                                                <strong>{account.account_name}</strong>
                                                                <span>{account.account_type}</span>
                                                                <span>{account.account_id}</span>
                                                                <div className={styles.locationsList}>
                                                                    {account.locations && account.locations.length > 0 ? (
                                                                        <div className={styles.locations}>
                                                                            <strong>Locations: </strong>
                                                                            {locations
                                                                                .filter(loc => account.locations.includes(loc.id))
                                                                                .map(loc => loc.country_name)
                                                                                .join(', ')}
                                                                        </div>
                                                                    ) : (
                                                                        <span className={styles.noLocations}>No locations selected</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className={styles.accountActions}>
                                                                <button
                                                                    onClick={() => setEditingAccount(account)}
                                                                    className={styles.editButton}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteAccount(client.id, account.id)}
                                                                    className={styles.deleteButton}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className={styles.noAccounts}>No accounts added yet</p>
                                    )}

                                    {showAccountForm === client.id ? (
                                        <div className={styles.accountForm}>
                                            <input
                                                type="text"
                                                placeholder="Account Name"
                                                value={newAccount.account_name}
                                                onChange={(e) => setNewAccount({
                                                    ...newAccount,
                                                    account_name: e.target.value
                                                })}
                                                className={styles.input}
                                            />
                                            <select
                                                value={newAccount.account_type}
                                                onChange={(e) => setNewAccount({
                                                    ...newAccount,
                                                    account_type: e.target.value as AccountType
                                                })}
                                                className={styles.select}
                                            >
                                                <option value={AccountType.GoogleAds}>{AccountType.GoogleAds}</option>
                                                <option value={AccountType.GoogleAnalytics}>{AccountType.GoogleAnalytics}</option>
                                            </select>
                                            <input
                                                type="text"
                                                placeholder="Account ID"
                                                value={newAccount.account_id}
                                                onChange={(e) => setNewAccount({
                                                    ...newAccount,
                                                    account_id: e.target.value
                                                })}
                                                className={styles.input}
                                            />
                                            <div className={styles.locationSelect}>
                                                <label>Locations:</label>
                                                <select
                                                    multiple
                                                    value={newAccount.locations}
                                                    onChange={(e) => {
                                                        const values = Array.from(
                                                            e.target.selectedOptions, 
                                                            option => parseInt(option.value)
                                                        );
                                                        setNewAccount({
                                                            ...newAccount,
                                                            locations: values
                                                        });
                                                    }}
                                                    className={styles.multiSelect}
                                                >
                                                    {locations.map(location => (
                                                        <option key={location.id} value={location.id}>
                                                            {location.country_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className={styles.buttonGroup}>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleAddAccount(client.id)}
                                                    className={styles.saveButton}
                                                >
                                                    Add Account
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowAccountForm(null)}
                                                    className={styles.cancelButton}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => setShowAccountForm(client.id)}
                                            className={styles.addAccountButton}
                                        >
                                            Add Account
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </AnalyticsLayout>
    );
};

export default ClientsManagement;