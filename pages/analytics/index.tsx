// pages/analytics/index.tsx
import { useRouter } from 'next/router';
import AnalyticsLayout from '../../components/layouts/AnalyticsLayout';
import styles from '../../styles/Analytics.module.css';

const AnalyticsHome = () => {
    const router = useRouter();

    return (
        <AnalyticsLayout>
            <div className={styles.performanceContainer}>
                {/* ...existing dashboard content... */}
            </div>
        </AnalyticsLayout>
    );
};

export default AnalyticsHome;