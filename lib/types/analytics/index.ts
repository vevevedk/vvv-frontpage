// types/analytics.ts
export interface PaidShoppingChannelData {
    period: string;
    channel_group: string;
    total_sessions: number;
    engaged_sessions: number;
    avg_engagement_rate: number;
    total_events: number;
    total_revenue: number;
  }
  
  export interface PaidShoppingProductData {
    product_name: string;
    location: string;
    account: string;
    impressions: number;
    clicks: number;
    cost: number;
    avg_ctr: number;
    conversions: number;
    conversion_value: number;
    avg_conv_rate: number;
  }