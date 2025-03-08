import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import AnalyticsLayout from '../../components/layouts/AnalyticsLayout';
import styles from '@/styles/analytics/Analytics.module.css';
import TotalsSummary from '../../components/TotalsSummary';

// Add this utility function at the top of the file
const formatNumber = (value: string | number, decimals: number = 0): string => {
    try {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return decimals > 0 ? num.toFixed(decimals) : num.toLocaleString();
    } catch (error) {
        console.error('Failed to format number:', value);
        return '0';
    }
};

// Add total calculation helper
const calculateTotals = (data: CountryStats[]): CountryStats => {
    return data.reduce((acc, curr) => ({
        country: 'Total',
        query_count: acc.query_count + curr.query_count,
        impressions: acc.impressions + curr.impressions,
        clicks: acc.clicks + curr.clicks,
        position: acc.position + (curr.position * curr.impressions), // Weighted average
        ctr: 0 // Will calculate after
    }), {
        country: 'Total',
        query_count: 0,
        impressions: 0,
        clicks: 0,
        position: 0,
        ctr: 0
    });
};

// Add comparison totals calculation
const calculateComparisonTotals = (data: ComparisonStats[]): ComparisonStats => {
    return data.reduce((acc, curr) => ({
        ...acc,
        query_count: acc.query_count + curr.query_count,
        query_count_diff: acc.query_count_diff + curr.query_count_diff,
        impressions: acc.impressions + curr.impressions,
        impressions_diff: acc.impressions_diff + curr.impressions_diff,
        clicks: acc.clicks + curr.clicks,
        clicks_diff: acc.clicks_diff + curr.clicks_diff,
        position: acc.position + (curr.position * curr.impressions), // Weighted average
        position_diff: 0 // Will calculate after
    }), {
        country: 'Total',
        query_count: 0,
        query_count_diff: 0,
        query_count_diff_pct: 0,
        impressions: 0,
        impressions_diff: 0,
        impressions_diff_pct: 0,
        clicks: 0,
        clicks_diff: 0,
        clicks_diff_pct: 0,
        position: 0,
        position_diff: 0,
        ctr: 0
    });
};

// Add interface for country stats
interface CountryStats {
    country: string;
    query_count: number;
    impressions: number;
    clicks: number;
    position: number;
    ctr: number;
}

// Update the interface to match actual data types
interface GSCData {
    date: string;
    query: string;
    landing_page: string;
    country: string;
    impressions: string;
    url_clicks: string;
    average_position: string;
}

interface Client {
    id: number;
    name: string;
}

interface ComparisonType {
    type: 'pop' | 'yoy';
    label: string;
}

interface ComparisonStats extends CountryStats {
    query_count_diff: number;
    query_count_diff_pct: number;
    impressions_diff: number;
    impressions_diff_pct: number;
    clicks_diff: number;
    clicks_diff_pct: number;
    position_diff: number;
}

const COMPARISON_TYPES: ComparisonType[] = [
    { type: 'pop', label: 'Previous Period' },
    { type: 'yoy', label: 'Year over Year' }
];

const ITEMS_PER_PAGE = 20;

