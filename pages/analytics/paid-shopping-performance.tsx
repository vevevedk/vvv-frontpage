// pages/analytics/paid-shopping-performance.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Analytics.module.css';
import { PaidShoppingChannelData, PaidShoppingProductData } from '../../types/analytics';

const PaidShoppingDashboard = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelData, setChannelData] = useState<PaidShoppingChannelData[]>([]);
  const [productData, setProductData] = useState<PaidShoppingProductData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching data...');
        setLoading(true);
        
        const channelRes = await fetch('/api/analytics/paid-shopping-performance/channels');
        const productRes = await fetch('/api/analytics/paid-shopping-performance/products');

        if (!channelRes.ok) {
          const errorText = await channelRes.text();
          throw new Error(`Failed to fetch channel data: ${errorText}`);
        }
        if (!productRes.ok) {
          const errorText = await productRes.text();
          throw new Error(`Failed to fetch product data: ${errorText}`);
        }

        const channelJson = await channelRes.json();
        console.log('Channel data:', channelJson);
        
        const productJson = await productRes.json();
        console.log('Product data:', productJson);

        setChannelData(channelJson.channelPerformance || []);
        setProductData(productJson.productPerformance || []);
      } catch (err) {
        console.error('Error in data fetch:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <aside className={styles.sidebar}>
        <nav className={styles.sidebarNav}>
          <h2 className={styles.sidebarTitle}>Analytics</h2>
          <ul className={styles.sidebarList}>
            <li>
              <a href="/analytics/paid-shopping-performance" className={`${styles.sidebarLink} ${styles.active}`}>
                Paid Shopping Performance
              </a>
            </li>
            <li>
              <a href="/analytics/gsc" className={styles.sidebarLink}>
                GSC Performance
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <h1>Paid Shopping Performance</h1>
        
        {loading ? (
          <div className={styles.loading}>Loading performance data...</div>
        ) : error ? (
          <div className={styles.error}>
            Error: {error}
            <button onClick={() => window.location.reload()} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : (
          <>
            <section className={styles.performanceSection}>
              <h2>Channel Performance</h2>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Channel Group</th>
                      <th>Period</th>
                      <th>Sessions</th>
                      <th>Engaged Sessions</th>
                      <th>Engagement Rate</th>
                      <th>Total Events</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {channelData.map((channel, index) => (
                      <tr key={`${channel.channel_group}-${channel.period}-${index}`}>
                        <td>{channel.channel_group}</td>
                        <td>{channel.period}</td>
                        <td>{channel.total_sessions.toLocaleString()}</td>
                        <td>{channel.engaged_sessions.toLocaleString()}</td>
                        <td>{channel.avg_engagement_rate}%</td>
                        <td>{channel.total_events.toLocaleString()}</td>
                        <td>£{channel.total_revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className={styles.performanceSection}>
              <h2>Product Performance</h2>
              <div className={styles.tableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Location</th>
                      <th>Account</th>
                      <th>Impressions</th>
                      <th>Clicks</th>
                      <th>CTR</th>
                      <th>Cost</th>
                      <th>Conversions</th>
                      <th>Revenue</th>
                      <th>ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productData.map((product, index) => (
                      <tr key={`${product.product_name}-${product.location}-${index}`}>
                        <td>{product.product_name}</td>
                        <td>{product.location}</td>
                        <td>{product.account}</td>
                        <td>{product.impressions.toLocaleString()}</td>
                        <td>{product.clicks.toLocaleString()}</td>
                        <td>{product.avg_ctr}%</td>
                        <td>£{product.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{product.conversions.toLocaleString()}</td>
                        <td>£{product.conversion_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td>{(product.conversion_value / product.cost || 0).toFixed(2)}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default PaidShoppingDashboard;