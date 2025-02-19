// pages/analytics/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../../styles/Analytics.module.css';

// Define available analytics reports
const ANALYTICS_REPORTS = [
  {
    id: 'paid-shopping-performance',
    title: 'Paid Shopping Performance',
    description: 'View performance metrics for Google Shopping campaigns',
    path: '/analytics/paid-shopping-performance'
  },
  {
    id: 'gsc',
    title: 'GSC Performance',
    description: 'View Google Search Console performance metrics',
    path: '/analytics/gsc'
  },
  {
    id: 'clients',
    title: 'Client Management',
    description: 'Manage clients and their associated accounts',
    path: '/analytics/clients'
  }
] as const;

const AnalyticsDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        setLoading(false);
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/auth/login');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Loading analytics dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.error}>
          Error loading dashboard: {error}
          <button 
            onClick={() => window.location.reload()} 
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <nav className={styles.sidebarNav}>
          <h2 className={styles.sidebarTitle}>Analytics</h2>
          <ul className={styles.sidebarList}>
            {ANALYTICS_REPORTS.map((report) => (
              <li key={report.id}>
                <Link 
                  href={report.path}
                  className={`${styles.sidebarLink} ${
                    router.pathname === report.path ? styles.active : ''
                  }`}
                >
                  {report.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className={styles.mainContent}>
        <h1>Analytics Dashboard</h1>
        <div className={styles.reportsGrid}>
          {ANALYTICS_REPORTS.map((report) => (
            <Link 
              href={report.path} 
              key={report.id}
              className={styles.reportCard}
            >
              <h2>{report.title}</h2>
              <p>{report.description}</p>
              <span className={styles.viewReport}>
                {report.id === 'clients' ? 'Manage Clients →' : 'View Report →'}
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;