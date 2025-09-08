import { CountryStats, ComparisonStats } from '../lib/types/analytics';

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Totals</h3>
                <table className="w-full">
                    <tbody className="space-y-2">
                        <tr className="flex justify-between">
                            <th className="text-sm font-medium text-gray-600">Total Queries:</th>
                            <td className="text-sm text-gray-900">{formatNumber(totals.query_count)}</td>
                        </tr>
                        <tr className="flex justify-between">
                            <th className="text-sm font-medium text-gray-600">Total Impressions:</th>
                            <td className="text-sm text-gray-900">{formatNumber(totals.impressions)}</td>
                        </tr>
                        <tr className="flex justify-between">
                            <th className="text-sm font-medium text-gray-600">Total Clicks:</th>
                            <td className="text-sm text-gray-900">{formatNumber(totals.clicks)}</td>
                        </tr>
                        <tr className="flex justify-between">
                            <th className="text-sm font-medium text-gray-600">Avg Position:</th>
                            <td className="text-sm text-gray-900">{avgPosition}</td>
                        </tr>
                        <tr className="flex justify-between">
                            <th className="text-sm font-medium text-gray-600">CTR:</th>
                            <td className="text-sm text-gray-900">{formatPercentage(totals.clicks, totals.impressions)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Totals</h3>
                <table className="w-full">
                    <tbody className="space-y-2">
                        <tr className="flex justify-between">
                            <th className="text-sm font-medium text-gray-600">Query Change:</th>
                            <td className={`text-sm ${comparisonTotals.query_count_diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatDiff(comparisonTotals.query_count_diff, totals.query_count)}
                            </td>
                        </tr>
                        <tr className="flex justify-between">
                            <th className="text-sm font-medium text-gray-600">Impression Change:</th>
                            <td className={`text-sm ${comparisonTotals.impressions_diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatDiff(comparisonTotals.impressions_diff, totals.impressions)}
                            </td>
                        </tr>
                        <tr className="flex justify-between">
                            <th className="text-sm font-medium text-gray-600">Click Change:</th>
                            <td className={`text-sm ${comparisonTotals.clicks_diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatDiff(comparisonTotals.clicks_diff, totals.clicks)}
                            </td>
                        </tr>
                        <tr className="flex justify-between">
                            <th className="text-sm font-medium text-gray-600">Position Change:</th>
                            <td className={`text-sm ${comparisonTotals.position_diff <= 0 ? 'text-green-600' : 'text-red-600'}`}>
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