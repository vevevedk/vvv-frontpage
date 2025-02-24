import { CountryStats, ComparisonStats } from '../types';
import styles from '../styles/Analytics.module.css';

interface TotalsSummaryProps {
    mainStats: CountryStats[];
    comparisonStats: ComparisonStats[];
}

const TotalsSummary: React.FC<TotalsSummaryProps> = ({ mainStats, comparisonStats }) => {
    // Helper functions
    const formatNumber = (num: number): string => {
        return isNaN(num) ? '0' : num.toLocaleString();
    };

    const formatDiff = (value: number, total: number): string => {
        if (isNaN(value) || isNaN(total)) return '0 (0.0%)';
        const pct = total !== 0 ? (value / total) * 100 : 0;
        const sign = value > 0 ? '+' : '';
        return `${sign}${formatNumber(value)} (${sign}${pct.toFixed(1)}%)`;
    };

    const calculatePosition = (position: number, impressions: number): string => {
        if (isNaN(position) || isNaN(impressions) || impressions === 0) return '0.0';
        return (position / impressions).toFixed(1);
    };

    // Calculate totals with safeguards
    const totals = mainStats.reduce((acc, curr) => ({
        query_count: (acc.query_count || 0) + (curr.query_count || 0),
        impressions: (acc.impressions || 0) + (curr.impressions || 0),
        clicks: (acc.clicks || 0) + (curr.clicks || 0),
        position: (acc.position || 0) + ((curr.position || 0) * (curr.impressions || 0)),
    }), {
        query_count: 0,
        impressions: 0,
        clicks: 0,
        position: 0,
    });

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
                            <td>{calculatePosition(totals.position, totals.impressions)}</td>
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