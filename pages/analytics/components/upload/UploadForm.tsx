import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TotalsSummary from '../TotalsSummary';
import styles from '@/styles/analytics/Analytics.module.css';
import { Client } from '@/types';
import { DATA_TYPES } from '../../upload';
import RequiredColumnsInfo from './RequiredColumnsInfo';
import CsvPreview from './CsvPreview';
import { validateCsv } from '@/utils/csvValidation';
import UploadSummary from './UploadSummary';
import UploadProgress from './UploadProgress';
import { DataQualityInsights } from '../data-quality/DataQualityInsights';

interface UploadFormProps {
    selectedClient: number;
    selectedFile: File | null;
    selectedType: string;
    clients: Client[];
    onClientChange: (clientId: number) => void;
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

export default function UploadForm({
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
}: UploadFormProps) {
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
    const requiredColumns = ['date', 'query', 'page', 'clicks', 'impressions', 'position', 'ctr'];
    const [progress, setProgress] = useState<string>('');
    const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics[]>([]);
    const [significantChanges, setSignificantChanges] = useState(0);
    const [preliminaryData, setPreliminaryData] = useState(0);

    const selectedDataType = DATA_TYPES.find(type => type.id === selectedType);

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

    const handleUpload = async () => {
        if (!selectedClient || !selectedFile || !selectedType) {
            setError('Please select a client, file, and data type');
            return;
        }

        setIsUploading(true);
        setError('');
        setSuccess('');
        setProgress('');
        
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('clientId', selectedClient.toString());
        formData.append('dataType', selectedType);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No response body');

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = new TextDecoder().decode(value);
                console.log('Received chunk:', text); // Debug log

                const messages = text.split('\n').filter(Boolean);

                for (const message of messages) {
                    if (message.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(message.slice(6));
                            console.log('Parsed message:', data); // Debug log
                            
                            if (data.type === 'quality') {
                                console.log('Received quality metrics:', data.metrics); // Debug log
                                setQualityMetrics(prev => [...prev, data.metrics]);
                                if (data.metrics.isSignificantChange) {
                                    setSignificantChanges(prev => prev + 1);
                                }
                                if (data.metrics.state === 'preliminary') {
                                    setPreliminaryData(prev => prev + 1);
                                }
                            }
                            
                            if (data.type === 'progress') {
                                setProgress(data.status);
                            } else if (data.result) {
                                setUploadResult({
                                    totalProcessed: data.result.totalProcessed,
                                    added: data.result.added,
                                    updated: data.result.updated,
                                    skipped: data.result.skipped,
                                    timestamp: data.result.timestamp
                                });
                                setSuccess(`Upload complete! ${data.result.totalProcessed.toLocaleString()} records processed.`);
                            }
                        } catch (e) {
                            console.error('Failed to parse message:', message, e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Upload error:', error);
            setError(error instanceof Error ? error.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        onClientChange(0);
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

    return (
        <div className={styles.form}>
            <div className={styles.formGroup}>
                <label htmlFor="client">Select Client</label>
                <select
                    id="client"
                    value={selectedClient}
                    onChange={(e) => onClientChange(Number(e.target.value))}
                >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="type">Data Type</label>
                <select
                    id="type"
                    value={selectedType}
                    onChange={(e) => onTypeChange(e.target.value)}
                >
                    <option value="">Choose data type...</option>
                    <option value="search_console_daily">Search Console Daily</option>
                    <option value="analytics_daily">Analytics Daily</option>
                </select>
            </div>

            <div className={styles.formGroup}>
                <label>Upload File</label>
                <div 
                    className={`${styles.fileInput} ${selectedFile ? styles.hasFile : ''}`}
                    onClick={() => document.getElementById('file')?.click()}
                >
                    <input
                        type="file"
                        id="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                    {selectedFile ? (
                        <div className={styles.fileName}>
                            {selectedFile.name}
                        </div>
                    ) : (
                        <>
                            <p>Drop your CSV file here</p>
                            <small>or click to browse</small>
                        </>
                    )}
                </div>
            </div>

            {selectedDataType && (
                <RequiredColumnsInfo columns={selectedDataType.requiredColumns} />
            )}

            {selectedFile && csvData.headers.length > 0 && (
                <CsvPreview
                    headers={csvData.headers}
                    rows={csvData.rows}
                    requiredColumns={selectedDataType?.requiredColumns || []}
                    missingColumns={csvData.missingColumns}
                />
            )}

            {!fileChanged && uploadSummary && (
                <div className={styles.warning}>
                    Warning: This file appears to have been already uploaded. 
                    Are you sure you want to upload it again?
                </div>
            )}

            <div className={styles.buttonGroup}>
                <button 
                    onClick={handleUploadClick}
                    disabled={!selectedClient || !selectedFile || !selectedType || isUploading}
                    className={styles.uploadButton}
                >
                    {isUploading ? (
                        <div className={styles.uploadingState}>
                            <span className={styles.spinner}></span>
                            <span>Uploading...</span>
                        </div>
                    ) : (
                        <div className={styles.uploadState}>
                            <span className={styles.uploadIcon}>↑</span>
                            <span>Upload File</span>
                        </div>
                    )}
                </button>

                {(uploadResult || error) && (
                    <button 
                        onClick={resetForm}
                        className={styles.resetButton}
                    >
                        Clear Form
                    </button>
                )}
            </div>

            {isUploading && (
                <motion.div 
                    className={styles.progress}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <div className={styles.progressIcon}>⏳</div>
                    <div className={styles.progressMessage}>
                        {progress || 'Processing...'}
                    </div>
                </motion.div>
            )}

            {isUploading && qualityMetrics.length > 0 && (
                <DataQualityInsights
                    metrics={qualityMetrics}
                    totalRecords={uploadResult?.totalProcessed || 0}
                    significantChanges={significantChanges}
                    preliminaryData={preliminaryData}
                />
            )}

            <AnimatePresence>
                {error && (
                    <motion.div 
                        className={styles.error}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className={styles.errorIcon}>⚠️</div>
                        <div className={styles.errorMessage}>
                            {typeof error === 'string' ? (
                                <>
                                    <strong>Error:</strong> {error}
                                </>
                            ) : (
                                error
                            )}
                        </div>
                    </motion.div>
                )}

                {showConfirm && (
                    <motion.div 
                        className={styles.confirmDialog}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <h3>Confirm Upload</h3>
                        <p>Are you sure you want to upload this file?</p>
                        <div className={styles.confirmButtons}>
                            <button 
                                onClick={handleConfirmUpload}
                                className={styles.confirmButton}
                            >
                                Yes, Upload
                            </button>
                            <button 
                                onClick={() => setShowConfirm(false)}
                                className={styles.cancelButton}
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}

                {uploadResult && (
                    <motion.div 
                        className={styles.summary}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <h3>Upload Summary</h3>
                        <div className={styles.summaryGrid}>
                            <div>
                                <div className={styles.summaryLabel}>Total Processed</div>
                                <div className={styles.summaryValue}>{uploadResult.totalProcessed.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className={styles.summaryLabel}>Newly Added</div>
                                <div className={styles.summaryValue}>{uploadResult.added.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className={styles.summaryLabel}>Updated</div>
                                <div className={styles.summaryValue}>{uploadResult.updated.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className={styles.summaryLabel}>Skipped</div>
                                <div className={styles.summaryValue}>{uploadResult.skipped.toLocaleString()}</div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}