const GSCPerformance: NextPage = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<number>(0);
    const [gscData, setGscData] = useState<GSCData[]>([]);
    const [comparisonData, setComparisonData] = useState<ComparisonStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState<string>(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [comparisonType, setComparisonType] = useState<'pop' | 'yoy'>('pop');
    const [isComparisonLoading, setIsComparisonLoading] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        if (selectedClient > 0) {
            fetchGSCData();
        }
    }, [selectedClient, startDate, endDate, comparisonType]);

    const fetchClients = async () => {
        try {
            const response = await fetch('/api/clients');
            if (!response.ok) throw new Error('Failed to fetch clients');
            const data = await response.json();
            setClients(data);
            setLoading(false);
        } catch (error) {
            setError('Failed to load clients');
            setLoading(false);
        }
    };

    const fetchGSCData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/gsc-performance?` + 
                new URLSearchParams({
                    clientId: selectedClient.toString(),
                    startDate,
                    endDate,
                    comparisonType
                })
            );

            if (!response.ok) throw new Error('Failed to fetch GSC data');
            const result = await response.json();

            if (!result.currentPeriod?.data || !result.comparisonPeriod?.data) {
                throw new Error('Invalid data format received from API');
            }

            const currentData = result.currentPeriod.data;
            const comparisonData = result.comparisonPeriod.data;

            // Set current period data
            setGscData(currentData);

            // Process comparison data
            const currentByCountry = aggregateByCountry(currentData);
            const comparisonByCountry = aggregateByCountry(comparisonData);

            const comparisonStats = currentByCountry.map(curr => {
                const comp = comparisonByCountry.find(c => c.country === curr.country);
                
                if (!comp) {
                    return {
                        country: curr.country,
                        query_count: curr.query_count,
                        query_count_diff: curr.query_count,
                        query_count_diff_pct: 100,
                        impressions: curr.impressions,
                        impressions_diff: curr.impressions,
                        impressions_diff_pct: 100,
                        clicks: curr.clicks,
                        clicks_diff: curr.clicks,
                        clicks_diff_pct: 100,
                        position: curr.position,
                        position_diff: 0,
                        ctr: curr.ctr
                    };
                }

                const query_diff = curr.query_count - comp.query_count;
                const query_pct = comp.query_count !== 0 ? (query_diff / comp.query_count) * 100 : 0;
                
                const imp_diff = curr.impressions - comp.impressions;
                const imp_pct = comp.impressions !== 0 ? (imp_diff / comp.impressions) * 100 : 0;
                
                const clicks_diff = curr.clicks - comp.clicks;
                const clicks_pct = comp.clicks !== 0 ? (clicks_diff / comp.clicks) * 100 : 0;
                
                const pos_diff = curr.position - comp.position;

                return {
                    country: curr.country,
                    query_count: curr.query_count,
                    query_count_diff: query_diff,
                    query_count_diff_pct: query_pct,
                    impressions: curr.impressions,
                    impressions_diff: imp_diff,
                    impressions_diff_pct: imp_pct,
                    clicks: curr.clicks,
                    clicks_diff: clicks_diff,
                    clicks_diff_pct: clicks_pct,
                    position: curr.position,
                    position_diff: pos_diff,
                    ctr: curr.ctr
                };
            });

            setComparisonData(comparisonStats);
            setError(null);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to fetch data');
            setGscData([]);
            setComparisonData([]);
        } finally {
            setIsLoading(false);
            setIsComparisonLoading(false);
        }
    };

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        if (new Date(newDate) <= new Date(endDate)) {
            setStartDate(newDate);
        } else {
            setError('Start date cannot be after end date');
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        if (new Date(newDate) >= new Date(startDate)) {
            setEndDate(newDate);
        } else {
            setError('End date cannot be before start date');
        }
    };

    const aggregateByCountry = (data: GSCData[]): CountryStats[] => {
        const countryMap = new Map<string, CountryStats>();
        
        data.forEach(row => {
            const country = row.country;
            const current = countryMap.get(country) || {
                country,
                query_count: 0,
                impressions: 0,
                clicks: 0,
                position: 0,
                ctr: 0
            };

            const impressions = parseInt(row.impressions);
            const clicks = parseInt(row.url_clicks);
            const position = parseFloat(row.average_position);

            // Update metrics
            current.query_count += 1;
            current.impressions += impressions;
            current.clicks += clicks;
            current.position = (current.position * (current.query_count - 1) + position) / current.query_count;
            current.ctr = (current.clicks / current.impressions) * 100;

            countryMap.set(country, current);
        });

        return Array.from(countryMap.values())
            .sort((a, b) => b.impressions - a.impressions);
    };

    const calculateComparison = (
        currentData: GSCData[],
        comparisonData: GSCData[],
        type: 'pop' | 'yoy'
    ): ComparisonStats[] => {
        console.log('Calculating comparison:', {
            current: currentData.length,
            comparison: comparisonData.length,
            type
        });

        const currentStats = aggregateByCountry(currentData);
        const comparisonStats = aggregateByCountry(comparisonData);

        return currentStats.map(curr => {
            const prev = comparisonStats.find(comp => comp.country === curr.country) || {
                query_count: 0,
                impressions: 0,
                clicks: 0,
                position: 0,
                ctr: 0
            };

            const query_count_diff = curr.query_count - prev.query_count;
            const impressions_diff = curr.impressions - prev.impressions;
            const clicks_diff = curr.clicks - prev.clicks;
            const position_diff = curr.position - prev.position;

            return {
                country: curr.country,
                query_count: curr.query_count,
                query_count_diff,
                query_count_diff_pct: prev.query_count ? (query_count_diff / prev.query_count) * 100 : 0,
                impressions: curr.impressions,
                impressions_diff,
                impressions_diff_pct: prev.impressions ? (impressions_diff / prev.impressions) * 100 : 0,
                clicks: curr.clicks,
                clicks_diff,
                clicks_diff_pct: prev.clicks ? (clicks_diff / prev.clicks) * 100 : 0,
                position: curr.position,
                position_diff,
                ctr: curr.ctr
            };
        });
    };

    const handleComparisonTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as 'pop' | 'yoy';
        setIsComparisonLoading(true);
        setComparisonType(newType);
        // Simulate loading for better UX
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsComparisonLoading(false);
    };

    const formatDiff = (value: number, pct: number | undefined): JSX.Element => {
        if (value === 0 && pct === 0) {
            return (
                <div className={styles.comparisonValue}>
                    <span className={styles.comparisonNumber}>0</span>
                    <span className={styles.comparisonPercentage}>(0%)</span>
                </div>
            );
        }

        const sign = value > 0 ? '+' : '';
        return (
            <div className={styles.comparisonValue}>
                <span className={styles.comparisonNumber}>
                    {sign}{formatNumber(value)}
                </span>
                <span className={styles.comparisonPercentage}>
                    {pct !== undefined ? `(${sign}${pct.toFixed(1)}%)` : ''}
                </span>
            </div>
        );
    };

    const formatPositionDiff = (value: number): string => {
        const sign = value < 0 ? '+' : '-'; // Inverse for position (lower is better)
        return `${sign}${Math.abs(value).toFixed(1)}`;
    };

    const totalPages = Math.ceil(aggregateByCountry(gscData).length / ITEMS_PER_PAGE);
    const paginatedData = aggregateByCountry(gscData).slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (loading) return (
        <AnalyticsLayout>
            <div className={styles.loading}>Loading...</div>
        </AnalyticsLayout>
    );

    if (error) return (
        <AnalyticsLayout>
            <div className={styles.error}>{error}</div>
        </AnalyticsLayout>
    );

    return (
        <AnalyticsLayout>
            <div className={styles.container}>
                <h1>Search Console Performance</h1>
                
                <div className={styles.filterSection}>
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

                    <div className={styles.dateFilters}>
                        <div className={styles.formGroup}>
                            <label htmlFor="startDate">Start Date</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                onChange={handleStartDateChange}
                                className={styles.dateInput}
                                max={endDate}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label htmlFor="endDate">End Date</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                    onChange={handleEndDateChange}
                                className={styles.dateInput}
                                min={startDate}
                            />
                        </div>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                
                {loading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : (
                    selectedClient > 0 && (
                        <div className={styles.dashboardSection}>
                            <h2 className={styles.clientName}>
                                {clients.find(c => c.id === selectedClient)?.name} - Country Performance
                            </h2>
                            <div className={styles.tablesContainer}>
                                {/* Main Table Section */}
                                <div className={styles.mainTableSection}>
                                    <h3>Country Performance</h3>
                                    <div className={styles.tableWrapper}>
                                        {isLoading && (
                                            <div className={styles.loadingOverlay}>
                                                <div className={styles.loadingSpinner} />
                                                <div className={styles.loadingText}>Loading data...</div>
                                            </div>
                                        )}
                                        <table className={styles.statsTable}>
                                            <thead>
                                                <tr>
                                                    <th>Country</th>
                                                    <th>Query #</th>
                                                    <th>Impr.</th>
                                                    <th>Clicks</th>
                                                    <th>CTR</th>
                                                    <th>Position</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedData.map((stat, index) => (
                                                    <tr key={index}>
                                                        <td>{stat.country}</td>
                                                        <td>{stat.query_count.toLocaleString()}</td>
                                                        <td>{stat.impressions.toLocaleString()}</td>
                                                        <td>{stat.clicks.toLocaleString()}</td>
                                                        <td>{stat.ctr.toFixed(1)}%</td>
                                                        <td>{stat.position.toFixed(1)}</td>
                                                    </tr>
                                                ))}
                                                {currentPage === totalPages && (
                                                    <tr className={styles.totalRow}>
                                                        <td>Total</td>
                                                        <td>{calculateTotals(gscData).query_count.toLocaleString()}</td>
                                                        <td>{calculateTotals(gscData).impressions.toLocaleString()}</td>
                                                        <td>{calculateTotals(gscData).clicks.toLocaleString()}</td>
                                                        <td>
                                                            {((calculateTotals(gscData).clicks / calculateTotals(gscData).impressions) * 100).toFixed(1)}%
                                                        </td>
                                                        <td>
                                                            {(calculateTotals(gscData).position / calculateTotals(gscData).impressions).toFixed(1)}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Comparison Table Section */}
                                <div className={styles.comparisonTableSection}>
                                    <div className={styles.comparisonHeader}>
                                        <h3>Performance Comparison</h3>
                                        <select
                                            value={comparisonType}
                                            onChange={handleComparisonTypeChange}
                                            className={styles.select}
                                        >
                                            {COMPARISON_TYPES.map(type => (
                                                <option key={type.type} value={type.type}>
                                                    vs {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.tableWrapper}>
                                        {isComparisonLoading && (
                                            <div className={styles.loadingOverlay}>
                                                <div className={styles.loadingSpinner} />
                                                <div className={styles.loadingText}>Calculating comparison...</div>
                                            </div>
                                        )}
                                        <table className={styles.statsTable}>
                                            <thead>
                                                <tr>
                                                    <th>Country</th>
                                                    <th>Query # Δ</th>
                                                    <th>Impressions Δ</th>
                                                    <th>Clicks Δ</th>
                                                    <th>Position Δ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedData.map((stat, index) => {
                                                    // Find matching comparison data
                                                    const compStat = comparisonData.find(c => c.country === stat.country);
                                                    
                                                    return (
                                                        <tr key={index}>
                                                            <td>{stat.country}</td>
                                                            <td className={compStat?.query_count_diff >= 0 ? styles.positive : styles.negative}>
                                                                {formatDiff(
                                                                    compStat?.query_count_diff || 0,
                                                                    compStat?.query_count_diff_pct || 0
                                                                )}
                                                            </td>
                                                            <td className={compStat?.impressions_diff >= 0 ? styles.positive : styles.negative}>
                                                                {formatDiff(
                                                                    compStat?.impressions_diff || 0,
                                                                    compStat?.impressions_diff_pct || 0
                                                                )}
                                                            </td>
                                                            <td className={compStat?.clicks_diff >= 0 ? styles.positive : styles.negative}>
                                                                {formatDiff(
                                                                    compStat?.clicks_diff || 0,
                                                                    compStat?.clicks_diff_pct || 0
                                                                )}
                                                            </td>
                                                            <td className={compStat?.position_diff <= 0 ? styles.positive : styles.negative}>
                                                                {formatPositionDiff(compStat?.position_diff || 0)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                )}

                {/* Single pagination control for both tables */}
                <div className={styles.paginationControls}>
                    <span className={styles.pageInfo}>
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className={styles.pageButtons}>
                        <button
                            className={styles.pageButton}
                            onClick={() => setCurrentPage(p => p - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                        <button
                            className={styles.pageButton}
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </AnalyticsLayout>
    );
};

export default GSCPerformance;