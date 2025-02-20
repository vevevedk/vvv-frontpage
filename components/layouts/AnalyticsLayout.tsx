import { useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { HiMenuAlt2, HiX } from 'react-icons/hi';
import styles from '../../styles/Analytics.module.css';

const ANALYTICS_REPORTS = [
  {
    id: 'paid-shopping-performance',
    title: 'Paid Shopping Performance',
    path: '/analytics/paid-shopping-performance'
  },
  {
    id: 'gsc',
    title: 'GSC Performance',
    path: '/analytics/gsc'
  },
  {
    id: 'clients',
    title: 'Client Management',
    path: '/analytics/clients'
  },
  {
    id: 'upload',
    title: 'Data Upload',
    path: '/analytics/upload'
  }
] as const;

const AnalyticsLayout = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  return (
    <div className={styles.dashboardContainer}>
      <aside className={`${styles.sidebar} ${!isSidebarOpen ? styles.sidebarCollapsed : ''}`}>
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

      <button 
        className={`${styles.sidebarToggle} ${!isSidebarOpen ? styles.sidebarToggleCollapsed : ''}`}
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <HiX size={20} /> : <HiMenuAlt2 size={20} />}
      </button>

      <main className={`${styles.mainContent} ${!isSidebarOpen ? styles.mainContentExpanded : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default AnalyticsLayout;