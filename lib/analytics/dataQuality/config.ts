export interface DataQualityConfig {
  source: string;
  maturityPeriod: number; // days
  varianceThreshold: number; // percentage
  requiredFields: string[];
  valueRanges?: {
    [field: string]: {
      min?: number;
      max?: number;
    };
  };
}

export const dataQualityConfigs: { [key: string]: DataQualityConfig } = {
  search_console_data: {
    source: 'google_search_console',
    maturityPeriod: 3,
    varianceThreshold: 10,
    requiredFields: ['client_id', 'date', 'query', 'landing_page', 'url_clicks', 'impressions', 'average_position'],
    valueRanges: {
      url_clicks: { min: 0 },
      impressions: { min: 0 },
      average_position: { min: 1, max: 100 }
    }
  }
};

// Defines data quality rules and thresholds 