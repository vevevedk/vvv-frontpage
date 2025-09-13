import React from 'react';
import styles from '@/styles/analytics/Analytics.module.css';

interface UploadHandlerProps {
    onUpload: () => Promise<void>;
    isUploading: boolean;
    disabled: boolean;
}

export const UploadHandler: React.FC<UploadHandlerProps> = ({
    onUpload,
    isUploading,
    disabled
}) => {
    return (
        <div className={styles.uploadHandler}>
            <button
                onClick={onUpload}
                disabled={disabled || isUploading}
                className={styles.uploadButton}
            >
                {isUploading ? 'Uploading...' : 'Upload Data'}
            </button>
        </div>
    );
};