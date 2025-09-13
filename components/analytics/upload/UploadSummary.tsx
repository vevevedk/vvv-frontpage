import React from 'react';
import styles from '../../../../styles/analytics/Analytics.module.css';

interface ErrorDetail {
  row: number;
  reason: string;
}

interface UploadSummaryProps {
  totalRecords: number;
  addedRecords: number;
  updatedRecords: number;
  skippedRecords: number;
  dataType: string;
  timestamp: string;
  processingTime?: number; // Optional
  errors?: ErrorDetail[]; // Optional
}

const UploadSummary: React.FC<UploadSummaryProps> = ({
  totalRecords = 0,      // Default value
  addedRecords = 0,      // Default value
  updatedRecords = 0,    // Default value
  skippedRecords = 0,    // Default value
  dataType = '',         // Default value
  timestamp = new Date().toISOString(),  // Default value
  processingTime = 0,    // Default value
  errors = []           // Default value
}) => {
  const [showErrors, setShowErrors] = React.useState(false);

  const formatNumber = (num: number): string => {
    return num?.toLocaleString() || '0';
  };

  return (
    <div className={styles.uploadSummary}>
      <div className={styles.summaryHeader}>
        <h3>Upload Summary</h3>
      </div>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Total Processed</span>
          <span className={styles.summaryValue}>{formatNumber(totalRecords)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Newly Added</span>
          <span className={`${styles.summaryValue} ${styles.added}`}>
            {formatNumber(addedRecords)}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Updated</span>
          <span className={`${styles.summaryValue} ${styles.updated}`}>
            {formatNumber(updatedRecords)}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Skipped</span>
          <span className={`${styles.summaryValue} ${styles.skipped}`}>
            {formatNumber(skippedRecords)}
          </span>
        </div>
      </div>

      {processingTime > 0 && (
        <div className={styles.processingInfo}>
          <span>Processing Time: {(processingTime / 1000).toFixed(2)}s</span>
          <span>•</span>
          <span>Speed: {Math.round(totalRecords / (processingTime / 1000))} records/s</span>
        </div>
      )}

      {errors.length > 0 && (
        <div className={styles.errorSection}>
          <button 
            className={styles.errorToggle}
            onClick={() => setShowErrors(!showErrors)}
          >
            {showErrors ? 'Hide' : 'Show'} Error Details ({errors.length})
          </button>
          
          {showErrors && (
            <div className={styles.errorList}>
              {errors.slice(0, 100).map((error, index) => (
                <div key={index} className={styles.errorItem}>
                  <span className={styles.errorRow}>Row {error.row}</span>
                  <span className={styles.errorReason}>{error.reason}</span>
                </div>
              ))}
              {errors.length > 100 && (
                <div className={styles.errorMore}>
                  And {errors.length - 100} more errors...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className={styles.summaryFooter}>
        <small>
          {dataType} • {new Date(timestamp).toLocaleString()}
        </small>
      </div>
    </div>
  );
};

export default UploadSummary; 