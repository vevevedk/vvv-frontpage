interface CampaignPerformanceDaily {
  update_date: Date;
  date: Date;
  currency_code: string;
  campaign_id: number;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversion_value: number;
  search_impression_share: string | null;
  click_share: string | null;
  client: string;
} 