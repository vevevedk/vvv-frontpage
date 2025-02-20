import { useEffect, useState } from 'react';
import AnalyticsLayout from '../../components/layouts/AnalyticsLayout';
import styles from '../../styles/Analytics.module.css';

interface Client {
    id: number;
    name: string;
}

const AVAILABLE_TABLES = ['search_console_data'] as const;
type AvailableTable = typeof AVAILABLE_TABLES[number];

const ANALYTICS_REPORTS = [
  {
    id: 'paid-shopping-performance',
    title: 'Paid Shopping Performance',
    path: '/analytics/paid-shopping-performance'
  },
  {
    id: 'gsc',
    title: 'GSC Performance',
    path: '/analytics/gsc'
  },
  {
    id: 'clients',
    title: 'Client Management',
    path: '/analytics/clients'
  },
  {
    id: 'upload',
    title: 'Data Upload',
    path: '/analytics/upload'
  }
] as const;

const Upload = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedTable, setSelectedTable] = useState<AvailableTable>('search_console_data');
    const [selectedClient, setSelectedClient] = useState<number>(0);
    const [uploading, setUploading] = useState(false);

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

    useEffect(() => {
        fetchClients();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/csv') {
            setSelectedFile(file);
            setError(null);
        } else {
            setError('Please select a valid CSV file');
            setSelectedFile(null);
        }
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile || !selectedClient) {
            setError('Please select a file and client');
            return;
        }

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('table', selectedTable);
        formData.append('clientId', selectedClient.toString());

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const result = await response.json();
            alert('Upload successful!');
            setSelectedFile(null);
            // Reset file input
            const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
            if (fileInput) fileInput.value = '';
        } catch (error) {
            setError('Upload failed. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <AnalyticsLayout>
            <div className={styles.uploadContainer}>
                <div className={styles.uploadContainer}>
                    <form onSubmit={handleSubmit} className={styles.uploadForm}>
                        <div className={styles.formGroup}>
                            <label htmlFor="table">Target Table:</label>
                            <select
                                id="table"
                                value={selectedTable}
                                onChange={(e) => setSelectedTable(e.target.value as AvailableTable)}
                                className={styles.select}
                            >
                                {AVAILABLE_TABLES.map(table => (
                                    <option key={table} value={table}>
                                        {table}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="client">Client:</label>
                            <select
                                id="client"
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(Number(e.target.value))}
                                className={styles.select}
                            >
                                <option value={0}>Select a client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="file">CSV File:</label>
                            <input
                                id="file"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className={styles.fileInput}
                            />
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <button
                            type="submit"
                            disabled={uploading || !selectedFile || !selectedClient}
                            className={styles.submitButton}
                        >
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </form>
                </div>
            </div>
        </AnalyticsLayout>
    );
};

export default Upload;