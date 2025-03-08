import React from 'react';
import styles from '../../../../styles/Analytics.module.css';

interface UploadProgressProps {
    processed: number;
    total: number;
    status: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ processed, total, status }) => {
    const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
    
    return (
        <div className={styles.progressContainer}>
            <div className={styles.progressHeader}>
                <span className={styles.progressStatus}>{status}</span>
                <span className={styles.progressCount}>
                    {processed.toLocaleString()} {total > 0 && `/ ${total.toLocaleString()}`} records
                </span>
            </div>
            <div className={styles.progressBarContainer}>
                <div 
                    className={styles.progressBar}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className={styles.progressPercentage}>
                {percentage}%
            </div>
        </div>
    );
};