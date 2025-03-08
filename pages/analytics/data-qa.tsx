import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import AnalyticsLayout from '../../components/layouts/AnalyticsLayout';
import styles from '@/styles/analytics/Analytics.module.css';
import { DataQualityOverview } from './components/data-quality/DataQualityOverview';
import { DataQualityInsights } from './components/data-quality/DataQualityInsights';

interface TableStats {
    table_name: string;
    row_count: number;
    max_date: string;
    min_date: string;
    last_update: string;
}

interface Client {
    id: number;
    name: string;
}

interface QualityThreshold {
    date: string;
    confidence: number;
    status: 'reliable' | 'questionable' | 'unreliable';
    reason?: string;
}

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

const POLL_INTERVAL = 1000; // Poll every 1 second (1000ms)

const DataQA: NextPage = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<number>(0);
    const [tableStats, setTableStats] = useState<TableStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [qualityMetrics, setQualityMetrics] = useState<any[]>([]);
    const [qualityTimeline, setQualityTimeline] = useState<QualityThreshold[]>([]);

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (selectedClient > 0) {
            fetchTableStats();
        }
    }, [selectedClient]);

    useEffect(() => {
        if (!selectedClient) return;

        const pollData = async () => {
            await Promise.all([
                fetchTableStats(),
                fetchQualityMetrics()
            ]);
        };

        // Initial fetch
        pollData();

        // Set up polling
        const interval = setInterval(pollData, POLL_INTERVAL);

        // Cleanup
        return () => clearInterval(interval);
    }, [selectedClient]);

    useEffect(() => {
        if (tableStats.length > 0) {
            const stat = tableStats[0];
            const startDate = new Date(stat.min_date);
            const endDate = new Date(stat.max_date);
            
            // Calculate quality thresholds
            const thresholds: QualityThreshold[] = [];
            let currentDate = new Date(startDate);
            
            while (currentDate <= endDate) {
                const daysFromNow = Math.floor((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
                let confidence = 100;
                let status: 'reliable' | 'questionable' | 'unreliable' = 'reliable';
                let reason = '';

                // Adjust confidence based on age and data completeness
                if (daysFromNow > 365) {
                    confidence = 70;
                    status = 'questionable';
                    reason = 'Historical data over 1 year old';
                } else if (daysFromNow > 180) {
                    confidence = 85;
                    status = 'questionable';
                    reason = 'Data over 6 months old';
                }

                // Add threshold if confidence changes
                if (thresholds.length === 0 || thresholds[thresholds.length - 1].confidence !== confidence) {
                    thresholds.push({
                        date: currentDate.toISOString(),
                        confidence,
                        status,
                        reason
                    });
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            setQualityTimeline(thresholds);
        }
    }, [tableStats]);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            if (!response.ok) throw new Error('Failed to fetch clients');
            const data = await response.json();
            setClients(data);
        } catch (error) {
            setError('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const fetchTableStats = async () => {
        try {
            const response = await fetch(`/api/dashboard?clientId=${selectedClient}`);
            if (!response.ok) throw new Error('Failed to fetch stats');
            const data = await response.json();
            setTableStats(data);
        } catch (error) {
            console.error('Failed to fetch table stats:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch stats');
        }
    };

    const fetchQualityMetrics = async () => {
        if (!selectedClient) return;
        
        try {
            const response = await fetch(`/api/data-quality?clientId=${selectedClient}`);
            if (!response.ok) throw new Error('Failed to fetch quality metrics');
            const data = await response.json();
            setQualityMetrics(data);
        } catch (error) {
            console.error('Failed to fetch quality metrics:', error);
        }
    };

    const calculateConfidence = (): number => {
        if (!tableStats.length) return 0;
        const stat = tableStats[0];
        
        // Factors affecting confidence:
        const freshness = calculateMissingDays(stat.max_date) <= 7 ? 100 : 70;
        const completeness = stat.row_count > 0 ? 100 : 0;
        const dateRangeCoverage = stat.min_date && stat.max_date ? 100 : 0;
        
        return Math.floor((freshness + completeness + dateRangeCoverage) / 3);
    };

    if (loading) return <div className={styles.loading}>Loading...</div>;
    if (error) return <div className={styles.error}>{error}</div>;

    return (
        <AnalyticsLayout>
            <div className={styles.container}>
                <h1>Data Quality Assessment</h1>
                
                <div className={styles.formGroup}>
                    <label htmlFor="client">Select Client</label>
                    <select
                        id="client"
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(Number(e.target.value))}
                        className={styles.select}
                    >
                        <option value={0}>Select a client...</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedClient > 0 && (
                    <>
                        <div className={styles.dashboardSection}>
                            <h2>{clients.find(c => c.id === selectedClient)?.name} - Data Overview</h2>
                            {tableStats.length > 0 ? (
                                <table className={styles.statsTable}>
                                    <thead>
                                        <tr>
                                            <th>Data Source</th>
                                            <th>Last Update</th>
                                            <th>Date Range</th>
                                            <th>Missing Days</th>
                                            <th>Row Count</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableStats.map(stat => (
                                            <tr key={stat.table_name}>
                                                <td>{stat.table_name}</td>
                                                <td>{new Date(stat.last_update).toLocaleString()}</td>
                                                <td>
                                                    {stat.min_date && stat.max_date ? 
                                                        `${new Date(stat.min_date).toLocaleDateString()} - 
                                                         ${new Date(stat.max_date).toLocaleDateString()}` : 
                                                        'No data'
                                                    }
                                                </td>
                                                <td className={styles.missingDays}>
                                                    {stat.max_date ? (
                                                        <span className={
                                                            calculateMissingDays(stat.max_date) > 7 
                                                                ? styles.warning 
                                                                : styles.ok
                                                        }>
                                                            {calculateMissingDays(stat.max_date)} days
                                                        </span>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </td>
                                                <td className={styles.rowCount}>
                                                    {formatNumber(stat.row_count)}
                                                </td>
                                                <td>
                                                    <a 
                                                        href={`/analytics/upload?client=${selectedClient}&table=${stat.table_name}`}
                                                        className={styles.button}
                                                    >
                                                        Update Data
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p>No data available for this client</p>
                            )}
                        </div>

                        <div className={styles.overviewSection}>
                            <div className={styles.overviewGrid}>
                                <div className={styles.overviewCard}>
                                    <h3>Overall Confidence</h3>
                                    <div className={styles.confidenceScore}>
                                        {calculateConfidence()}%
                                    </div>
                                </div>

                                <div className={styles.overviewCard}>
                                    <h3>Data Maturity</h3>
                                    <div className={styles.maturityInfo}>
                                        <div className={styles.maturityRow}>
                                            <span className={styles.maturityLabel}>Fresh Data:</span>
                                            <span className={styles.maturityValue}>
                                                {tableStats[0]?.row_count ? formatNumber(tableStats[0].row_count) : '0'}
                                            </span>
                                        </div>
                                        <div className={styles.maturityRow}>
                                            <span className={styles.maturityLabel}>Historical Range:</span>
                                            <span className={styles.maturityValue}>
                                                {tableStats[0]?.min_date ? 
                                                    `${new Date(tableStats[0].min_date).toLocaleDateString()} - Present` : 
                                                    'No historical data'
                                                }
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.overviewCard}>
                                    <h3>Recent Changes</h3>
                                    <div className={styles.changesInfo}>
                                        <div className={styles.maturityRow}>
                                            <span className={styles.maturityLabel}>Last 24h:</span>
                                            <span className={styles.changeCount}>
                                                {qualityMetrics[0]?.qualityMetrics?.recentChanges || 0} changes
                                            </span>
                                        </div>
                                        <div className={styles.maturityRow}>
                                            <span className={styles.maturityLabel}>Impact:</span>
                                            <span className={`${styles.impactLabel} ${
                                                qualityMetrics[0]?.qualityMetrics?.recentChanges > 10 ? 
                                                styles.impactHigh : styles.impactLow
                                            }`}>
                                                {qualityMetrics[0]?.qualityMetrics?.recentChanges > 10 ? 'High' : 'Low'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.timelineSection}>
                            <h2>Data Quality Timeline</h2>
                            <div className={styles.timelineContainer}>
                                {qualityTimeline.map((threshold, index) => {
                                    const confidence = threshold.confidence;
                                    return (
                                        <div 
                                            key={index} 
                                            className={styles.timelineItem}
                                            data-confidence={confidence}
                                        >
                                            <div className={styles.timelineDate}>
                                                {new Date(threshold.date).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </div>
                                            <div 
                                                className={styles.timelineConfidence}
                                                data-confidence={confidence}
                                            >
                                                {confidence}% Confidence
                                            </div>
                                            {threshold.reason && (
                                                <div className={styles.timelineReason}>
                                                    {threshold.reason}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className={styles.insightsSection}>
                            <h2>Detailed Quality Analysis</h2>
                            <DataQualityInsights 
                                metrics={qualityMetrics}
                                tableStats={tableStats}
                            />
                        </div>
                    </>
                )}
            </div>
        </AnalyticsLayout>
    );
};

export default DataQA;