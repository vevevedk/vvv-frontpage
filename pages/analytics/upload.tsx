import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AnalyticsLayout from '../../components/layouts/AnalyticsLayout';
import styles from '@/styles/analytics/Analytics.module.css';
import type { Client } from '../../types';
import UploadForm from './components/upload/UploadForm';
import { DataQualityInsights } from './components/data-quality/DataQualityInsights';
import { GetServerSideProps } from 'next';
import prisma from '@/lib/prisma';

export const DATA_TYPES = [
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

type DataType = typeof DATA_TYPES[number]['id'];

interface Props {
    clients: Client[];
}

interface ProcessingStatus {
    processed: number;
    total: number;
    status: 'processing' | 'complete' | 'error';
    message?: string;
}

interface UploadError {
    message: string;
    details?: string;
}

const Upload: NextPage<Props> = ({ clients }) => {
    const router = useRouter();
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedType, setSelectedType] = useState<DataType>('');
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
    const [uploadError, setUploadError] = useState<UploadError | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setSelectedFile(file || null);
    };

    const handleUpload = async (file: File) => {
        try {
            console.log('Starting upload for file:', file.name);
            setUploadError(null);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('clientId', selectedClient.toString());
            formData.append('tableType', selectedType);

            console.log('Form data contents:', {
                file: file.name,
                clientId: selectedClient,
                tableType: selectedType
            });

            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    // Don't set Content-Type here, let the browser handle it
                },
                body: formData
            });

            console.log('Response status:', response.status);
            const data = await response.json();
            console.log('Response data:', data);

            if (!response.ok) {
                console.log('Upload failed with error:', data);
                setUploadError({
                    message: 'Upload Failed',
                    details: data.message || 'Unknown error occurred'
                });
                return;
            }

            pollProcessingStatus();
        } catch (error) {
            console.error('Upload error:', error);
            setUploadError({
                message: 'Upload Error',
                details: error instanceof Error ? error.message : 'Failed to upload file'
            });
        }
    };

    const pollProcessingStatus = async () => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/processing-status');
                const status: ProcessingStatus = await response.json();
                
                setProcessingStatus(status);
                
                if (status.status === 'complete' || status.status === 'error') {
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('Status polling error:', error);
                clearInterval(pollInterval);
            }
        }, 1000); // Poll every second
    };

    return (
        <AnalyticsLayout>
            <div className={styles.container}>
                <h1>Data Upload</h1>
                
                {uploadError && (
                    <div className={styles.errorContainer}>
                        <div className={styles.errorContent}>
                            <div className={styles.errorHeader}>
                                <span className={styles.errorIcon}>⚠️</span>
                                <h3>{uploadError.message}</h3>
                            </div>
                            {uploadError.details && (
                                <div className={styles.errorDetails}>
                                    {uploadError.details}
                                </div>
                            )}
                            <div className={styles.errorHelp}>
                                {uploadError.message.includes('Missing required columns') && (
                                    <div className={styles.columnHelp}>
                                        <p>Your file must include these required columns:</p>
                                        <ul>
                                            <li>query</li>
                                            <li>date</li>
                                            {/* Add other required columns */}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <UploadForm 
                    selectedClient={selectedClient}
                    selectedFile={selectedFile}
                    selectedType={selectedType}
                    clients={clients}
                    onClientChange={setSelectedClient}
                    onFileChange={handleFileChange}
                    onTypeChange={(type) => setSelectedType(type as DataType)}
                    error={error}
                    setError={setError}
                    success={success}
                    setSuccess={setSuccess}
                />

                {processingStatus && (
                    <div className={styles.processingContainer}>
                        <div className={styles.processingInfo}>
                            <div className={styles.processingHeader}>
                                <span className={styles.processingTitle}>Processing Data</span>
                                <span className={styles.processingCount}>
                                    {processingStatus.processed.toLocaleString()} / {processingStatus.total.toLocaleString()} rows
                                </span>
                            </div>
                            
                            <div className={styles.progressBarContainer}>
                                <div 
                                    className={styles.progressBar}
                                    style={{ 
                                        width: `${(processingStatus.processed / processingStatus.total) * 100}%`
                                    }}
                                />
                            </div>

                            <div className={styles.processingMessage}>
                                {processingStatus.message || 'Processing your data...'}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AnalyticsLayout>
    );
};

export default Upload;

export const getServerSideProps: GetServerSideProps = async () => {
    try {
        const clients = await prisma.clients.findMany({
            select: {
                id: true,
                name: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        return {
            props: {
                clients: clients.map(client => ({
                    id: client.id,
                    name: client.name
                }))
            }
        };
    } catch (error) {
        console.error('Failed to fetch clients:', error);
        return {
            props: {
                clients: []
            }
        };
    }
};