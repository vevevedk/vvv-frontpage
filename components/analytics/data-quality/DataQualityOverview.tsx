import React from 'react';
import styles from '@/styles/analytics/Analytics.module.css';

interface TableStats {
  table_name: string;
  row_count: number;
  max_date: string;
  min_date: string;
  last_update: string;
}

interface Props {
  clientId: number;
  metrics: any[];
  tableStats: TableStats[];
}

// Add utility functions
const calculateMissingDays = (maxDate: string): number => {
  const today = new Date();
  const lastDate = new Date(maxDate);
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M rows`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K rows`;
  }
  return num.toLocaleString() + ' rows';
};

export function DataQualityOverview({ clientId, metrics, tableStats }: Props) {
  // Calculate actual confidence score based on real data
  const calculateConfidence = () => {
    if (!tableStats.length) return 0;
    const stat = tableStats[0];
    
    // Factors affecting confidence:
    const freshness = calculateMissingDays(stat.max_date) <= 7 ? 100 : 70;
    const completeness = stat.row_count > 0 ? 100 : 0;
    const dateRangeCoverage = stat.min_date && stat.max_date ? 100 : 0;
    
    return Math.floor((freshness + completeness + dateRangeCoverage) / 3);
  };

  return (
    <div className={styles.qualityInsights}>
      <div className={styles.metric}>
        <h3>Overall Confidence</h3>
        <div className={`${styles.score} ${calculateConfidence() < 80 ? styles.warning : ''}`}>
          {calculateConfidence()}%
        </div>
      </div>

      <div className={styles.metric}>
        <h3>Data Maturity</h3>
        <div>
          <div>Fresh Data: {tableStats[0]?.row_count ? formatNumber(tableStats[0].row_count) : '0'}</div>
          <div>Historical Data: {
            tableStats[0]?.min_date ? 
            `${new Date(tableStats[0].min_date).toLocaleDateString()} - Present` : 
            'No historical data'
          }</div>
        </div>
      </div>

      <div className={styles.metric}>
        <h3>Significant Changes</h3>
        <div>
          {metrics.length > 0 ? (
            <>
              <div>Last 24h: {metrics[0]?.qualityMetrics?.recentChanges || 0} changes</div>
              <div>Impact: {metrics[0]?.qualityMetrics?.recentChanges > 10 ? 'High' : 'Low'}</div>
            </>
          ) : 'No recent changes'}
        </div>
      </div>
    </div>
  );
} 