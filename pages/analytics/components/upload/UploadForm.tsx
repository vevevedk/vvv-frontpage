import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TotalsSummary from '../TotalsSummary';
import styles from '@/styles/analytics/Analytics.module.css';
import type { Client } from '@/types';
import { DATA_TYPES } from '../../upload';
import RequiredColumnsInfo from './RequiredColumnsInfo';
import CsvPreview from './CsvPreview';
import { validateCsv } from '@/utils/csvValidation';
import UploadSummary from './UploadSummary';
import UploadProgress from './UploadProgress';
import { DataQualityInsights } from '../data-quality/DataQualityInsights';
import { UploadHandler } from './UploadHandler';

interface UploadFormProps {
    selectedClient: Client | null;
    selectedFile: File | null;
    selectedType: string;
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
}) => {
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<{
        processed: number;
        total: number;
        status: string;
    }>({
        processed: 0,
        total: 0,
        status: ''
    });

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === '') {
            onClientChange(null);
        } else if (value === 'all') {
            onClientChange({ id: 'all', name: 'All Clients (MCC Account)' } as Client);
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

            // Handle SSE for progress updates
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                if (data.error) {
                                    throw new Error(data.error);
                                }
                                setUploadProgress({
                                    processed: data.processed,
                                    total: data.total,
                                    status: data.status
                                });
                                if (data.completed) {
                                    setSuccess('Upload completed successfully');
                                }
                            } catch (e) {
                                console.error('Error parsing progress:', e);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Data Upload</h2>
                </div>

                {/* Form Content */}
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleUpload();
                }}>
                    <div className="px-6 py-4 space-y-4">
                        {/* Data Type Selection */}
                        <div>
                            <label htmlFor="dataType" className="block text-sm font-medium text-gray-700 mb-1">
                                Data Type
                            </label>
                            <select
                                id="dataType"
                                name="dataType"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                value={selectedType}
                                onChange={(e) => {
                                    onTypeChange(e.target.value);
                                    onClientChange(null);
                                }}
                            >
                                <option value="">Select a data type</option>
                                {DATA_TYPES.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Client Selection */}
                        {selectedType && (
                            <div>
                                <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-1">
                                    Client
                                </label>
                                <select
                                    id="client"
                                    name="client"
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    value={selectedClient ? (selectedClient.id === 'all' ? 'all' : selectedClient.id) : ''}
                                    onChange={handleClientChange}
                                >
                                    <option value="">Select a client</option>
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
                        )}

                        {/* File Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Upload File
                            </label>
                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                <div className="space-y-1 text-center">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        stroke="currentColor"
                                        fill="none"
                                        viewBox="0 0 48 48"
                                        aria-hidden="true"
                                    >
                                        <path
                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                            strokeWidth={2}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                    <div className="flex text-sm text-gray-600">
                                        <label
                                            htmlFor="file-upload"
                                            className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                                        >
                                            <span>Upload a file</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                accept=".csv"
                                                onChange={onFileChange}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500">CSV files only</p>
                                </div>
                            </div>
                            {selectedFile && (
                                <div className="mt-2 text-sm text-gray-500">
                                    Selected file: {selectedFile.name}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                        <button
                            type="submit"
                            disabled={!selectedFile || !selectedType || !selectedClient || isUploading}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>

                    {/* Progress and Messages */}
                    {(uploadProgress.processed > 0 || error || success) && (
                        <div className="px-6 pb-4 space-y-4">
                            {uploadProgress.processed > 0 && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-900">Progress</span>
                                        <span className="text-gray-500">{uploadProgress.status}</span>
                                    </div>
                                    <div className="bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-2 bg-blue-600 transition-all duration-500"
                                            style={{
                                                width: `${(uploadProgress.processed / Math.max(uploadProgress.total, 1)) * 100}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {error && (
                                <div className="rounded-md bg-red-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {success && (
                                <div className="rounded-md bg-green-50 p-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-green-700">{success}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default UploadForm;