import React from 'react';
import { Line } from 'react-chartjs-2';
import styles from '@/styles/analytics/Analytics.module.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TableStats {
  table_name: string;
  row_count: number;
  max_date: string;
  min_date: string;
  last_update: string;
}

interface Props {
  metrics: any[];
  totalRecords?: number;
  significantChanges?: number;
  preliminaryData?: number;
  tableStats?: TableStats[];
}

const calculateMissingDays = (maxDate: string): number => {
  const today = new Date();
  const lastDate = new Date(maxDate);
  const diffTime = Math.abs(today.getTime() - lastDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export function DataQualityInsights({ metrics, tableStats = [] }: Props) {
  const stat = tableStats[0];
  if (!metrics.length || !stat) {
    return (
      <div className={styles.insights}>
        <h3>Data Quality Insights</h3>
        <div className={styles.noData}>No data available</div>
      </div>
    );
  }

  // Calculate data confidence thresholds
  const daysToConfidence = calculateMissingDays(stat.max_date);
  const isDataConfident = daysToConfidence <= 7;
  const dataAge = new Date(stat.max_date);
  
  // Calculate data completeness
  const expectedDailyRows = Math.floor(stat.row_count / 30); // Assuming 30 days of data
  const actualLatestRows = metrics[0]?.rowCount || 0;
  const completenessScore = Math.min(100, (actualLatestRows / expectedDailyRows) * 100);

  return (
    <div className={styles.insights}>
      <h3>Data Quality Insights</h3>
      <p className={styles.insightDescription}>
        Real-time analysis of your data quality, freshness, and completeness
      </p>
      
      <div className={styles.insightCards}>
        <div className={styles.insightCard}>
          <div className={styles.cardHeader}>
            <h4>Data Confidence</h4>
            <span className={styles.infoIcon} title="Indicates how fresh and reliable your data is">ⓘ</span>
          </div>
          <div className={`${styles.confidenceStatus} ${isDataConfident ? styles.confident : styles.warning}`}>
            {isDataConfident ? 'Confident' : 'Needs Update'}
          </div>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span>Last confident:</span>
              <span>{dataAge.toLocaleDateString()}</span>
            </div>
            {!isDataConfident && (
              <div className={styles.warning}>
                ⚠️ Data is {daysToConfidence} days old
                <div className={styles.actionHint}>
                  Consider updating your data to maintain accuracy
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.insightCard}>
          <div className={styles.cardHeader}>
            <h4>Data Completeness</h4>
            <span className={styles.infoIcon} title="Compares actual vs expected daily data volume">ⓘ</span>
          </div>
          <div className={`${styles.completenessScore} ${completenessScore < 50 ? styles.warning : styles.good}`}>
            {completenessScore.toFixed(1)}%
          </div>
          <div className={styles.details}>
            <div className={styles.detailRow}>
              <span>Expected daily:</span>
              <span>{expectedDailyRows.toLocaleString()} rows</span>
            </div>
            <div className={styles.detailRow}>
              <span>Latest daily:</span>
              <span>{actualLatestRows.toLocaleString()} rows</span>
            </div>
            {completenessScore < 50 && (
              <div className={styles.actionHint}>
                Data volume is lower than expected
              </div>
            )}
          </div>
        </div>

        <div className={styles.insightCard}>
          <div className={styles.cardHeader}>
            <h4>Data Trends</h4>
            <span className={styles.infoIcon} title="Recent changes in your data">ⓘ</span>
          </div>
          <div className={styles.trendInfo}>
            {metrics[0]?.qualityMetrics?.recentChanges > 0 ? (
              <>
                <div className={styles.changeStatus}>
                  Active Changes Detected
                </div>
                <div className={styles.changes}>
                  {metrics[0].qualityMetrics.recentChanges} records updated
                  <div className={styles.timestamp}>in the last 24 hours</div>
                </div>
              </>
            ) : (
              <div className={styles.noChanges}>
                No significant changes in last 24h
                <div className={styles.timestamp}>Data is stable</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 