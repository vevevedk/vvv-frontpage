export const DATA_TYPES = [
    {
        id: 'search_console_daily',
        name: 'Search Console Daily',
        description: 'Google Search Console query and page performance data',
        tables: ['search_console_data'],
        requiredColumns: ['date', 'query', 'page', 'clicks', 'impressions', 'position', 'ctr'],
        templateUrl: '/templates/search_console_daily.csv'
    },
    {
        id: 'campaign_performance_daily',
        name: 'Campaign Performance Daily',
        description: 'Google Ads campaign performance metrics',
        tables: ['campaign_performance_daily', 'campaigns', 'campaign_budgets'],
        requiredColumns: [
            'Day',
            'Campaign',
            'Campaign ID',
            'Account',
            'Impr.',
            'Clicks',
            'Cost',
            'Conversions',
            'Conv. value',
            'Search impr. share',
            'Campaign status'
        ],
        templateUrl: '/templates/campaign_performance_daily.csv'
    },
    {
        id: 'analytics_daily',
        name: 'Analytics Daily',
        description: 'Google Analytics daily performance metrics',
        tables: ['analytics_data'],
        requiredColumns: ['Date', 'Users', 'New Users', 'Sessions', 'Bounce Rate', 'Pages / Session', 'Avg. Session Duration'],
        templateUrl: '/templates/analytics_daily.csv'
    }
] as const;
