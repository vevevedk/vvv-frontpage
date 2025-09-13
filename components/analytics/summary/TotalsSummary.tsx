import React from 'react';
// import styles from '../../../styles/analytics/Analytics.module.css';

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
    <div className="uploadSummary">
      <h3>Upload Summary</h3>
      <div className="summaryGrid">
        <div className="summaryItem">
          <span className="summaryLabel">Total Processed</span>
          <span className="summaryValue">{totalProcessed.toLocaleString()}</span>
        </div>
        <div className="summaryItem">
          <span className="summaryLabel">Newly Added</span>
          <span className="summaryValue">{added.toLocaleString()}</span>
        </div>
        <div className="summaryItem">
          <span className="summaryLabel">Updated</span>
          <span className="summaryValue">{updated.toLocaleString()}</span>
        </div>
        <div className="summaryItem">
          <span className="summaryLabel">Skipped</span>
          <span className="summaryValue">{skipped.toLocaleString()}</span>
        </div>
      </div>
      <div className="summaryFooter">
        <small>{dataType} • {new Date(timestamp).toLocaleString()}</small>
      </div>
    </div>
  );
};

export default TotalsSummary; 