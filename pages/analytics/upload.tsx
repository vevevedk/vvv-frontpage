import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';
import AnalyticsLayout from '../../components/layouts/AnalyticsLayout';
import styles from '../../styles/Analytics.module.css';

interface UploadFormData {
    file: File | null;
    table: string;
    clientId: number;
}

interface Client {
    id: number;
    name: string;
}

const ALLOWED_TABLES = [
    { id: 'search_console_data', name: 'Search Console Data' },
    { id: 'paid_shopping_data', name: 'Paid Shopping Data' }
] as const;

const DATA_TYPES = [
    {
        id: 'campaign_performance_daily',
        name: 'Campaign Performance Daily',
        description: 'Google Ads campaign performance data (includes campaign and budget data)',
        tables: ['campaign_performance_daily', 'campaigns', 'campaign_budgets'],
        requiredColumns: [
            'Day', 'Campaign status', 'Campaign', 'Budget name', 'Currency code',
            'Budget', 'Budget type', 'Status', 'Status reasons', 'Impr.',
            'Clicks', 'Cost', 'Conversions', 'Conv. value', 'Bid strategy',
            'Target ROAS', 'Search impr. share', 'Click share', 'Campaign ID'
        ]
    },
    {
        id: 'search_console_daily',
        name: 'Search Console Performance',
        description: 'Google Search Console query and page performance data',
        tables: ['search_console_data'],
        requiredColumns: ['date', 'query', 'page', 'clicks', 'impressions', 'position', 'ctr']
    }
] as const;

// Update the type definition
type DataType = typeof DATA_TYPES[number]['id'];

const Upload: NextPage = () => {
    const [selectedClient, setSelectedClient] = useState<number>(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedType, setSelectedType] = useState<DataType>('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [clients, setClients] = useState<Client[]>([]);

    const handleUpload = async () => {
        if (!selectedClient || !selectedFile || !selectedType) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('clientId', selectedClient.toString());
        formData.append('dataType', selectedType);

        setIsUploading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Upload failed');

            setSuccess(`Successfully uploaded ${data.rowsProcessed} rows`);
            setSelectedFile(null);
            
            // Reset file input
            const fileInput = document.getElementById('file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const router = useRouter();
    const [formData, setFormData] = useState<UploadFormData>({
        file: null,
        table: 'search_console_data',
        clientId: 0
    });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        fetchClients();
        
        // Set initial values from URL query params
        if (router.query.client) {
            setFormData(prev => ({
                ...prev,
                clientId: Number(router.query.client)
            }));
        }
        if (router.query.table) {
            setFormData(prev => ({
                ...prev,
                table: router.query.table as string
            }));
        }
    }, [router.query]);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            if (!response.ok) throw new Error('Failed to fetch clients');
            const data = await response.json();
            setClients(data);
        } catch (error) {
            setError('Failed to load clients');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setFormData(prev => ({ ...prev, file }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { file, table, clientId } = formData;

        if (!file || !clientId) {
            setError('Please select both a client and a file');
            return;
        }

        const formPayload = new FormData();
        formPayload.append('file', file);
        formPayload.append('table', table);
        formPayload.append('clientId', clientId.toString());

        try {
            setUploading(true);
            setUploadProgress(0);
            setError(null);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formPayload
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || result.message || 'Upload failed');
            }

            setUploadProgress(100);
            setFormData(prev => ({ ...prev, file: null }));
            
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
            alert(`Upload successful! Processed ${result.rowsProcessed} rows (${result.rowsSkipped} duplicates skipped)`);
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <AnalyticsLayout>
            <div className={styles.container}>
                <h1>Data Upload</h1>
                
                <div className={styles.uploadForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="client">Select Client</label>
                        <select
                            id="client"
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(Number(e.target.value))}
                            className={styles.select}
                        >
                            <option value="">Select a client...</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="dataType">Data Type</label>
                        <select
                            id="dataType"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value as DataType)}
                            className={styles.select}
                        >
                            <option value="">Select a data type...</option>
                            {DATA_TYPES.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        {selectedType && (
                            <div className={styles.dataTypeInfo}>
                                <p className={styles.description}>
                                    {DATA_TYPES.find(t => t.id === selectedType)?.description}
                                </p>
                                <div className={styles.relatedTables}>
                                    <p>Tables affected: <span>
                                        {DATA_TYPES.find(t => t.id === selectedType)?.tables.join(', ')}
                                    </span></p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="file">Upload File (CSV)</label>
                        <input
                            type="file"
                            id="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className={styles.fileInput}
                        />
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!selectedClient || !selectedFile || !selectedType || isUploading}
                        className={styles.uploadButton}
                    >
                        {isUploading ? 'Uploading...' : 'Upload Data'}
                    </button>

                    {error && <div className={styles.error}>{error}</div>}
                    {success && <div className={styles.success}>{success}</div>}
                </div>
            </div>
        </AnalyticsLayout>
    );
};

export default Upload;