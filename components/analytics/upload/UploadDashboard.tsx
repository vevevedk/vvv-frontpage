import React from 'react';
import styles from '../../../../styles/analytics/Analytics.module.css';

interface UploadDashboardProps {
    error?: string;
    success?: string;
}

export const UploadDashboard: React.FC<UploadDashboardProps> = ({ error, success }) => {
    if (!error && !success) return null;
    
    return (
        <div className={styles.messageContainer}>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}
        </div>
    );
};