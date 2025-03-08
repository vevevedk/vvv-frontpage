import { useState } from 'react';
import AnalyticsLayout from '../../components/layouts/AnalyticsLayout';
import styles from '@/styles/analytics/Analytics.module.css';

const PaidShoppingPerformance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AnalyticsLayout>
      <div className={styles.performanceContainer}>
        <h1>Paid Shopping Performance</h1>
        {/* ...existing performance content... */}
      </div>
    </AnalyticsLayout>
  );
};

export default PaidShoppingPerformance;