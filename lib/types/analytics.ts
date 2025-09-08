export interface CountryStats {
    country: string;
    query_count: number | string;
    impressions: number | string;
    url_clicks: number | string;
    average_position: number | string;
    ctr: number | string;
}

export interface ComparisonStats extends CountryStats {
    query_count_diff: number;
    query_count_diff_pct: number;
    impressions_diff: number;
    impressions_diff_pct: number;
    clicks_diff: number;
    clicks_diff_pct: number;
    position_diff: number;
} 