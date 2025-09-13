import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TotalsSummary from '../summary/TotalsSummary';
import styles from '@/styles/analytics/Analytics.module.css';
import type { Client } from '../../../../lib/types/clients';
import { DATA_TYPES } from '../../../lib/constants/analytics';
import RequiredColumnsInfo from './RequiredColumnsInfo';
import CsvPreview from './CsvPreview';
import { validateCsv } from '../../../../lib/utils/csvValidation';
import UploadSummary from './UploadSummary';
import { UploadProgress } from './UploadProgress';
import { DataQualityInsights } from '../data-quality/DataQualityInsights';
import { UploadHandler } from './UploadHandler';

interface UploadFormProps {
    selectedClient: Client | null;
    selectedFile: File | null;
    selectedType: string | null;
    clients: Client[];
    onClientChange: (client: Client | null) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTypeChange: (type: string) => void;
    error: string;
    setError: (error: string) => void;
    success: string;
    setSuccess: (success: string) => void;
    uploadSummary?: {
        totalRecords: number;
        addedRecords: number;
        updatedRecords: number;
        skippedRecords: number;
        timestamp: string;
    };
}

interface UploadResult {
    totalProcessed: number;
    added: number;
    updated: number
    skipped: number;
    timestamp: string;
    processingTime: number;
    errors: Array<{ row: number; reason: string }>;
}

interface QualityMetrics {
    state: 'preliminary' | 'maturing' | 'stable' | 'verified' | 'anomalous';
    confidenceScore: number;
    completenessScore: number;
    consistencyScore: number;
    changePercentage: number;
    isSignificantChange: boolean;
}

const UploadForm: React.FC<UploadFormProps> = ({
    selectedClient,
    selectedFile,
    selectedType,
    clients,
    onClientChange,
    onFileChange,
    onTypeChange,
    error,
    setError,
    success,
    setSuccess,
    uploadSummary
}) => {
    const [csvData, setCsvData] = useState<{
        headers: string[];
        rows: string[][];
        missingColumns: string[];
    }>({
        headers: [],
        rows: [],
        missingColumns: []
    });
    const [fileChanged, setFileChanged] = useState<boolean>(false);
    const [previousFile, setPreviousFile] = useState<string>('');
    const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<{
        processed: number;
        total: number;
        status: string;
    }>({
        processed: 0,
        total: 0,
        status: 'Processing...'
    });
    const [showConfirm, setShowConfirm] = useState(false);
    const [progress, setProgress] = useState<string>('');
    const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics[]>([]);
    const [significantChanges, setSignificantChanges] = useState(0);
    const [preliminaryData, setPreliminaryData] = useState(0);

    const selectedTypeConfig = DATA_TYPES.find(t => t.id === selectedType);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if this is a new file
        const currentFileName = file.name + file.lastModified;
        const isNewFile = currentFileName !== previousFile;
        setFileChanged(isNewFile);
        setPreviousFile(currentFileName);

        onFileChange(e);
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '') {
            onClientChange(null);
        } else if (value === 'all') {
            onClientChange({ 
                id: 'all' as any, 
                name: 'All Clients (MCC Account)', 
                created_at: '', 
                updated_at: '' 
            } as Client);
        } else {
            const client = clients.find(c => c.id.toString() === value);
            onClientChange(client || null);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !selectedType || !selectedClient) {
            setError('Please select a file, data type, and client');
            return;
        }

        setIsUploading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('clientId', selectedClient.id.toString());
        formData.append('dataType', selectedType);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            
            if (!response.ok) {
                console.error('Upload failed:', data);
                throw new Error(data.message || 'Upload failed. Please check the console for details.');
            }

            setSuccess('File uploaded successfully');
            if (data.result) {
                setUploadResult(data.result);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Upload failed. Please check the console for details.');
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        onClientChange(null);
        onTypeChange('');
        onFileChange({ target: { files: null }} as any);
        setUploadResult(null);
        setError('');
        setSuccess('');
        setShowConfirm(false);
    };

    const handleUploadClick = () => {
        setShowConfirm(true);
    };

    const handleConfirmUpload = async () => {
        setShowConfirm(false);
        await handleUpload();
    };

    const isUploadDisabled = !selectedFile || !selectedType || !selectedClient;

    return (
        <div className={styles.uploadForm}>
            <div className={styles.formControls}>
                <div className={styles.formGroup}>
                    <label htmlFor="dataType">Data Type</label>
                    <select
                        id="dataType"
                        value={selectedType || ''}
                        onChange={(e) => onTypeChange(e.target.value)}
                        className={styles.select}
                    >
                        <option value="">Select Data Type</option>
                        {DATA_TYPES.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="client">Client</label>
                    <select
                        id="client"
                        value={selectedClient?.id || ''}
                        onChange={handleClientChange}
                        className={styles.select}
                    >
                        <option value="">Select Client</option>
                        {selectedType === 'campaign_performance_daily' && (
                            <option value="all">All Clients (MCC Account)</option>
                        )}
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.fileUploadSection}>
                <div className={styles.formGroup}>
                    <label htmlFor="file">Upload CSV File</label>
                    <div className={styles.dropZone}>
                        <input
                            type="file"
                            id="file"
                            accept=".csv"
                            onChange={onFileChange}
                            className={styles.fileInput}
                        />
                        <div className={styles.dropZoneContent}>
                            {selectedFile ? (
                                <div className={styles.selectedFileInfo}>
                                    <span className={styles.fileName}>{selectedFile.name}</span>
                                    <button 
                                        onClick={() => onFileChange({ target: { files: null }} as any)}
                                        className={styles.clearFile}
                                    >
                                        Clear
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className={styles.uploadIcon}>📄</div>
                                    <p>Drag and drop your CSV file here</p>
                                    <p className={styles.browseText}>or click to browse</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {selectedType && (
                <div className={styles.dataTypeInfo}>
                    <h3>{DATA_TYPES.find(t => t.id === selectedType)?.name}</h3>
                    <p>{DATA_TYPES.find(t => t.id === selectedType)?.description}</p>
                    <div className={styles.requiredColumns}>
                        <h4>Required Columns:</h4>
                        <ul>
                            {DATA_TYPES.find(t => t.id === selectedType)?.requiredColumns.map((col) => (
                                <li key={col}>{col}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            <div className={styles.actionButtons}>
                <UploadHandler
                    onUpload={handleUpload}
                    isUploading={isUploading}
                    disabled={isUploadDisabled}
                />
                {(error || success) && (
                    <button
                        onClick={resetForm}
                        className={styles.resetButton}
                    >
                        Reset Form
                    </button>
                )}
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}
        </div>
    );
};

export default UploadForm;