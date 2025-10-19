// pages/clients/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/analytics/Clients.module.css';
import { Client, ClientAccount } from '@/lib/types/clients';

const ClientsManagement = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newClientName, setNewClientName] = useState('');
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
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

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className={styles.container}>
            <h1>Client Management</h1>

            {/* Create Client Form */}
            <form onSubmit={handleCreateClient} className={styles.createForm}>
                <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="New Client Name"
                    required
                />
                <button type="submit">Create Client</button>
            </form>

            {/* Clients List */}
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
                                />
                                <button type="submit">Save</button>
                                <button 
                                    type="button" 
                                    onClick={() => setEditingClient(null)}
                                >
                                    Cancel
                                </button>
                            </form>
                        ) : (
                            <>
                                <h2>{client.name}</h2>
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
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClientsManagement;