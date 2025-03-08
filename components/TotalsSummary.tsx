import { CountryStats, ComparisonStats } from '../types';
import styles from '../styles/analytics/Analytics.module.css';

interface TotalsSummaryProps {
    mainStats: CountryStats[];
    comparisonStats: ComparisonStats[];
}

const TotalsSummary: React.FC<TotalsSummaryProps> = ({ mainStats, comparisonStats }) => {
    // Helper functions
    const formatNumber = (num: number): string => {
        return isNaN(num) || num === 0 ? '0' : num.toLocaleString();
    };

    const formatPercentage = (value: number, total: number): string => {
        if (!value || !total) return '0.0%';
        return ((value / total) * 100).toFixed(1) + '%';
    };

    const formatDiff = (value: number, total: number): string => {
        const numStr = formatNumber(value);
        const pctStr = formatPercentage(value, total);
        const sign = value > 0 ? '+' : '';
        return `${sign}${numStr} (${sign}${pctStr})`;
    };

    // Aggregate current period totals
    const totals = mainStats.reduce((acc, curr) => {
        const impressions = parseInt(curr.impressions as string) || 0;
        const clicks = parseInt(curr.url_clicks as string) || 0;
        const position = parseFloat(curr.average_position as string) || 0;
        
        return {
            query_count: acc.query_count + 1, // Count unique queries
            impressions: acc.impressions + impressions,
            clicks: acc.clicks + clicks,
            position: acc.position + (position * impressions), // Weighted position
            total_weight: acc.total_weight + impressions
        };
    }, {
        query_count: 0,
        impressions: 0,
        clicks: 0,
        position: 0,
        total_weight: 0
    });

    // Calculate weighted average position
    const avgPosition = totals.total_weight > 0 
        ? (totals.position / totals.total_weight).toFixed(1)
        : '0.0';

    const comparisonTotals = comparisonStats.reduce((acc, curr) => ({
        query_count_diff: (acc.query_count_diff || 0) + (curr.query_count_diff || 0),
        impressions_diff: (acc.impressions_diff || 0) + (curr.impressions_diff || 0),
        clicks_diff: (acc.clicks_diff || 0) + (curr.clicks_diff || 0),
        position_diff: (acc.position_diff || 0) + (curr.position_diff || 0),
    }), {
        query_count_diff: 0,
        impressions_diff: 0,
        clicks_diff: 0,
        position_diff: 0,
    });

    return (
        <div className={styles.totalsSummary}>
            <div className={styles.totalsSummaryBox}>
                <h3>Performance Totals</h3>
                <table>
                    <tbody>
                        <tr>
                            <th>Total Queries:</th>
                            <td>{formatNumber(totals.query_count)}</td>
                        </tr>
                        <tr>
                            <th>Total Impressions:</th>
                            <td>{formatNumber(totals.impressions)}</td>
                        </tr>
                        <tr>
                            <th>Total Clicks:</th>
                            <td>{formatNumber(totals.clicks)}</td>
                        </tr>
                        <tr>
                            <th>Avg Position:</th>
                            <td>{avgPosition}</td>
                        </tr>
                        <tr>
                            <th>CTR:</th>
                            <td>{formatPercentage(totals.clicks, totals.impressions)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className={styles.totalsSummaryBox}>
                <h3>Comparison Totals</h3>
                <table>
                    <tbody>
                        <tr>
                            <th>Query Change:</th>
                            <td className={comparisonTotals.query_count_diff >= 0 ? styles.positive : styles.negative}>
                                {formatDiff(comparisonTotals.query_count_diff, totals.query_count)}
                            </td>
                        </tr>
                        <tr>
                            <th>Impression Change:</th>
                            <td className={comparisonTotals.impressions_diff >= 0 ? styles.positive : styles.negative}>
                                {formatDiff(comparisonTotals.impressions_diff, totals.impressions)}
                            </td>
                        </tr>
                        <tr>
                            <th>Click Change:</th>
                            <td className={comparisonTotals.clicks_diff >= 0 ? styles.positive : styles.negative}>
                                {formatDiff(comparisonTotals.clicks_diff, totals.clicks)}
                            </td>
                        </tr>
                        <tr>
                            <th>Position Change:</th>
                            <td className={comparisonTotals.position_diff <= 0 ? styles.positive : styles.negative}>
                                {(comparisonTotals.position_diff || 0).toFixed(1)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TotalsSummary;