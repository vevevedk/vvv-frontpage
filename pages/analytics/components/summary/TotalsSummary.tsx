import React from 'react';
import styles from '../../../styles/Analytics.module.css';

interface TotalsSummaryProps {
  totalProcessed: number;
  added: number;
  updated: number;
  skipped: number;
  dataType: string;
  timestamp: string;
}

const TotalsSummary: React.FC<TotalsSummaryProps> = ({
  totalProcessed,
  added,
  updated,
  skipped,
  dataType,
  timestamp
}) => {
  return (
    <div className={styles.uploadSummary}>
      <h3>Upload Summary</h3>
      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Processed</span>
          <span className={styles.summaryValue}>{totalProcessed.toLocaleString()}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Newly Added</span>
          <span className={styles.summaryValue}>{added.toLocaleString()}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Updated</span>
          <span className={styles.summaryValue}>{updated.toLocaleString()}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Skipped</span>
          <span className={styles.summaryValue}>{skipped.toLocaleString()}</span>
        </div>
      </div>
      <div className={styles.summaryFooter}>
        <small>{dataType} • {new Date(timestamp).toLocaleString()}</small>
      </div>
    </div>
  );
};

export default TotalsSummary; 